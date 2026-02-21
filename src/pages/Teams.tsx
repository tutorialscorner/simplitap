import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { ArrowRight, Layout, Building2, BarChart3, ShieldCheck, Check, Users, Crown, Lock, Palette, Image as ImageIcon, Plus, Minus, Loader2, LogOut, AlertTriangle, Trash2 } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/hooks/use-toast";
import { themes } from "@/lib/themes";
import { ImageUpload } from "@/components/simplify-tap/ImageUpload";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { API_BASE_URL } from "@/lib/api";

const Teams = () => {
    const { user, isLoaded, isSignedIn } = useUser();
    const { signOut } = useAuth();
    const authenticatedClient = useSupabase();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate("/create");
        }
    }, [isLoaded, isSignedIn, navigate]);
    const [team, setTeam] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [accessCode, setAccessCode] = useState("");
    const [seatCode, setSeatCode] = useState("");
    const [seatUnlock, setSeatUnlock] = useState(false);
    const [seatCount, setSeatCount] = useState(2);
    const [isSaving, setIsSaving] = useState(false);

    // Member State
    const [members, setMembers] = useState<any[]>([]);
    const [leftMembers, setLeftMembers] = useState<any[]>([]);
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [isOrphaned, setIsOrphaned] = useState(false);
    const [adminProfile, setAdminProfile] = useState<any>(null);

    // -- STATE FOR TEAM CREATION MODAL --
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTeamDetails, setNewTeamDetails] = useState({
        companyName: "",
        adminName: "",
        adminEmail: "",
        seatCount: 5
    });
    const [couponCode, setCouponCode] = useState(""); // Add coupon code state

    // Pre-fill Admin Details
    useEffect(() => {
        if (user) {
            setNewTeamDetails(prev => ({
                ...prev,
                adminName: user.fullName || "",
                adminEmail: user.primaryEmailAddress?.emailAddress || ""
            }));
        }
    }, [user]);

    // Safety: Force stop loading after 8 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn("Teams: Loading timed out, forcing render.");
                setLoading(false);
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, [loading]);

    // Fetch Team Data
    useEffect(() => {
        const fetchTeamData = async () => {
            if (!user || !authenticatedClient) {
                setLoading(false);
                return;
            }

            try {
                // 1. Get Profile to see WHICH team user is currently "in"
                const { data: profiles, error: profileError } = await authenticatedClient
                    .from("profiles")
                    .select("id, team_id")
                    .eq("clerk_user_id", user.id);

                if (profileError) console.error("Teams: Profile Fetch Error", profileError);

                const currentProfile = profiles?.find((p: any) => p.team_id) || profiles?.[0]; // Prefer one with team_id

                let effectiveTeamId = currentProfile?.team_id;
                let isUserAdmin = false;

                // 2. If no team linked in profile, check if they own one (Legacy/Fallback)
                if (!effectiveTeamId) {
                    const { data: ownedTeam } = await authenticatedClient
                        .from("teams")
                        .select("id")
                        .eq("admin_id", user.id)
                        .maybeSingle();

                    if (ownedTeam) {
                        effectiveTeamId = ownedTeam.id;
                        isUserAdmin = true; // If we found it by ownership, they are admin
                    }
                }

                if (effectiveTeamId) {
                    // 3. Fetch Team Details
                    const { data: teamData, error: teamError } = await authenticatedClient
                        .from("teams")
                        .select("*")
                        .eq("id", effectiveTeamId)
                        .maybeSingle();

                    if (teamError) console.error("Teams: Team Fetch Error", teamError);

                    if (teamData) {
                        // Check Admin Status DEFINITIVELY
                        isUserAdmin = teamData.admin_id === user.id;

                        setTeam(teamData);
                        setIsAdmin(isUserAdmin);

                        // If Admin, set seat count for UI
                        if (isUserAdmin) setSeatCount(teamData.total_seats);

                        // Fetch Members
                        const { data: membersData, error: membersError } = await authenticatedClient
                            .from("team_members")
                            .select("*")
                            .eq("team_id", teamData.id);

                        if (membersError) console.error("Teams: Members Fetch Error", membersError);

                        if (membersData) {
                            if (isUserAdmin) {
                                setMembers(membersData.filter((m: any) => m.status !== 'left'));
                                setLeftMembers(membersData.filter((m: any) => m.status === 'left'));
                            } else {
                                // Members see everyone (but component handles filtering)
                                setMembers(membersData);
                            }
                        }

                        // Fetch Admin Profile for Member View
                        if (!isUserAdmin) {
                            const { data: adminData } = await authenticatedClient
                                .from("profiles")
                                .select("email, card_mail, first_name, last_name")
                                .eq("clerk_user_id", teamData.admin_id)
                                .maybeSingle();

                            if (adminData) setAdminProfile(adminData);
                        }

                        // SYNC LOCAL STORAGE FOR NAVBAR
                        const saved = localStorage.getItem("user_card_data");
                        const parsed = saved ? JSON.parse(saved) : {};
                        localStorage.setItem("user_card_data", JSON.stringify({
                            ...parsed,
                            isPremium: true,
                            team_id: teamData.id
                        }));
                        window.dispatchEvent(new Event("local-storage-update"));

                    } else {
                        console.warn("User linked to non-existent team:", effectiveTeamId);
                        setIsOrphaned(true);
                    }
                } else {
                    console.log("Teams: No effective team found. Redirecting to Pricing.");
                    navigate("/pricing");
                }

            } catch (err) {
                console.error("Error fetching team:", err);
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded && isSignedIn) {
            fetchTeamData();
        } else if (isLoaded && !isSignedIn) {
            setLoading(false);
        }
    }, [isLoaded, isSignedIn, user]);

    const handleLeaveTeam = async () => {
        if (!user || !authenticatedClient) return;

        if (confirm("Are you sure you want to leave this team? You will lose access to team features.")) {
            setIsSaving(true);
            try {
                // 1. Try RPC logic first
                const { data, error } = await authenticatedClient.rpc('leave_team', {
                    user_email: user?.primaryEmailAddress?.emailAddress
                });

                if (error || (data && typeof data === 'string' && data.startsWith("Error"))) {
                    console.warn("RPC Leave failed, resolving manually...", error || data);

                    // 2. Manual Fallback: Unlink profile
                    const { error: profileError } = await authenticatedClient
                        .from("profiles")
                        .update({ team_id: null, is_premium: false })
                        .eq("clerk_user_id", user.id);

                    if (profileError) throw profileError;

                    // 3. Manual Fallback: Update member status (if permissions allow)
                    if (user?.primaryEmailAddress?.emailAddress) {
                        await authenticatedClient
                            .from("team_members")
                            .update({ status: 'left' })
                            .eq("email", user.primaryEmailAddress.emailAddress)
                            .eq("team_id", team.id);
                    }
                }

                toast({ title: "Left Team", description: "You have successfully left the team." });

                // Clear local link immediately
                localStorage.removeItem("user_card_data");

                navigate("/dashboard");
                window.location.reload();

            } catch (error: any) {
                console.error("Leave Team Error:", error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to leave team. Please try again or contact support.",
                    variant: "destructive"
                });
            } finally {
                setIsSaving(false);
            }
        }
    };

    // -- VIEW: ORPHANED TEAM --
    if (isOrphaned) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Team Not Found</h1>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            You are linked to a team that no longer exists. This usually happens if the team admin deleted the team but your profile wasn't fully updated.
                        </p>
                    </div>
                    <Button onClick={handleLeaveTeam} className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                        Reset My Profile
                    </Button>
                </div>
            </div>
        );
    }

    const handleJoin = async () => {
        if (!user || !authenticatedClient) {
            toast({ title: "Please sign in", description: "You need to be signed in to join.", variant: "destructive" });
            navigate("/signin");
            return;
        }

        if (accessCode.toLowerCase().trim() !== "access") {
            toast({ title: "Invalid Code", description: "The access code you entered is incorrect.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            // 1. Create Team
            const { data: newTeam, error: teamError } = await authenticatedClient
                .from("teams")
                .insert({
                    admin_id: user.id,
                    name: `${user.firstName || 'My'}'s Team`,
                    plan_type: 'evangelist',
                    total_seats: 2,
                    seats_used: 1, // Admin counts as 1
                    theme_color: 'classic-white', // Default
                })
                .select()
                .single();

            if (teamError) throw teamError;

            // 2. Update User Profile to link to Team
            const { error: profileError } = await authenticatedClient
                .from("profiles")
                .update({ team_id: newTeam.id })
                .eq("clerk_user_id", user.id);

            if (profileError) {
                console.error("Link profile error", profileError);
                // Non-critical? User is admin anyway.
            }

            setTeam(newTeam);
            setIsAdmin(true);
            setSeatCount(newTeam.total_seats);
            toast({ title: "Welcome to Teams!", description: "You are now a Team Admin with 2 free seats." });

        } catch (error: any) {
            console.error("Error creating team:", error);
            toast({ title: "Error", description: error.message || "Failed to create team.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSeatUnlock = () => {
        if (seatCode.toLowerCase().trim() === "seat") {
            setSeatUnlock(true);
            toast({ title: "Seat Management Unlocked", description: "You can now adjust your seat count." });
        } else {
            toast({ title: "Invalid Code", description: "Invalid code for adding seats.", variant: "destructive" });
        }
    };

    const updateSeats = async () => {
        if (!team || !authenticatedClient) return;
        setIsSaving(true);
        try {
            // 1. Update Database
            const { error } = await authenticatedClient
                .from("teams")
                .update({ total_seats: seatCount })
                .eq("id", team.id);

            if (error) throw error;

            // 2. Update Razorpay Subscription (if exists)
            // Fetch profile to get subscription ID
            const { data: profile } = await authenticatedClient
                .from("profiles")
                .select("razorpay_subscription_id")
                .eq("clerk_user_id", user?.id)
                .single();

            if (profile?.razorpay_subscription_id) {
                const finalPrice = seatCount <= 5 ? 1499 : 1499 + (seatCount - 5) * 99;
                const subRes = await fetch(`${API_BASE_URL}/api/update-subscription-seats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscriptionId: profile.razorpay_subscription_id,
                        quantity: finalPrice // Send price as quantity for ₹1 plan
                    })
                });

                if (!subRes.ok) {
                    console.error("Failed to update razorpay subscription quantity");
                    toast({ title: "Note", description: "Team updated, but billing update failed. Please contact support." });
                }
            }

            // Update local state
            setTeam({ ...team, total_seats: seatCount });
            const finalPrice = seatCount <= 5 ? 1499 : 1499 + (seatCount - 5) * 99;
            toast({ title: "Seats Updated", description: `Total seats set to ${seatCount}. Payment of ₹${finalPrice}/mo will be applied.` });
            setSeatUnlock(false);
            setSeatCode("");

        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleThemeUpdate = async (themeId: string) => {
        if (!team || !authenticatedClient) return;

        const selectedTheme = themes.find(t => t.id === themeId);
        if (!selectedTheme) return;

        // Optimistic update
        const oldTheme = team.theme_color;
        const oldStyle = team.style;

        const newStyle = {
            ...(team.style || {}),
            customColors: {
                primary: selectedTheme.colors.primary,
                secondary: selectedTheme.colors.secondary,
                background: selectedTheme.colors.cardBackground || '#ffffff',
                text: selectedTheme.colors.text || '#000000'
            }
        };

        setTeam({ ...team, theme_color: themeId, style: newStyle });

        const { error } = await authenticatedClient
            .from("teams")
            .update({
                theme_color: themeId,
                style: newStyle
            })
            .eq("id", team.id);

        if (error) {
            setTeam({ ...team, theme_color: oldTheme, style: oldStyle });
            toast({ title: "Update Failed", description: "Could not update team theme.", variant: "destructive" });
        } else {
            toast({ title: "Theme Updated", description: "Design theme synchronized for all members." });
        }
    };

    const handleTemplateUpdate = async (templateId: string) => {
        if (!team || !authenticatedClient) return;

        // Optimistic update
        const oldTemplate = team.template_id;
        setTeam({ ...team, template_id: templateId });

        const { error } = await authenticatedClient
            .from("teams")
            .update({ template_id: templateId })
            .eq("id", team.id);

        if (error) {
            setTeam({ ...team, template_id: oldTemplate });
            console.error("Template Update Error:", error);
            toast({
                title: "Update Failed",
                description: "Could not update team template. Please ensure the database schema is updated.",
                variant: "destructive"
            });
        } else {
            toast({ title: "Template Updated", description: "Card layout updated for all members." });
        }
    };

    const handleAddMember = async () => {
        if (!newMemberEmail || !team || !authenticatedClient) return;

        // Basic Validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)) {
            toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
            return;
        }

        // Check Duplicates
        if (members.some(m => m.email.toLowerCase() === newMemberEmail.toLowerCase())) {
            toast({ title: "Already Added", description: "This user is already in your team.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            // Check if user already exists (even if 'left')
            const { data: existingMember } = await authenticatedClient
                .from("team_members")
                .select("*")
                .eq("team_id", team.id)
                .eq("email", newMemberEmail.toLowerCase())
                .maybeSingle();

            let memberData;

            if (existingMember) {
                // UPDATE existing member
                const { data, error } = await authenticatedClient
                    .from("team_members")
                    .update({
                        status: 'invited',
                        role: 'member', // Ensure role is reset if needed
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", existingMember.id)
                    .select()
                    .single();

                if (error) throw error;
                memberData = data;

                // If they were in 'leftMembers' list, move them back to 'members'
                setLeftMembers(leftMembers.filter(m => m.id !== existingMember.id));
                // Check if already in 'members' (shouldn't be if filtered correctly, but safe to check)
                if (!members.some(m => m.id === existingMember.id)) {
                    setMembers([...members, data]);
                } else {
                    // Update inside members list
                    setMembers(members.map(m => m.id === existingMember.id ? data : m));
                }

            } else {
                // INSERT new member
                const { data, error } = await authenticatedClient
                    .from("team_members")
                    .insert({
                        team_id: team.id,
                        email: newMemberEmail.toLowerCase(),
                        role: 'member',
                        status: 'invited'
                    })
                    .select()
                    .single();

                if (error) throw error;
                memberData = data;
                setMembers([...members, data]);
            }

            // --- SEND EMAIL INVITE (Common for both insert and update) ---
            try {
                const inviteLink = `${window.location.origin}/dashboard`;
                fetch(`${API_BASE_URL}/api/send-invite`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: newMemberEmail,
                        teamName: team.name || team.company_name || "Your Team",
                        inviteLink
                    })
                }).catch(e => console.error("Email send failed", e));

            } catch (iframeError) {
                console.warn("Could not trigger email endpoint", iframeError);
            }

            setNewMemberEmail("");

            // Update Seat Usage (Only if it was a new insert or re-activating a 'left' member who wasn't counted?)
            // Actually, 'left' members shouldn't count towards seats usually, but let's assume they freed up a seat when they left.
            // If they are re-added, they take a seat.
            // We should ideally check if seat count needs incrementing.
            // For simplicity, let's just increment if it's a new insert OR if retrieving from 'left'.

            if (!existingMember || existingMember.status === 'left') {
                setTeam({ ...team, seats_used: team.seats_used + 1 });
                await authenticatedClient
                    .from("teams")
                    .update({ seats_used: team.seats_used + 1 })
                    .eq("id", team.id);
            }

            toast({ title: "Invite Sent", description: `${newMemberEmail} has been invited to the team.` });

        } catch (error: any) {
            console.error("Add Member Error:", error);
            // Handle unique constraint violation gracefully if race condition
            if (error.code === '23505') {
                toast({ title: "Already Exists", description: "User is already in the team (check inactive list).", variant: "destructive" });
            } else {
                toast({ title: "Failed to Add", description: error.message, variant: "destructive" });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!team || !authenticatedClient) return;

        try {
            // Optimistic remove
            const memberToRemove = members.find(m => m.id === memberId);
            setMembers(members.filter(m => m.id !== memberId));

            const { error } = await authenticatedClient
                .from("team_members")
                .delete()
                .eq("id", memberId);

            if (error) throw error;

            if (memberToRemove) {
                setTeam((prev: any) => ({ ...prev, seats_used: Math.max(1, prev.seats_used - 1) }));
                await authenticatedClient
                    .from("teams")
                    .update({ seats_used: Math.max(1, team.seats_used - 1) })
                    .eq("id", team.id);
            }

            toast({ title: "Removed", description: "Member removed from team." });

        } catch (error: any) {
            toast({ title: "Error", description: "Could not remove member.", variant: "destructive" });
            // Revert fetch potentially needed here for full robustness
        }
    };

    const handleLogoUpload = async (file: File) => {
        if (!user || !authenticatedClient || !team) return;

        try {
            const path = `teams/${team.id}/logo.jpg`;
            const { data, error } = await supabase.storage.from('card-assets').upload(path, file, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('card-assets').getPublicUrl(path);
            const publicUrlWithAuth = `${publicUrl}?t=${new Date().getTime()}`;

            const { error: dbError } = await authenticatedClient
                .from("teams")
                .update({ logo_url: publicUrlWithAuth })
                .eq("id", team.id);

            if (dbError) throw dbError;

            setTeam({ ...team, logo_url: publicUrlWithAuth });
            toast({ title: "Logo Updated", description: "Team logo has been set for all members." });

        } catch (error: any) {
            console.error("Upload Error:", error);
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        }
    };



    const handleDeleteTeam = async () => {
        if (!confirm("WARNING: Are you sure you want to PERMANENTLY DELETE this team? \n\n- All members (including you) will be downgraded to the Free plan.\n- All team data will be lost.\n- This action cannot be undone.")) {
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await authenticatedClient.rpc('delete_team');
            if (error) throw error;

            toast({ title: "Team Deleted", description: "The team has been dissolved and all members downgraded." });
            navigate("/dashboard");
            window.location.reload();
        } catch (error: any) {
            console.error("Delete Team Error:", error);
            toast({ title: "Error", description: "Failed to delete team.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // -- VIEW: LOADING --
    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    // -- VIEW: ADMIN DASHBOARD --
    if (team) {
        return (
            <div className="min-h-screen bg-slate-50 text-[#0F172A] pb-24">
                <Navbar />
                <main className="pt-28 px-4 md:px-8 max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#0F172A]">Team Dashboard</h1>
                            <p className="text-[#64748B]">Manage seats, branding, and members.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                            <Crown className="w-4 h-4" />
                            <span className="font-semibold text-sm">{isAdmin ? "Early Evangelist Plan" : "Team Member"}</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* 1. SEATS MANAGEMENT (Admin Only) */}
                        {isAdmin && (
                            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Seat Management
                                </h2>

                                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-medium text-slate-500">Seats Used</span>
                                        <span className="text-2xl font-bold text-[#0F172A]">{team.seats_used} / {team.total_seats}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all duration-500"
                                            style={{ width: `${Math.min((team.seats_used / team.total_seats) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        You have {team.total_seats - team.seats_used} seats remaining.
                                    </p>
                                </div>

                                {!seatUnlock ? (
                                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 border border-dashed border-slate-300 rounded-xl">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-[#0F172A] block mb-1">Add More Seats</label>
                                            <p className="text-xs text-slate-500">Enter access code "seat" to adjust capacity.</p>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Input
                                                value={seatCode}
                                                onChange={(e) => setSeatCode(e.target.value)}
                                                placeholder="Code"
                                                className="w-full sm:w-32"
                                            />
                                            <Button onClick={handleSeatUnlock} variant="outline">Unlock</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                            <label className="text-sm font-semibold text-[#0F172A] block mb-3">Adjust Seat Count</label>
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="outline" size="icon"
                                                    onClick={() => setSeatCount(Math.max(5, seatCount - 1))}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="text-2xl font-mono font-bold w-12 text-center">{seatCount}</span>
                                                <Button
                                                    variant="outline" size="icon"
                                                    onClick={() => setSeatCount(seatCount + 1)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="mt-4 flex justify-between items-center text-sm">
                                                <span className="text-slate-600">Monthly Cost</span>
                                                <span className="font-bold">₹{seatCount <= 5 ? 1499 : 1499 + (seatCount - 5) * 99}/mo</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" onClick={() => setSeatUnlock(false)}>Cancel</Button>
                                            <Button onClick={updateSeats} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Update Plan"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. TEAM LOGO & CARD STYLE */}
                        <div className={`${isAdmin ? "" : "md:col-span-3"} bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6`}>
                            {/* Logo */}
                            <div>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-primary" />
                                    Team Identity
                                </h2>
                                <p className="text-sm text-slate-500 mb-4">Logo & Name fixed for all members.</p>

                                <div className="flex justify-center mb-6">
                                    <div className={`relative group ${!isAdmin ? 'pointer-events-none opacity-90' : ''}`}>
                                        <ImageUpload
                                            currentImageUrl={team.logo_url}
                                            onUpload={handleLogoUpload}
                                            label="Upload Logo"
                                            isCircular={true}
                                            className="w-32 h-32 border-4 border-slate-50 shadow-md bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Company Name Input */}
                            <div>
                                <label className="text-sm font-semibold text-[#0F172A] block mb-2">Company Name</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={team.company_name || ""}
                                        onChange={(e) => setTeam({ ...team, company_name: e.target.value })}
                                        placeholder="e.g. Acme Corp"
                                        disabled={!isAdmin}
                                    />
                                    {isAdmin && (
                                        <Button onClick={async () => {
                                            setIsSaving(true);
                                            try {
                                                const { error } = await authenticatedClient
                                                    .from("teams")
                                                    .update({ company_name: team.company_name })
                                                    .eq("id", team.id);
                                                if (error) throw error;
                                                toast({ title: "Saved", description: "Company name updated for all members." });
                                            } catch (e) {
                                                toast({ title: "Error", description: "Failed to save name.", variant: "destructive" });
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }} disabled={isSaving}>
                                            Save
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. MEMBER MANAGEMENT */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Team Members
                                </h2>
                                <p className="text-sm text-slate-500">Invite members via email.</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">{members.length + 1} / {team.total_seats} Seats Filled</span>
                            </div>
                        </div>

                        {/* Add Member Form (Admin Only) */}
                        {isAdmin && (
                            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                                <h3 className="text-sm font-semibold mb-3">Add New Member</h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                        placeholder="Colleague's Email"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                        className="bg-white"
                                    />
                                    <Button onClick={handleAddMember} disabled={isSaving || (members.length + 1 >= team.total_seats)} className="bg-primary hover:bg-primary/90 whitespace-nowrap">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
                                    </Button>
                                </div>
                                {members.length + 1 >= team.total_seats && (
                                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Limit reached. Add more seats to invite others.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Members List */}
                        <div className="space-y-3">
                            {/* Admin (Self) */}
                            {isAdmin && (
                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                            YOU
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">Team Admin</div>
                                            <div className="text-xs text-slate-400">{user?.primaryEmailAddress?.emailAddress}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Crown className="w-3 h-3 text-amber-500" />
                                        <span className="text-xs bg-primary/10 text-teal-700 px-2 py-1 rounded-full font-medium">Active</span>
                                    </div>
                                </div>
                            )}

                            {/* Team Admin (Viewed by Member) */}
                            {!isAdmin && adminProfile && (
                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                                            {adminProfile.first_name?.charAt(0) || 'A'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{adminProfile.first_name ? `${adminProfile.first_name} ${adminProfile.last_name || ''}` : 'Team Admin'}</div>
                                            <div className="text-xs text-slate-400">{adminProfile.email || adminProfile.card_mail}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Crown className="w-3 h-3 text-amber-500" />
                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-600">Admin</span>
                                    </div>
                                </div>
                            )}

                            {/* Current User (as Member) */}
                            {!isAdmin && (
                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                            YOU
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">Team Member</div>
                                            <div className="text-xs text-slate-400">{user?.primaryEmailAddress?.emailAddress}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-primary/10 text-teal-700 px-2 py-1 rounded-full font-medium">Active</span>
                                </div>
                            )}

                            {/* Invited Members (Filter out self) */}
                            {members
                                .filter((m: any) => m.email.toLowerCase() !== user?.primaryEmailAddress?.emailAddress?.toLowerCase())
                                .map((m: any) => (
                                    <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                                                {m.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{m.email}</div>
                                                <div className="text-xs text-slate-400">Member</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {m.status === 'active' ? 'Active' : 'Invited'}
                                            </span>
                                            {isAdmin && (
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500" onClick={() => handleRemoveMember(m.id)}>
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                            {/* Show Left Members (Admin Only) */}
                            {isAdmin && leftMembers.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recently Left</h4>
                                    {leftMembers.map((m: any) => (
                                        <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg opacity-75">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                                                    {m.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-slate-600">{m.email}</div>
                                                    <div className="text-xs text-slate-400">Left {new Date(m.updated_at || m.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-medium">Inactive</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Leave Team Button (Non-Admin) inside Member Card */}
                        {!isAdmin && (
                            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center">
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 text-sm gap-2 w-full sm:w-auto"
                                    onClick={handleLeaveTeam}
                                    disabled={isSaving}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Leave Team
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* 4. TEAM CARD STYLE (Admin Only) */}
                    {isAdmin && (
                        <div className="space-y-8">
                            {/* Template Selection */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-primary" />
                                    Card Template
                                </h2>
                                <p className="text-sm text-slate-500 mb-6">Choose a unified layout for all team member digital cards.</p>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                    {['Modern', 'Sleek', 'Minimal', 'Professional', 'Creative'].map((template) => (
                                        <div
                                            key={template}
                                            onClick={() => handleTemplateUpdate(template.toLowerCase())}
                                            className={`
                                                cursor-pointer group space-y-2 relative
                                                ${team.template_id === template.toLowerCase() ? 'scale-105' : 'hover:scale-102'}
                                                transition-all
                                            `}
                                        >
                                            <div className={`
                                                h-32 rounded-xl border-2 overflow-hidden relative transition-all bg-slate-50
                                                ${team.template_id === template.toLowerCase() ? 'border-primary ring-4 ring-primary/10' : 'border-slate-100 group-hover:border-slate-200'}
                                            `}>
                                                {/* Mini Mockup */}
                                                <div className="w-full h-full relative p-2">
                                                    <div className="w-full h-full border border-slate-200 rounded-md bg-white overflow-hidden relative shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                                                        {/* Header/Banner Area */}
                                                        {template !== 'Minimal' && (
                                                            <div className={`w-full ${template === 'Creative' ? 'h-[35%]' : 'h-[25%]'} bg-slate-100 flex items-center justify-center`}>
                                                                {template === 'Professional' && <div className="w-full h-full bg-slate-200/50" />}
                                                            </div>
                                                        )}

                                                        {/* Avatar Mockup */}
                                                        <div className={`
                                                            absolute bg-slate-300 ring-2 ring-white
                                                            ${template === 'Modern' ? 'w-5 h-5 rounded-full left-1/2 -translate-x-1/2 top-[15%]' : ''}
                                                            ${template === 'Sleek' ? 'w-4 h-4 rounded-full left-2 top-[18%]' : ''}
                                                            ${template === 'Minimal' ? 'w-8 h-8 rounded-full left-1/2 -translate-x-1/2 top-4 border-2 border-slate-100' : ''}
                                                            ${template === 'Professional' ? 'w-5 h-5 rounded-md left-2 top-2' : ''}
                                                            ${template === 'Creative' ? 'w-6 h-6 rounded-full left-1/2 -translate-x-1/2 top-[22%] ring-offset-1 ring-1 ring-slate-400' : ''}
                                                        `} />

                                                        {/* Text Lines */}
                                                        <div className={`absolute w-full px-2 space-y-1
                                                            ${template === 'Modern' ? 'top-[45%] text-center left-0' : ''}
                                                            ${template === 'Sleek' ? 'top-[40%] left-0' : ''}
                                                            ${template === 'Minimal' ? 'top-[60%] text-center left-0' : ''}
                                                            ${template === 'Professional' ? 'top-[5%] left-[2.5rem]' : ''}
                                                            ${template === 'Creative' ? 'top-[55%] text-center left-0' : ''}
                                                        `}>
                                                            <div className={`h-1 rounded-full bg-slate-800 mx-auto ${template === 'Professional' || template === 'Sleek' ? 'ml-0 w-[60%]' : 'w-[40%]'}`} />
                                                            <div className={`h-[2px] rounded-full bg-slate-400 mx-auto ${template === 'Professional' || template === 'Sleek' ? 'ml-0 w-[40%]' : 'w-[25%]'}`} />
                                                        </div>

                                                        {/* Bottom Elements (Buttons/Links) */}
                                                        <div className={`absolute bottom-2 left-0 w-full px-2 flex gap-1 justify-center
                                                            ${template === 'Professional' || template === 'Sleek' ? 'justify-start px-2' : ''}
                                                        `}>
                                                            <div className="w-3 h-3 rounded-sm bg-slate-200" />
                                                            <div className="w-3 h-3 rounded-sm bg-slate-200" />
                                                            <div className="w-3 h-3 rounded-sm bg-slate-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                                {team.template_id === template.toLowerCase() && (
                                                    <div className="absolute inset-0 bg-primary/5 flex items-center justify-center animate-in fade-in">
                                                        <div className="bg-white p-1 rounded-full text-primary shadow-md border border-primary/20"><Check className="w-4 h-4" /></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-center text-xs font-bold ${team.template_id === template.toLowerCase() ? 'text-primary' : 'text-slate-500'}`}>
                                                {template}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Theme Color Selection */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-primary" />
                                    Card Theme
                                </h2>
                                <p className="text-sm text-slate-500 mb-6">Select a mandatory color palette for the team.</p>

                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                                    {themes.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleThemeUpdate(t.id)}
                                            className={`
                                            relative group rounded-xl overflow-hidden aspect-[3/4] border-2 transition-all
                                            ${team.theme_color === t.id ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent hover:border-slate-200'}
                                        `}
                                        >
                                            <div
                                                className={`w-full h-full ${t.colors.background.startsWith('bg-') ? t.colors.background : ''}`}
                                                style={{
                                                    background: t.backgroundImage,
                                                    backgroundColor: t.colors.background.startsWith('bg-') ? undefined : t.colors.background
                                                }}
                                            />
                                            {team.theme_color === t.id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] py-1 text-center truncate px-1 font-medium">
                                                {t.name}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. DANGER ZONE (Admin Only) */}
                    {isAdmin && (
                        <div className="mt-8 border border-red-200 rounded-2xl p-6 bg-red-50/50">
                            <h2 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h2>
                            <p className="text-sm text-red-700 mb-4">
                                Deleting the team is irreversible. All members (including you) will be downgraded to the basic free plan and lose access to premium features immediately.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteTeam}
                                disabled={isSaving}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Delete Team
                            </Button>
                        </div>
                    )}

                </main>
            </div>
        );
    }

    // -- VIEW: MEMBER DASHBOARD (Restricted View) --
    if (team && !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 text-[#0F172A] pb-24">
                <Navbar />
                <main className="pt-28 px-4 md:px-8 max-w-4xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#0F172A]">{team.name || "Team Dashboard"}</h1>
                            <p className="text-[#64748B]">You are a member of this team.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                            <Users className="w-4 h-4" />
                            <span className="font-semibold text-sm">Team Member</span>
                        </div>
                    </div>

                    {/* Team Members List (Read Only) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Team Members
                        </h2>

                        <div className="space-y-3">
                            {/* Team Admin */}
                            {adminProfile && (
                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                                            {adminProfile.first_name?.charAt(0) || 'A'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{adminProfile.first_name ? `${adminProfile.first_name} ${adminProfile.last_name || ''}` : 'Team Admin'}</div>
                                            <div className="text-xs text-slate-400">{adminProfile.email || adminProfile.card_mail}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Crown className="w-3 h-3 text-amber-500" />
                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-600">Admin</span>
                                    </div>
                                </div>
                            )}

                            {/* Current User (YOU) */}
                            <div className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                        YOU
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm text-emerald-900">You</div>
                                        <div className="text-xs text-emerald-600/80">{user?.primaryEmailAddress?.emailAddress}</div>
                                    </div>
                                </div>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Active</span>
                            </div>

                            {/* Other Members */}
                            {members
                                .filter((m: any) => m.email.toLowerCase() !== user?.primaryEmailAddress?.emailAddress?.toLowerCase())
                                .map((m: any) => (
                                    <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                                                {m.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{m.email}</div>
                                                <div className="text-xs text-slate-400">Member</div>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.status === 'active' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>
                                            {m.status === 'active' ? 'Active' : 'Invited'}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Leave Team Button */}
                    <div className="flex justify-center pt-8">
                        <Button
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 text-sm gap-2"
                            onClick={handleLeaveTeam}
                            disabled={isSaving}
                        >
                            <LogOut className="w-4 h-4" />
                            Leave Team
                        </Button>
                    </div>

                </main>
            </div>
        );
    }



    // -- RAZORPAY PAYMENT HANDLER --
    const handleTeamSubscription = async () => {
        if (!user || !authenticatedClient) return;

        // Bypass Payment if Coupon Code is "access"
        if (couponCode.toLowerCase().trim() === "access") {
            await createTeamAfterPayment();
            return;
        }

        setIsSaving(true);
        const res = await loadRazorpayScript();

        if (!res) {
            alert("Razorpay SDK failed to load. Are you online?");
            setIsSaving(false);
            return;
        }

        try {
            // Calculate final amount here
            const currentSeatCount = newTeamDetails.seatCount;
            const teamsBasePrice = 1499;
            const teamsAddonPrice = 99;
            const totalQuantityToCharge = currentSeatCount <= 5 ? teamsBasePrice : teamsBasePrice + (currentSeatCount - 5) * teamsAddonPrice;

            // 1. Create Subscription via Backend
            const result = await fetch(`${API_BASE_URL}/api/create-subscription`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planType: "teams",
                    userId: user.id,
                    customerEmail: newTeamDetails.adminEmail || user.primaryEmailAddress?.emailAddress,
                    customerPhone: user.primaryPhoneNumber?.phoneNumber,
                    customerName: newTeamDetails.adminName || user.fullName || "Team Admin",
                    // PASS TOTAL AMOUNT AS QUANTITY for ₹1 unit plan strategy
                    quantity: totalQuantityToCharge,
                }),
            });

            const resultText = await result.text();
            let data;
            try {
                data = JSON.parse(resultText);
            } catch (e) {
                console.error("API Response was not JSON:", resultText);
                throw new Error(`Server Error: ${result.status} ${result.statusText}`);
            }

            if (!result.ok) {
                throw new Error(data.error || "Failed to create subscription");
            }

            const { subscriptionId, keyId } = data;

            // 2. Open Razorpay Checkout
            const options = {
                key: keyId,
                name: "Simplify Tap",
                description: `Teams Plan (${currentSeatCount} Seats)`,
                subscription_id: subscriptionId,
                method: {
                    upi: true,
                    card: true,
                    netbanking: false,
                    wallet: false,
                    emi: false,
                },
                handler: async function (response: any) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch(`${API_BASE_URL}/api/verify-payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user.id,
                                planType: "teams",
                            }),
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            // Payment Success -> Create Team
                            await createTeamAfterPayment();
                        } else {
                            alert("Payment verification failed: " + verifyData.message);
                        }
                    } catch (error) {
                        console.error(error);
                        alert("Payment verification error");
                    }
                },
                prefill: {
                    name: newTeamDetails.adminName || user.fullName,
                    email: newTeamDetails.adminEmail || user.primaryEmailAddress?.emailAddress,
                    contact: user.primaryPhoneNumber?.phoneNumber,
                },
                theme: {
                    color: "#0F172A",
                },
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();
            setIsSaving(false);
        } catch (err: any) {
            console.error("Payment Error:", err);
            alert("Payment initialization failed: " + err.message);
            setIsSaving(false);
        }
    };

    const createTeamAfterPayment = async () => {
        setIsSaving(true);
        const isUnlimited = couponCode.toLowerCase().trim() === "access";
        const seats = isUnlimited ? 999999 : newTeamDetails.seatCount;

        try {
            // 1. Create Team
            const { data: newTeam, error: teamError } = await authenticatedClient
                .from("teams")
                .insert({
                    admin_id: user?.id,
                    name: newTeamDetails.companyName || `${user?.firstName || 'My'}'s Team`,
                    plan_type: 'teams', // CORRECT PLAN TYPE
                    total_seats: seats, // Use calculated seat count
                    seats_used: 1,
                    theme_color: 'classic-white',
                    subscription_status: 'active'
                })
                .select()
                .single();

            if (teamError) throw teamError;

            // 2. Update User Profile
            const { error: profileError } = await authenticatedClient
                .from("profiles")
                .update({
                    team_id: newTeam.id,
                    is_premium: true,
                    plan_type: 'teams'
                })
                .eq("clerk_user_id", user?.id);

            if (profileError) console.error("Link profile error", profileError);

            setTeam(newTeam);
            setIsAdmin(true);
            setSeatCount(newTeam.total_seats);
            toast({ title: "Welcome to Teams!", description: "Your Team is active." });
            window.location.reload();

        } catch (error: any) {
            console.error("Error creating team:", error);
            toast({ title: "Error", description: error.message || "Failed to create team.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // Helper
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // -- VIEW: PUBLIC / LOADING ACCESS --
    return (
        <div className="min-h-screen bg-white font-sans text-[#0F172A] selection:bg-primary/10 selection:text-primary pb-24 md:pb-0">
            <Navbar />

            <main className="pt-32 pb-12 px-6 md:px-8 max-w-5xl mx-auto flex flex-col items-center text-center">
                <div className="mb-8 p-3 rounded-full bg-primary/10 text-teal-700 text-sm font-medium border border-teal-100 inline-flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Teams Plan
                </div>

                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#0F172A] mb-6 leading-[1.1] max-w-3xl">
                    Centralized Control for your Company
                </h1>
                <p className="text-xl text-[#64748B] leading-relaxed mb-10 max-w-xl font-normal">
                    Manage multiple cards, enforce brand themes, and centralize billing.
                </p>

                <div className="flex flex-col items-center gap-4">
                    <div className="text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4">
                        ₹1499 <span className="text-lg text-[#64748B] font-normal">/ year (5 Licenses)</span>
                    </div>
                    <div className="text-base text-primary font-semibold -mt-2">
                        Add-on License at just ₹99/seat (Yearly)
                    </div>

                    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Setup Your Team</DialogTitle>
                                <DialogDescription>
                                    Setup your team workspace. ₹1499 for 5 seats, then ₹99/seat additional. (Annual Billing)
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label htmlFor="companyName" className="text-sm font-medium">
                                        Company / Team Name
                                    </label>
                                    <Input
                                        id="companyName"
                                        placeholder="e.g. Acme Corp"
                                        value={newTeamDetails.companyName}
                                        onChange={(e) => setNewTeamDetails({ ...newTeamDetails, companyName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="adminName" className="text-sm font-medium">
                                        Admin Name
                                    </label>
                                    <Input
                                        id="adminName"
                                        value={newTeamDetails.adminName}
                                        onChange={(e) => setNewTeamDetails({ ...newTeamDetails, adminName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="adminEmail" className="text-sm font-medium">
                                        Admin Email
                                    </label>
                                    <Input
                                        id="adminEmail"
                                        value={newTeamDetails.adminEmail}
                                        onChange={(e) => setNewTeamDetails({ ...newTeamDetails, adminEmail: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="seatCount" className="text-sm font-medium">
                                        Number of Seats
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline" size="icon"
                                            onClick={() => setNewTeamDetails(prev => ({ ...prev, seatCount: Math.max(5, prev.seatCount - 1) }))}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <span className="text-xl font-mono font-bold w-12 text-center">{newTeamDetails.seatCount}</span>
                                        <Button
                                            variant="outline" size="icon"
                                            onClick={() => setNewTeamDetails(prev => ({ ...prev, seatCount: prev.seatCount + 1 }))}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label htmlFor="couponCode" className="text-sm font-medium">
                                        Coupon Code (Optional)
                                    </label>
                                    <Input
                                        id="couponCode"
                                        placeholder="Enter code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className={couponCode.toLowerCase().trim() === "access" ? "border-green-500 focus-visible:ring-green-500" : ""}
                                    />
                                    {couponCode.toLowerCase().trim() === "access" && (
                                        <p className="text-xs text-green-600 font-medium">Build your team for free!</p>
                                    )}
                                </div>

                                <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-sm border">
                                    <span className="text-slate-600">Total Yearly Cost:</span>
                                    <span className="font-bold text-lg">
                                        {couponCode.toLowerCase().trim() === "access" ? (
                                            <span className="text-green-600">Free (Lifetime Access)</span>
                                        ) : (
                                            `₹${newTeamDetails.seatCount <= 5 ? 1499 : 1499 + (newTeamDetails.seatCount - 5) * 99}`
                                        )}
                                    </span>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleTeamSubscription} disabled={isSaving || !newTeamDetails.companyName} className="w-full">
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : couponCode.toLowerCase().trim() === "access" ? (
                                        "Create Team (Free)"
                                    ) : (
                                        `Pay ₹${newTeamDetails.seatCount <= 5 ? 1499 : 1499 + (newTeamDetails.seatCount - 5) * 99} / yr & Create Team`
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-transform active:scale-95"
                    >
                        Create Team
                    </Button>
                    <p className="text-sm text-slate-400">Add seats as you grow.</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Teams;
