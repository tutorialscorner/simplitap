import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSupabase } from "@/hooks/useSupabase";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const UsernameClaim = () => {
    const { user, isLoaded } = useUser();
    const supabaseClient = useSupabase();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const [newUsername, setNewUsername] = useState("");
    const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [primaryCardId, setPrimaryCardId] = useState<string | null>(null);

    useEffect(() => {
        if (isLoaded && user) {
            fetchPrimaryCard();
        }
    }, [isLoaded, user]);

    const fetchPrimaryCard = async () => {
        try {
            const { data, error } = await supabaseClient
                .from("profiles")
                .select("id, username, is_primary")
                .eq("clerk_user_id", user?.id)
                .order("is_primary", { ascending: false }) // Primary first
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setPrimaryCardId(data.id);
                setCurrentUsername(data.username);
                setNewUsername(data.username || "");
            }
        } catch (err) {
            console.error("Error fetching primary card:", err);
        } finally {
            setLoading(false);
        }
    };

    const checkAvailability = async (username: string) => {
        if (!username || username.length < 3) {
            setStatus('invalid');
            return;
        }

        setStatus('checking');

        // If it's the same as current, it's available (to them)
        if (username === currentUsername) {
            setStatus('available');
            return;
        }

        try {
            const { data } = await supabaseClient
                .from("profiles")
                .select("id")
                .eq("username", username.toLowerCase())
                .maybeSingle();

            if (data) {
                setStatus('taken');
            } else {
                setStatus('available');
            }
        } catch (err) {
            console.error(err);
            setStatus('idle');
        }
    };

    // Debounce check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (newUsername && newUsername !== currentUsername) {
                const sanitized = newUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                if (sanitized !== newUsername) {
                    // If sanitization changes it, don't check yet, just update state to sanitized? 
                    // Or let user type but show invalid.
                    // Let's sanitize on input change instead.
                }
                checkAvailability(sanitized);
            } else if (newUsername === currentUsername && newUsername) {
                setStatus('available');
            } else {
                setStatus('idle');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [newUsername, currentUsername]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        setNewUsername(value);
    };

    const handleSave = async () => {
        if (status !== 'available') return;
        if (!primaryCardId) {
            toast.error("No card found. Please create a card first.");
            return;
        }

        setClaiming(true);
        try {
            const { error } = await supabaseClient
                .from("profiles")
                .update({ username: newUsername })
                .eq("id", primaryCardId);

            if (error) throw error;

            toast.success("Username updated successfully!");
            setCurrentUsername(newUsername);

            // Trigger local storage update event so Navbar/Dashboard refresh
            window.dispatchEvent(new Event("local-storage-update"));

            navigate("/dashboard");
        } catch (err: any) {
            console.error("Update failed", err);
            toast.error(err.message || "Failed to update username");
        } finally {
            setClaiming(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-12 px-4 container mx-auto max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Claim Your Username</h1>
                    <p className="text-muted-foreground">
                        This unique username will be linked to your default card.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Choose Username</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-muted-foreground">simplifytap.in/</span>
                                <Input
                                    id="username"
                                    value={newUsername}
                                    onChange={handleInputChange}
                                    className={`pl-[115px] h-12 ${status === 'taken' ? 'border-red-300 focus-visible:ring-red-200' :
                                            status === 'available' ? 'border-green-300 focus-visible:ring-green-200' : ''
                                        }`}
                                    placeholder="yourname"
                                />
                                <div className="absolute right-3 top-3.5">
                                    {status === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                                    {status === 'available' && <Check className="w-5 h-5 text-green-500" />}
                                    {status === 'taken' && <X className="w-5 h-5 text-red-500" />}
                                </div>
                            </div>

                            {status === 'taken' && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Username is already taken.
                                </p>
                            )}
                            {status === 'available' && newUsername !== currentUsername && (
                                <p className="text-sm text-green-600">
                                    Username is available!
                                </p>
                            )}
                        </div>

                        <div className="bg-muted/50 p-4 rounded-xl text-sm text-muted-foreground space-y-2">
                            <p><strong>Note:</strong></p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>This username will act as your main link.</li>
                                <li>If you have multiple cards, this username will move to whichever card you set as <strong>Default</strong>.</li>
                            </ul>
                        </div>

                        <Button
                            className="w-full h-12 text-base font-semibold mt-4"
                            disabled={status !== 'available' || claiming || newUsername === currentUsername}
                            onClick={handleSave}
                        >
                            {claiming ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    Save Username
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UsernameClaim;
