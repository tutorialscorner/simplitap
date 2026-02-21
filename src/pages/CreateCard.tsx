import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { Check, ArrowRight, User, Briefcase, Building, Mail, Lock, Loader2, CreditCard } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSignUp, useAuth, useUser } from "@clerk/clerk-react";
import { supabase, createClerkSupabaseClient } from "@/lib/supabase";
import { useSupabase } from "@/hooks/useSupabase";
import logo from "@/assets/simplify-tap-logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


const CreateCard = () => {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();
  const supabaseClient = useSupabase();

  const [searchParams] = useSearchParams();
  const cardUidParam = searchParams.get("card_uid");

  const [step, setStep] = useState(1); // 1 = Details, 2 = Email, 3 = Verification
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    company: "",
    email: "",
    password: "",
    code: "",
  });
  const [showNfcPrompt, setShowNfcPrompt] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Collect Personal Details
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your name.");
      return;
    }

    // Existing User Flow: Create Card Directly
    if (isSignedIn && user) {
      setIsLoading(true);
      try {
        console.log("Creating additional card for user:", user.id);
        const username = `${formData.firstName}${formData.lastName}${Math.floor(Math.random() * 1000)}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        // Check Premium/Team Membership Constraint
        const { data: existingProfiles } = await supabaseClient
          .from("profiles")
          .select("team_id, is_premium")
          .eq("clerk_user_id", user.id);

        const isTeamMember = existingProfiles?.some(p => p.team_id);
        const hasPremiumProfile = existingProfiles?.some(p => p.is_premium);

        if (isTeamMember && existingProfiles && existingProfiles.length > 0) {
          toast.error("Team members are limited to one digital card.");
          setIsLoading(false);
          return;
        }

        const { data: profile, error: dbError } = await supabaseClient
          .from("profiles")
          .insert({
            clerk_user_id: user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            job_title: formData.title,
            company: formData.company,
            email: formData.email || user.primaryEmailAddress?.emailAddress || "",
            card_mail: formData.email || user.primaryEmailAddress?.emailAddress || "",
            updated_at: new Date().toISOString(),
            username: username,
            is_premium: hasPremiumProfile || false
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Permanent Mapping if cardUidParam exists
        if (cardUidParam && profile) {
          await supabaseClient
            .from("cards")
            .update({
              profile_uid: profile.id,
              status: "ACTIVATED",
              activated_at: new Date().toISOString()
            })
            .eq("card_uid", cardUidParam);

          toast.success("Card linked to new profile!");
        } else {
          toast.success("New digital card created!");
        }

        setShowNfcPrompt(true);
      } catch (err: any) {
        console.error("Create additional card error:", err);
        toast.error("Failed to create card: " + (err.message || "Unknown error"));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // New User Flow
    setStep(2);
  };

  // Step 2: Create Account (Clerk SignUp)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      // 1. Create Clerk User
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // 2. Start Email Verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      toast.success("Verification code sent to your email.");
      setStep(3);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const errorMsg = err.errors?.[0]?.message || "Something went wrong. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify OTP & Save to Supabase (Strict Flow)
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      console.log("Starting verification...");
      // 1. Verify Email
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: formData.code,
      });

      console.log("Verification Result:", completeSignUp.status);

      if (completeSignUp.status !== "complete") {
        throw new Error("Verification failed. Please try again.");
      }

      const userId = completeSignUp.createdUserId;
      if (!userId) throw new Error("User ID missing.");

      // 2. Set Active Session (Wait for this!)
      console.log("Setting active session...");
      if (completeSignUp.createdSessionId) {
        await setActive({ session: completeSignUp.createdSessionId });
      }

      // 3. Get Auth Token for RLS
      let token = null;
      try {
        // @ts-ignore
        if (window.Clerk?.session) {
          // @ts-ignore
          token = await window.Clerk.session.getToken({ template: 'supabase' });
        }
      } catch (e) { console.warn("window.Clerk token fetch failed", e); }

      if (!token) {
        token = await getToken({ template: 'supabase' });
      }

      console.log("Token acquired:", !!token);

      // 4. Insert Profile to Supabase
      console.log("Saving to Supabase (Blocking)...", userId);

      const authenticatedClient = createClerkSupabaseClient(token);

      const username = `${formData.firstName}${formData.lastName}${Math.floor(Math.random() * 1000)}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      let assignedTeamId = null;
      try {
        const { data: invite } = await authenticatedClient
          .from("team_members")
          .select("team_id")
          .eq("email", formData.email.toLowerCase())
          .maybeSingle();

        if (invite) {
          assignedTeamId = invite.team_id;
          console.log("Found Team Invite:", assignedTeamId);

          await authenticatedClient
            .from("team_members")
            .update({ status: 'active' })
            .eq("email", formData.email.toLowerCase());
        }
      } catch (err) {
        console.warn("Error checking team invites:", err);
      }

      const { data: profile, error: dbError } = await authenticatedClient
        .from("profiles")
        .insert(
          {
            clerk_user_id: userId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            job_title: formData.title,
            company: formData.company,
            email: formData.email,
            card_mail: formData.email,
            updated_at: new Date().toISOString(),
            username: username,
            team_id: assignedTeamId,
            is_premium: !!assignedTeamId
          }
        )
        .select()
        .single();

      if (dbError) {
        console.error("Supabase Write Error:", dbError);
        throw new Error("Failed to save profile data. Please try again.");
      }

      // Permanent Mapping if cardUidParam exists
      if (cardUidParam && profile) {
        await authenticatedClient
          .from("cards")
          .update({
            profile_uid: profile.id,
            status: "ACTIVATED",
            activated_at: new Date().toISOString()
          })
          .eq("card_uid", cardUidParam);

        toast.success("Card linked to your new profile!");
      }

      toast.success("Account created successfully!");
      setShowNfcPrompt(true);

    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const errorMsg = err.errors?.[0]?.message || err.message || "Verification failed.";
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-4 min-h-[80vh] flex items-center">
        <div className="container mx-auto max-w-xl">
          <div className="text-center mb-8">
            <img src={logo} alt="Simplify Tap" className="h-16 w-auto mx-auto mb-6 rounded object-contain" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {step === 1 && (isSignedIn ? "Create a New Card" : "Tell us about yourself")}
              {step === 2 && "Create your account"}
              {step === 3 && "Verify your email"}
            </h1>
            <p className="text-muted-foreground">
              {step === 1 && (isSignedIn ? "Enter details for your new digital card." : "This will appear on your digital business card.")}
              {step === 2 && "Enter your email to save your card."}
              {step === 3 && `Enter the code sent to ${formData.email}`}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <form onSubmit={handleDetailsSubmit} className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="pl-9 h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="h-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="title"
                      name="title"
                      placeholder="Product Designer"
                      value={formData.title}
                      onChange={handleChange}
                      className="pl-9 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="company"
                      name="company"
                      placeholder="Acme Inc."
                      value={formData.company}
                      onChange={handleChange}
                      className="pl-9 h-12"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2 mt-4" disabled={isLoading}>
                  {isSignedIn ? (
                    <>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Create Card
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Email & Password (Account Creation) */}
            {step === 2 && (
              <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-9 h-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-9 h-12"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2 mt-4" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
                  disabled={isLoading}
                >
                  Back to details
                </button>
              </form>
            )}

            {/* Step 3: Verification */}
            {step === 3 && (
              <form onSubmit={handleVerificationSubmit} className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="123456"
                    value={formData.code}
                    onChange={handleChange}
                    className="h-12 text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Check your email inbox and spam folder.
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2 mt-4" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
                  disabled={isLoading}
                >
                  Back to email
                </button>
              </form>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have a card?{" "}
              {isSignedIn ? (
                <Link to="/dashboard" className="text-primary hover:underline">Go to Dashboard</Link>
              ) : (
                <Link to="/signin" className="text-primary hover:underline">Sign in</Link>
              )}
            </p>
          </div>
        </div>
      </section>

      <Footer />

      <Dialog open={showNfcPrompt} onOpenChange={setShowNfcPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">🎉 Profile Created!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your digital identity is now live. Want to share it instantly in the real world?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="relative w-48 h-32 rounded-xl overflow-hidden shadow-lg transform rotate-3 transition-transform hover:rotate-0 duration-500">
              <img
                src="https://image2url.com/r2/bucket1/images/1767839723885-dfeb2379-1a25-4b6b-9dad-0d8e43288b39.png"
                alt="NFC Card"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-2">
                <span className="text-white text-xs font-medium tracking-wider">PREMIUM NFC</span>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground px-4">
              Get a professional <strong>NFC Business Card</strong>. Just tap it on any phone to share your profile instantly. No apps required.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="sm:mr-2 w-full sm:w-auto">
              Skip for now
            </Button>
            <Button onClick={() => navigate("/nfc")} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white gap-2">
              <CreditCard className="w-4 h-4" />
              Shop NFC Cards
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateCard;
