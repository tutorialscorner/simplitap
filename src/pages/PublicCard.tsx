import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { DigitalCard } from "@/components/simplify-tap/DigitalCard";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@clerk/clerk-react";
import { ExchangeContactModal } from "@/components/simplify-tap/ExchangeContactModal";
import { Lock, Nfc, Check, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const PublicCard = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();
    const supabaseClient = useSupabase();
    const [cardData, setCardData] = useState<any>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [cardStatus, setCardStatus] = useState<"LOADED" | "UNACTIVATED" | "NOT_FOUND">("LOADED");
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const viewLogged = useRef(false);
    const exchangeTimerRef = useRef<NodeJS.Timeout | null>(null);

    const logAnalytics = async (pid: string, type: string) => {
        // 1. Insert Event
        const { error } = await supabase
            .from('analytics_events')
            .insert({
                profile_id: pid,
                type: type
                // metadata: removed temporarily to bypass schema cache issue
            });

        if (error) {
            console.error("ANALYTICS INSERT FAILED:", JSON.stringify(error));
            // alert("Analytics Error: " + JSON.stringify(error)); // Uncomment if console is hard to see
        } else {
            console.log("Analytics event logged successfully:", type);
        }

        // 2. Increment Counter (RPC) - Best effort
        if (type === 'view') {
            await supabase.rpc('increment_view', { row_id: pid }).then(({ error }) => {
                if (error) console.error("RPC Error:", error);
            });
        } else if (type.startsWith('click')) {
            await supabase.rpc('increment_click', { row_id: pid });
        }
    };

    useEffect(() => {
        async function fetchCard() {
            if (!id) return;

            try {
                // 1. Check if it's a Card UID Candidate (5 chars, LLDDD)
                const isCardUidCandidate = /^[A-Z]{2}[0-9]{3}$/.test(id);
                if (isCardUidCandidate) {
                    const { data: cardRecord } = await supabase
                        .from('cards')
                        .select('*')
                        .eq('card_uid', id)
                        .maybeSingle();

                    if (cardRecord) {
                        // Log Tap
                        await supabase.from('card_tap_logs').insert({
                            card_uid: id,
                            event: 'TAPPED'
                        });

                        if (cardRecord.status === 'ACTIVATED' && cardRecord.profile_uid) {
                            // Fetch profile by profile_uid to get latest username
                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('username')
                                .eq('id', cardRecord.profile_uid)
                                .maybeSingle();

                            if (profileData?.username) {
                                window.location.replace(`/${profileData.username}`);
                                return;
                            }
                        } else if (cardRecord.status === 'UNACTIVATED' || cardRecord.status === 'IN_PROCESS') {
                            setCardStatus('UNACTIVATED');
                            setLoading(false);
                            return;
                        }
                    }
                }

                // Match by username OR clerk_user_id OR profile_id
                // IMPORTANT: Only check 'id' column if the param is a valid UUID to avoid Postgres errors
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

                let query = supabase.from("profiles").select("*, teams(*)");

                if (isUuid) {
                    // Try exact ID match first for precision
                    query = query.or(`id.eq.${id},username.eq.${id},clerk_user_id.eq.${id}`);
                } else {
                    // Not a UUID, so it must be a username or clerk user ID (if clerk IDs aren't uuids)
                    query = query.or(`username.eq.${id},clerk_user_id.eq.${id}`);
                }

                const fetchPromise = query
                    .order('is_primary', { ascending: false })
                    .order('is_premium', { ascending: false })
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                const timeoutPromise = new Promise<{ data: null, error: any }>((resolve) =>
                    setTimeout(() => resolve({ data: null, error: "TIMEOUT" }), 6000)
                );

                const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

                if (error && error !== "TIMEOUT") {
                    console.error("Card fetch error:", error);
                }

                if (data) {
                    setProfileId(data.id);
                    // Log View Once
                    if (!viewLogged.current) {
                        viewLogged.current = true;
                        logAnalytics(data.id, 'view');
                    }

                    // Check for Global Premium Status (Account Level)
                    let isPremiumAccount = data.is_premium === true;
                    if (!isPremiumAccount && data.clerk_user_id) {
                        const { data: premiumCheck } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('clerk_user_id', data.clerk_user_id)
                            .eq('is_premium', true)
                            .limit(1)
                            .maybeSingle();

                        if (premiumCheck) isPremiumAccount = true;
                    }

                    const isPremium = isPremiumAccount;

                    // Determine final values, prioritizing Team settings if applicable
                    const companyName = data.teams?.company_name || data.company;
                    const themeId = data.teams?.theme_color || data.theme_color;
                    const companyLogo = data.teams?.logo_url || data.company_logo_url;
                    const isTeam = !!data.team_id || !!data.teams;

                    setCardData({
                        firstName: data.first_name,
                        lastName: data.last_name,
                        title: data.job_title,
                        company: companyName,
                        bio: data.bio,
                        phone: data.phone,
                        email: data.card_mail || data.email,
                        website: data.website,
                        linkedin: data.linkedin,
                        twitter: data.X,
                        instagram: data.Instagram,
                        mapLink: data.map_link,
                        logoUrl: data.avatar_url,
                        bannerUrl: isPremium ? data.banner_url : null,
                        themeColor: data.style?.customColors?.primary,
                        themeId: themeId,
                        companyLogoUrl: isPremium ? companyLogo : null,
                        socialLinks: data.social_links,
                        // Pass Style & Layout Settings from DB
                        sectionOrder: (() => {
                            let order = (data.style?.sectionOrder || ['profile', 'bio', 'social', 'contact', 'weblinks', 'video', 'gallery'])
                                .flatMap((s: any) => s === 'media' ? ['video', 'gallery'] : s);

                            // Ensure 'contact' is in the order for button rendering
                            if (!order.includes('contact')) {
                                const bioIndex = order.indexOf('bio');
                                if (bioIndex !== -1) {
                                    order.splice(bioIndex + 1, 0, 'contact');
                                } else {
                                    const socialIndex = order.indexOf('social');
                                    if (socialIndex !== -1) {
                                        order.splice(socialIndex, 0, 'contact');
                                    } else {
                                        order.push('contact');
                                    }
                                }
                            }
                            return order;
                        })(),
                        customComponents: data.style?.customComponents || [],
                        templateId: data.teams?.template_id || data.style?.templateId || "modern",
                        font: data.style?.font || "Inter",
                        cardStyle: data.style?.cardStyle || { borderRadius: 0, shadow: false, background: true },
                        visibleSections: data.style?.visibleSections || {},
                        customColors: data.teams?.style?.customColors || data.style?.customColors,
                        pageLoader: data.style?.pageLoader,

                        // Hotfix: Force premium for 'test' user if DB update failed, otherwise use DB value
                        isPremium: isPremium,
                        isTeam: isTeam,
                        isLocked: data.is_locked
                    });
                }
            } catch (err) {
                console.error("Error in public card load:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCard();

        // Timer removed for manual trigger only
    }, [id]);

    const [linking, setLinking] = useState(false);

    const handleActivateToExistingProfile = async () => {
        if (!isSignedIn || !user || !id || !supabaseClient) return;
        setLinking(true);
        try {
            // 1. Get the primary profile for the user
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('id, username')
                .eq('clerk_user_id', user.id)
                .eq('is_primary', true)
                .maybeSingle();

            if (!profile) {
                // If no primary profile, just take the first one or tell them to create one
                const { data: anyProfile } = await supabaseClient
                    .from('profiles')
                    .select('id, username')
                    .eq('clerk_user_id', user.id)
                    .limit(1)
                    .maybeSingle();

                if (!anyProfile) {
                    navigate(`/create?card_uid=${id}`);
                    return;
                }

                // Link to this one
                await performLink(anyProfile.id, anyProfile.username);
            } else {
                await performLink(profile.id, profile.username);
            }
        } catch (err: any) {
            toast.error("Linking failed: " + err.message);
        } finally {
            setLinking(false);
        }
    };

    const performLink = async (pId: string, username: string | null) => {
        const { error } = await supabaseClient
            .from('cards')
            .update({
                profile_uid: pId,
                status: 'ACTIVATED',
                activated_at: new Date().toISOString()
            })
            .eq('card_uid', id);

        if (error) throw error;

        // Log tap event as activated
        await supabaseClient.from('card_tap_logs').insert({
            card_uid: id,
            event: 'ACTIVATED'
        });

        toast.success("Card linked successfully!");

        // Redirect to the profile
        if (username) {
            window.location.replace(`/${username}`);
        } else {
            window.location.replace(`/card/${pId}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (cardStatus === "UNACTIVATED") {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                    <div className="h-48 bg-gradient-to-br from-[#0FA4AF] to-[#046169] flex items-center justify-center">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
                            <Nfc className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <CardHeader className="text-center pt-10">
                        <CardTitle className="text-3xl font-black text-gray-900 px-4">
                            Activate your SimplifyTap card
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-3 text-lg px-6">
                            This card (<strong>{id}</strong>) is not yet linked to a profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-6 space-y-4">
                        {isSignedIn ? (
                            <>
                                <Button
                                    onClick={handleActivateToExistingProfile}
                                    disabled={linking}
                                    className="w-full bg-[#0FA4AF] hover:bg-[#046169] text-white rounded-[1.5rem] h-16 text-xl font-bold shadow-xl shadow-[#0FA4AF]/20 gap-3"
                                >
                                    {linking ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                                    Link to my Profile
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/create?card_uid=${id}`)}
                                    className="w-full border-gray-200 text-gray-600 rounded-[1.5rem] h-14 text-lg font-medium"
                                >
                                    Create New Profile
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => navigate(`/create?card_uid=${id}`)}
                                className="w-full bg-[#0FA4AF] hover:bg-[#046169] text-white rounded-[1.5rem] h-16 text-xl font-bold shadow-xl shadow-[#0FA4AF]/20"
                            >
                                Get Started
                            </Button>
                        )}

                        <p className="text-center text-gray-400 text-xs mt-6 uppercase tracking-widest font-bold">
                            SimplifyTap &bull; Secure NFC Identity
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!cardData) {
        return (
            <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Card Not Found</h1>
                    <p className="text-muted-foreground mb-4">The digital card you're looking for doesn't exist.</p>
                    <Link to="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (cardData.isLocked) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="text-xl font-bold mb-2 text-gray-900">Profile Locked</h1>
                    <p className="text-gray-500">
                        This digital card has been temporarily locked by its owner.
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="w-screen h-[100dvh] overflow-hidden bg-white md:bg-gray-100 md:flex md:items-center md:justify-center">
            <div className="w-full h-full md:w-full md:max-w-md md:h-[90vh] md:shadow-2xl md:rounded-3xl overflow-hidden">
                <DigitalCard
                    showBranding={!cardData.isPremium}
                    premium={cardData.isPremium}
                    isTeam={cardData.isTeam}
                    userData={cardData}
                    onLinkClick={(type) => {
                        if (profileId) {
                            logAnalytics(profileId, `click_${type.toLowerCase()}`);
                        }
                    }}
                    onSaveContact={() => setShowExchangeModal(true)}
                />
            </div>

            {/* Exchange Contact Modal */}
            {cardData && profileId && (
                <ExchangeContactModal
                    open={showExchangeModal}
                    onOpenChange={setShowExchangeModal}
                    cardOwnerName={`${cardData.firstName} ${cardData.lastName}`}
                    cardOwnerId={profileId}
                    cardOwnerData={cardData}
                />
            )}
        </div>
    );
};

export default PublicCard;
