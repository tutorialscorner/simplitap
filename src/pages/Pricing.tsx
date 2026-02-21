import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Users, Building2, Layout, Shield, ArrowRight, Star, Sparkles, Loader2, LogOut, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { useSupabase } from "@/hooks/useSupabase";
import { toast } from "sonner"; // Assuming sonner is used based on other files

// Helper to load Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Pricing = () => {
    const { user, isSignedIn } = useUser();
    const navigate = useNavigate();
    const authenticatedClient = useSupabase();

    const [showPlusModal, setShowPlusModal] = useState(false);
    const [showTeamsModal, setShowTeamsModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Purchase Form State
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [accessCode, setAccessCode] = useState(""); // For coupons
    const [teamName, setTeamName] = useState(""); // Only for Teams

    // Auto-fill user details
    useEffect(() => {
        if (user) {
            setEmail(user.primaryEmailAddress?.emailAddress || "");
            setPhoneNumber(user.primaryPhoneNumber?.phoneNumber || "");
            setTeamName(`${user.firstName || 'My'}'s Team`);
        }
    }, [user]);

    const handleProtectedAction = (modalSetter: (val: boolean) => void) => {
        if (!isSignedIn) {
            navigate("/create");
            return;
        }
        modalSetter(true);
    };

    const handlePaymentSubmit = async (planType: 'plus' | 'teams') => {
        if (!user) return;
        setLoading(true);

        const isFreeAccess = accessCode.trim().toLowerCase() === "access";

        // --- FREE COUPON LOGIC (For Evangelist/Testing) ---
        if (isFreeAccess) {
            setTimeout(async () => {
                const savedData = localStorage.getItem("user_card_data");
                const data = savedData ? JSON.parse(savedData) : {};

                let updatedData = { ...data };

                if (planType === 'plus') {
                    updatedData = { ...updatedData, isPremium: true, plan: "evangelist" };
                } else {
                    // Create Team Logic for Free Access
                    try {
                        const { data: newTeam } = await authenticatedClient!
                            .from("teams")
                            .insert({
                                admin_id: user.id,
                                name: teamName,
                                plan_type: 'evangelist', // Free team plan
                                total_seats: 5,
                                seats_used: 1
                            })
                            .select()
                            .single();

                        if (newTeam) {
                            await authenticatedClient!
                                .from("profiles")
                                .update({ team_id: newTeam.id })
                                .eq("clerk_user_id", user.id);

                            updatedData = { ...updatedData, team_id: newTeam.id };
                        }
                    } catch (e) {
                        console.error("Free Team Creation Failed", e);
                        toast.error("Failed to create free team."); // Assuming toast exists
                        setLoading(false);
                        return;
                    }
                }

                localStorage.setItem("user_card_data", JSON.stringify(updatedData));
                window.dispatchEvent(new Event("local-storage-update"));

                // Sync Profile Status
                try {
                    await authenticatedClient!
                        .from('profiles')
                        .update({ is_premium: true })
                        .eq('clerk_user_id', user.id);
                } catch (e) { }

                setLoading(false);
                setShowPlusModal(false);
                setShowTeamsModal(false);
                toast.success(`${planType === 'plus' ? 'Plus' : 'Team'} Plan Activated!`);
                if (planType === 'teams') navigate("/teams");
            }, 1000);
            return;
        }

        // --- RAZORPAY LOGIC ---
        const res = await loadRazorpayScript();
        if (!res) {
            toast.error('Razorpay SDK failed to load.');
            setLoading(false);
            return;
        }

        try {
            // Validate Inputs
            if (!phoneNumber || phoneNumber.length < 10) throw new Error("Please enter a valid phone number.");
            if (!email || !email.includes('@')) throw new Error("Please enter a valid email address.");
            if (planType === 'teams' && !teamName) throw new Error("Please enter a team name.");

            // 1. Create Subscription via Backend
            const result = await fetch(`${API_BASE_URL}/api/create-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planType: planType, // 'plus' or 'teams' (backend must handle 'teams')
                    userId: user.id,
                    customerEmail: email,
                    customerPhone: phoneNumber,
                    customerName: user.fullName || "User",
                    quantity: planType === 'plus' ? 499 : 1499, // Price as quantity hack or actual quantity logic
                    // Additional team fields if needed by backend
                    teamName: teamName
                })
            });

            const data = await result.json();
            if (!result.ok) throw new Error(data.error || 'Failed to initialize subscription');

            const { subscriptionId, keyId } = data;

            // 2. Open Razorpay Checkout
            const options = {
                key: keyId,
                name: "Simplify Tap",
                description: `${planType === 'plus' ? 'Plus User' : 'Team'} Subscription`,
                subscription_id: subscriptionId,
                prefill: {
                    name: user.fullName,
                    email: email,
                    contact: phoneNumber
                },
                theme: { color: "#0F172A" },
                handler: async function (response: any) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch(`${API_BASE_URL}/api/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user.id,
                                planType: planType,
                                teamName: teamName // Pass team name for creation post-payment
                            })
                        });
                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            toast.success("Payment Successful!");

                            // IF TEAMS, CREATE TEAM RECORD
                            if (planType === 'teams') {
                                try {
                                    const { data: newTeam, error: teamError } = await authenticatedClient!
                                        .from("teams")
                                        .insert({
                                            admin_id: user.id,
                                            name: teamName || `${user.fullName}'s Team`,
                                            plan_type: 'teams',
                                            total_seats: 5,
                                            seats_used: 1,
                                            subscription_status: 'active'
                                        })
                                        .select()
                                        .single();

                                    if (teamError) throw teamError;

                                    if (newTeam) {
                                        // Update Profile
                                        const { error: profileError } = await authenticatedClient!
                                            .from("profiles")
                                            .update({ team_id: newTeam.id, is_premium: true, plan_type: 'teams' })
                                            .eq("clerk_user_id", user.id);

                                        if (profileError) console.error("Profile Link Error", profileError);

                                        // Update Local Storage
                                        const saved = localStorage.getItem("user_card_data");
                                        const parsed = saved ? JSON.parse(saved) : {};
                                        localStorage.setItem("user_card_data", JSON.stringify({
                                            ...parsed,
                                            team_id: newTeam.id,
                                            isPremium: true
                                        }));
                                    }
                                } catch (e) {
                                    console.error("Team Creation Error", e);
                                    toast.error("Payment received but team creation failed. Please contact support.");
                                }
                            } else {
                                // For Plus
                                try {
                                    await authenticatedClient!
                                        .from("profiles")
                                        .update({ is_premium: true, plan_type: 'plus' })
                                        .eq("clerk_user_id", user.id);

                                    const saved = localStorage.getItem("user_card_data");
                                    const parsed = saved ? JSON.parse(saved) : {};
                                    localStorage.setItem("user_card_data", JSON.stringify({ ...parsed, isPremium: true }));
                                } catch (e) { }
                            }

                            setShowPlusModal(false);
                            setShowTeamsModal(false);
                            window.dispatchEvent(new Event("local-storage-update"));

                            if (planType === 'teams') {
                                setTimeout(() => navigate("/teams"), 500);
                            } else {
                                navigate("/dashboard");
                            }
                        } else {
                            toast.error('Verification failed: ' + verifyData.message);
                        }
                    } catch (error) {
                        toast.error('Payment verification error');
                    }
                },
                modal: {
                    ondismiss: () => setLoading(false)
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Payment initialization failed.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#0F172A] selection:bg-primary/10">
            <Navbar />

            <main className="pt-32 md:pt-44 pb-24 px-6 md:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 md:mb-24 animate-in fade-in slide-in-from-top-10 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                        <Sparkles className="w-3 h-3" />
                        Pricing Plans
                    </div>
                    <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-[#0F172A] mb-6 leading-tight">
                        Plans for every <span className="text-primary italic">stage</span> of growth.
                    </h1>
                    <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto font-normal leading-relaxed">
                        From individuals to enterprise teams, we have the features you need to manage your professional identity.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 relative">
                    {/* Background Decorative Element */}
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-br from-primary/5 via-blue-50/50 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

                    {/* FREE PLAN */}
                    <div className="group bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col hover:-translate-y-2">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 transition-transform">
                                <Layout className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Free</h3>
                            <p className="text-[#64748B] text-sm">Essentials for getting started.</p>
                        </div>

                        <div className="mb-8 items-baseline flex gap-1">
                            <span className="text-5xl font-bold text-[#0F172A]">₹0</span>
                            <span className="text-[#64748B] text-sm font-medium">/forever</span>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                "1 Digital Business Card",
                                "Custom URL (simplifytap.com/v/you)",
                                "Standard Profile Templates",
                                "Unlimited Taps & Scans",
                                "Basic Social Links",
                                "Profile QR Code",
                                "Simplify Tap Branding"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-[#475569]">
                                    <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-slate-400" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link to="/create" className="mt-auto">
                            <Button variant="outline" className="w-full h-14 rounded-2xl border-gray-200 text-[#0F172A] font-bold hover:bg-gray-50 transition-all">
                                Get Started for Free
                            </Button>
                        </Link>
                    </div>

                    {/* PLUS PLAN */}
                    <div className="group relative bg-[#0F172A] rounded-[2rem] p-8 text-white shadow-2xl shadow-primary/20 flex flex-col hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                        {/* Glossy Overlay */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 pointer-events-none" />

                        <div className="absolute top-6 right-6">
                            <div className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg animate-pulse">
                                Most Popular
                            </div>
                        </div>

                        <div className="mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform backdrop-blur-sm border border-amber-400/20">
                                <Crown className="w-6 h-6 fill-amber-400/10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Plus</h3>
                            <p className="text-gray-400 text-sm">Full control over your card.</p>
                        </div>

                        <div className="mb-8 relative z-10 flex flex-col">
                            <div className="flex items-center gap-3">
                                <span className="text-5xl font-bold text-white tracking-tight text-glow">₹499</span>
                                <span className="text-gray-400 line-through text-lg">₹999</span>
                                <span className="text-gray-400 text-sm font-medium">/ year</span>
                            </div>
                            <span className="text-primary text-[10px] font-bold uppercase tracking-wider mt-2 opacity-80">Full Premium Access</span>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1 relative z-10">
                            {[
                                "Everything in Free",
                                "2 digital profile (Switchable)",
                                "Remove Simplify Tap Branding",
                                "Custom Card Themes",
                                "Add Company Logo & Banners",
                                "Advanced Profile Templates",
                                "Export Contacts via AI Scanner",
                                "Custom QR Code (Shapes & Colors)",
                                "Priority Email Support"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                    <div className="mt-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-[#0F172A]" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Button
                            onClick={() => handleProtectedAction(setShowPlusModal)}
                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all group/btn mt-auto relative z-10"
                        >
                            Upgrade to Plus
                            <Zap className="w-4 h-4 ml-2 fill-current group-hover/btn:animate-bounce" />
                        </Button>
                    </div>

                    {/* TEAMS PLAN */}
                    <div className="group bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col hover:-translate-y-2">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Teams</h3>
                            <p className="text-[#64748B] text-sm">Centralized control for organizations.</p>
                        </div>

                        <div className="mb-8 flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-5xl font-bold text-[#0F172A] tracking-tight">₹1499</span>
                                <span className="text-[#64748B] line-through text-lg">₹1999</span>
                                <span className="text-[#64748B] text-sm font-medium">/ year</span>
                            </div>
                            <span className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mt-2">Includes 5 Licenses</span>
                        </div>

                        <div className="bg-blue-50/50 rounded-2xl p-4 mb-8 border border-blue-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-800 uppercase">Add-on License</span>
                                <span className="text-lg font-bold text-blue-900">₹99 <span className="text-xs font-normal opacity-70">/ seat / year</span></span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                "Admin Management Dashboard",
                                "Central Card Management",
                                "Locked Company Branding",
                                "Bulk Profile Creation",
                                "Team Analytics & Insights",
                                "Export all contacts to CRM",
                                "Custom Integrated Domains",
                                "Dedicated Account Manager"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-[#475569]">
                                    <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-blue-500" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Button
                            variant="outline"
                            onClick={() => handleProtectedAction(setShowTeamsModal)}
                            className="w-full h-14 rounded-2xl border-blue-100 bg-blue-50/20 text-blue-700 font-bold hover:bg-blue-50 transition-all mt-auto"
                        >
                            Create Team
                        </Button>
                    </div>
                </div>

                {/* Comparison Section (Simplified for Premium feel) */}
                <div className="max-w-4xl mx-auto py-20 border-t border-gray-100">
                    <h2 className="text-3xl font-bold text-[#0F172A] text-center mb-16">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { q: "Can I upgrade my individual account to a Team?", a: "Yes! You can convert your profile and manage multiple seats from the Teams dashboard." },
                            { q: "Are there any hidden recurring costs?", a: "Our Plus plan is currently a one-time purchase for early evangelists. Teams is billed per license." },
                            { q: "What happens if I need more than 5 seats?", a: "You can easily add additional licenses for just ₹99/license directly from your admin panel." },
                            { q: "Is the NFC card included in the plan?", a: "NFC cards are physical products sold separately. The digital profile is included in all plans." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="font-bold text-[#0F172A] mb-3">{item.q}</h4>
                                <p className="text-sm text-[#64748B] leading-relaxed">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            <Footer />

            {/* PLUS UPGRADE MODAL */}
            <Dialog open={showPlusModal} onOpenChange={setShowPlusModal}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="bg-primary p-6 text-center">
                        <h2 className="text-xl font-bold text-white">Unlock Plus</h2>
                        <p className="text-white/80 text-sm mt-1">Professional tools for individuals</p>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                            <div>
                                <p className="font-semibold text-[#0F172A]">Plus Plan</p>
                                <p className="text-xs text-[#64748B]">One-time License</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-xl font-bold transition-colors ${accessCode.trim().toLowerCase() === 'access' ? 'text-green-600' : 'text-[#0F172A]'}`}>
                                    {accessCode.trim().toLowerCase() === 'access' ? "₹0" : "₹499"}
                                </span>
                                <p className="text-[10px] text-gray-400">/ year</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#64748B]">Email Address</Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#64748B]">Phone Number</Label>
                                <Input
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#64748B]">Coupon Code</Label>
                                <Input
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="Optional"
                                    className={`h-11 rounded-xl bg-gray-50 transition-all ${accessCode.trim().toLowerCase() === "access" ? "border-green-500 ring-1 ring-green-500/20" : "border-gray-200"}`}
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-8">
                            <Button
                                onClick={() => handlePaymentSubmit('plus')}
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Pay & Upgrade"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* TEAMS CREATION MODAL */}
            <Dialog open={showTeamsModal} onOpenChange={setShowTeamsModal}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="bg-blue-600 p-6 text-center">
                        <h2 className="text-xl font-bold text-white">Create New Team</h2>
                        <p className="text-white/80 text-sm mt-1">Collaborate and manage cards centrally</p>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                            <div>
                                <p className="font-semibold text-[#0F172A]">Teams Plan</p>
                                <p className="text-xs text-[#64748B]">Includes 5 Seats</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-xl font-bold transition-colors ${accessCode.trim().toLowerCase() === 'access' ? 'text-green-600' : 'text-[#0F172A]'}`}>
                                    {accessCode.trim().toLowerCase() === 'access' ? "₹0" : "₹1499"}
                                </span>
                                <p className="text-[10px] text-gray-400">/ year</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#64748B]">Team / Company Name</Label>
                                <Input
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                    className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#64748B]">Admin Email</Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#64748B]">Phone Number</Label>
                                <Input
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#64748B]">Coupon Code</Label>
                                <Input
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="Optional"
                                    className={`h-11 rounded-xl bg-gray-50 transition-all ${accessCode.trim().toLowerCase() === "access" ? "border-green-500 ring-1 ring-green-500/20" : "border-gray-200"}`}
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-8">
                            <Button
                                onClick={() => handlePaymentSubmit('teams')}
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Create Team & Pay"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Pricing;
