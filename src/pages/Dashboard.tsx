import { useEffect, useState, useRef } from "react";
import { TeamInvites } from "@/components/simplify-tap/TeamInvites";

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Share2, Crown, CreditCard, QrCode, Copy, Check, Loader2, Globe, Download, Mail, Link as LinkIcon, Plus, ChevronDown, BarChart2, Zap, TrendingUp, Trash2, AlertTriangle, ScanLine, Users, Building2, ArrowRight, Lock, RotateCw } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/hooks/use-toast";
import { DigitalCard } from "@/components/simplify-tap/DigitalCard";
import { QRCodeGenerator } from "@/components/simplify-tap/QRCodeGenerator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIScanner } from "@/components/simplify-tap/AIScanner";
import { ContactsManager } from "@/components/simplify-tap/ContactsManager";
import { PhysicalCardManager } from "@/components/simplify-tap/PhysicalCardManager";

type TimeRange = '24h' | '7d' | '30d';

const Dashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [realStats, setRealStats] = useState({ views: 0, clicks: 0, opens: 0 });
  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // New State for Multiple Cards
  const [cards, setCards] = useState<any[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const supabaseClient = useSupabase();
  const analyticsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("user_card_data");
    const data = savedData ? JSON.parse(savedData) : {};
    setIsPremium(!!data.isPremium);
  }, []);

  // 2. Update userData when Active Card changes
  useEffect(() => {
    if (cards.length > 0 && cards[activeCardIndex]) {
      try {
        const data = cards[activeCardIndex];
        console.log("Dashboard: Mapping card data to userData...", data.id);

        const mappedData = {
          firstName: data.first_name,
          lastName: data.last_name,
          title: data.job_title,
          company: data.teams?.company_name || data.company,
          email: data.email,
          phone: data.phone,
          website: data.website,
          mapLink: data.map_link,
          linkedin: data.linkedin,
          twitter: data.X,
          instagram: data.Instagram,
          bio: data.bio,
          isLocked: data.is_locked,
          username: data.username,
          themeId: data.teams?.theme_color || data.theme_color,
          logoUrl: data.avatar_url,
          bannerUrl: data.banner_url,
          id: data.id,
          is_premium: data.is_premium,
          companyLogoUrl: data.teams?.logo_url || data.company_logo_url,
          isTeam: !!data.team_id,
          socialLinks: data.social_links,
          sectionOrder: (() => {
            let order = (data.style?.sectionOrder || ['profile', 'bio', 'social', 'contact', 'weblinks', 'video', 'gallery'])
              .flatMap((s: any) => s === 'media' ? ['video', 'gallery'] : s);
            if (!order.includes('contact')) {
              const bioIndex = order.indexOf('bio');
              if (bioIndex !== -1) order.splice(bioIndex + 1, 0, 'contact');
              else {
                const socialIndex = order.indexOf('social');
                if (socialIndex !== -1) order.splice(socialIndex, 0, 'contact');
                else order.push('contact');
              }
            }
            return order;
          })(),
          customComponents: data.style?.customComponents || [],
          templateId: data.teams?.template_id || data.style?.templateId || "modern",
          font: data.style?.font || "Inter",
          cardStyle: data.style?.cardStyle || { borderRadius: 16, shadow: true, background: true },
          visibleSections: data.style?.visibleSections || {},
          customColors: data.teams?.style?.customColors || data.style?.customColors || { primary: '', secondary: '', background: '', text: '' },
          pageLoader: data.style?.pageLoader || { animation: 'default', logoType: 'brand', customUrl: '' },
          _ts: Date.now() // Force update
        };

        setUserData(mappedData);
        if (data.is_premium) setIsPremium(true);
      } catch (err) {
        console.error("Dashboard: Error mapping userData:", err);
      }
    } else if (cards.length === 0 && loading === false) {
      console.log("Dashboard: No cards, setting basic userData");
      setUserData({ firstName: user?.firstName, lastName: user?.lastName });
    }
  }, [cards, activeCardIndex, loading]);

  // 3. Listen for local updates (e.g. from Edit/Profile)
  useEffect(() => {
    const handleUpdate = () => {
      console.log("🔄 Dashboard: Refreshing data...");
      if (isSignedIn && user && supabaseClient) {
        initDashboard();
      }
    };
    window.addEventListener("local-storage-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("local-storage-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [isSignedIn, user, supabaseClient]);

  const initDashboard = async () => {
    if (!supabaseClient || !user) return;
    try {
      const email = user.primaryEmailAddress?.emailAddress;
      if (email) {
        const { data: invite } = await supabaseClient
          .from("team_members")
          .select("*")
          .eq("email", email.toLowerCase())
          .in("status", ["active", "invited"])
          .maybeSingle();
        if (invite && invite.status === 'active') {
          await supabaseClient
            .from("profiles")
            .update({ team_id: invite.team_id, is_premium: true })
            .eq("clerk_user_id", user.id)
            .is("team_id", null);
        }
      }

      // 2. Self-Healing: Link profile if found by email but null clerk_user_id
      const primaryEmail = user.primaryEmailAddress?.emailAddress;
      if (primaryEmail) {
        const { data: existingProfiles } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("email", primaryEmail.toLowerCase())
          .is("clerk_user_id", null);

        if (existingProfiles && existingProfiles.length > 0) {
          console.log("Dashboard: Auto-linking profiles by email...", existingProfiles.length);
          await supabaseClient
            .from("profiles")
            .update({ clerk_user_id: user.id })
            .in("id", existingProfiles.map(p => p.id));
        }
      }
    } catch (e) {
      console.error("Self-healing / Invite check failed", e);
    }
    fetchProfiles();
  };

  const fetchProfiles = async () => {
    if (!supabaseClient || !user) return;
    try {
      console.log("Fetching profiles for user:", user.id);
      let { data, error } = await supabaseClient
        .from("profiles")
        .select("*, teams(*)")
        .or(`clerk_user_id.eq.${user.id},email.eq.${user.primaryEmailAddress?.emailAddress?.toLowerCase()}`)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }

      console.log("Fetched profiles count:", data?.length || 0);

      if (data && data.length > 0) {
        // First determine active index
        let targetIdx = 0;
        const params = new URLSearchParams(window.location.search);
        const cardIdParam = params.get('cardId');

        if (cardIdParam) {
          const foundIdx = data.findIndex((c: any) => c.id === cardIdParam);
          if (foundIdx !== -1) {
            targetIdx = foundIdx;
            window.history.replaceState({}, '', '/dashboard');
          }
        }

        const globalPremium = data.some((c: any) => c.is_premium === true);

        if (globalPremium) {
          setIsPremium(true);
          setCards(data);
          setActiveCardIndex(targetIdx);

          // Self-Healing: If user is premium, ensure all profiles are marked as premium in DB
          const nonPremiumProfiles = data.filter((c: any) => !c.is_premium).map((c: any) => c.id);
          if (nonPremiumProfiles.length > 0) {
            console.log("Self-healing: Syncing premium status for cards:", nonPremiumProfiles);
            supabaseClient
              .from("profiles")
              .update({ is_premium: true })
              .in("id", nonPremiumProfiles)
              .then(({ error }) => {
                if (error) console.error("Self-healing sync failed:", error);
                else {
                  // Update local state without re-fetching
                  const updatedCards = data.map((c: any) => ({ ...c, is_premium: true }));
                  setCards(updatedCards);
                }
              });
          }

          const saved = localStorage.getItem("user_card_data");
          const parsed = saved ? JSON.parse(saved) : {};
          const currentTeamId = data[0].teams?.id || data[0].team_id;
          localStorage.setItem("user_card_data", JSON.stringify({ ...parsed, isPremium: true, team_id: currentTeamId }));
        } else {
          setIsPremium(false);
          // If not premium, they can still have multiple cards in DB (if transferred/old), 
          // but we usually display the latest one they are working on (targetIdx).
          const truncatedData = [data[targetIdx] || data[0]];
          setCards(truncatedData);
          setActiveCardIndex(0);
        }
      } else {
        setCards([]);
        setUserData({ firstName: user.firstName, lastName: user.lastName });
      }
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setUserData({ firstName: user.firstName, lastName: user.lastName });
    } finally {
      setLoading(false);
    }
  };

  // 4. Initial Load
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/signin");
      return;
    }
    if (user && supabaseClient) {
      initDashboard();
    }
  }, [isLoaded, isSignedIn, user?.id, supabaseClient]);

  // Handle URL params once cards are loaded
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetCardId = params.get('cardId');
    if (targetCardId && cards.length > 0) {
      const idx = cards.findIndex(c => c.id === targetCardId);
      if (idx !== -1) {
        setActiveCardIndex(idx);
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  }, [cards]);

  // Fetch Analytics for Active Card
  useEffect(() => {
    const fetchEvents = async () => {
      if (!userData || !userData.id) return;

      // Reset analytics before fetch to avoid stale data showing for wrong card momentarily?
      // Actually best to keep old data until new data arrives to avoid flicker, or show loader.
      // We'll just fetch.

      const { data: events, error: eventsError } = await supabaseClient
        .from('analytics_events')
        .select('created_at, type')
        .eq('profile_id', userData.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (eventsError) {
        console.error("Events fetch error:", JSON.stringify(eventsError));
      }

      if (events) {
        setRawEvents(events);
      } else {
        setRawEvents([]);
      }
    };

    fetchEvents();
  }, [userData?.id]);


  // Process Analytics when Range or Events change
  useEffect(() => {
    const now = new Date();
    let startTime = new Date();
    let dateFormat: Intl.DateTimeFormatOptions = { weekday: 'short' };

    if (timeRange === '24h') {
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateFormat = { hour: 'numeric' };
    } else if (timeRange === '7d') {
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFormat = { weekday: 'short' };
    } else {
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFormat = { month: 'short', day: 'numeric' };
    }

    const filteredEvents = rawEvents.filter(e => new Date(e.created_at) >= startTime);

    // Group for Chart
    const grouped = filteredEvents.reduce((acc: any, curr: any) => {
      const date = new Date(curr.created_at);
      let key = '';
      if (timeRange === '24h') {
        const hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        key = `${h12} ${ampm}`;
      } else {
        key = date.toLocaleDateString('en-US', dateFormat);
      }
      if (!acc[key]) acc[key] = { views: 0, clicks: 0, name: key };
      if (curr.type === 'view') acc[key].views++;
      else if (curr.type.startsWith('click')) acc[key].clicks++;
      return acc;
    }, {});

    const buckets: any[] = [];
    if (timeRange === '24h') {
      for (let i = 24; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hours = d.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        const key = `${h12} ${ampm}`;
        buckets.push({ name: key, views: 0, clicks: 0 });
      }
    } else if (timeRange === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString('en-US', dateFormat);
        buckets.push({ name: key, views: 0, clicks: 0 });
      }
    } else {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString('en-US', dateFormat);
        buckets.push({ name: key, views: 0, clicks: 0 });
      }
    }

    const chartData = buckets.map(b => ({
      ...b,
      views: grouped[b.name]?.views || 0,
      clicks: grouped[b.name]?.clicks || 0
    }));

    setChartData(chartData);

    // Calculate Totals from Filtered Events (Matches Chart)
    const totalViews = filteredEvents.filter(e => e.type === 'view').length;
    const totalClicks = filteredEvents.filter(e => e.type.startsWith('click')).length;

    setRealStats({
      views: totalViews,
      clicks: totalClicks,
      opens: totalViews
    });

  }, [rawEvents, timeRange]);


  // --- Updated Link Logic: Dynamic based on currently selected card ---
  const currentActive = cards[activeCardIndex] || cards[0];
  const displayUsername = currentActive?.username || userData?.username;
  const displayId = currentActive?.id || userData?.id;

  const cardLink = user
    ? displayUsername
      ? `https://simplifytap.in/${displayUsername}`
      : `${window.location.origin}/card/${displayId || user.id}`
    : "";

  const displayLinkText = displayUsername
    ? `simplifytap.in/${displayUsername}`
    : `card/${(displayId || user?.id || "").slice(0, 12)}...`;

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const socialShareUrl = cardLink;

  const handleCopy = () => {
    navigator.clipboard.writeText(cardLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToAnalytics = () => {
    if (analyticsRef.current) {
      analyticsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isLoaded || (isSignedIn && loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  const firstName = (userData?.firstName || user?.firstName || "").charAt(0).toUpperCase() + (userData?.firstName || user?.firstName || "").slice(1);

  const downloadQRCode = async () => {
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(cardLink)}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${userData?.username || 'card'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR:', error);
    }
  };

  const ShareDialogContent = () => (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Share your digital card</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-3 gap-4 py-4">
        <a
          href={`https://wa.me/?text=Check%20out%20my%20digital%20card:%20${encodeURIComponent(socialShareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-green-50 transition-colors group/icon"
        >
          <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md group-hover/icon:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
          </div>
          <span className="text-xs font-medium text-gray-600">WhatsApp</span>
        </a>

        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(socialShareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-primary/5 transition-colors group/icon"
        >
          <div className="w-12 h-12 rounded-full bg-[#0077b5] text-white flex items-center justify-center shadow-md group-hover/icon:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
          </div>
          <span className="text-xs font-medium text-gray-600">LinkedIn</span>
        </a>

        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(socialShareUrl)}&text=${encodeURIComponent("Check out my digital card!")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-100 transition-colors group/icon"
        >
          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-md group-hover/icon:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          </div>
          <span className="text-xs font-medium text-gray-600">X (Twitter)</span>
        </a>

        <a
          href={`mailto:?subject=Digitial%20Business%20Card&body=Check%20out%20my%20digital%20card:%20${encodeURIComponent(socialShareUrl)}`}
          className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-amber-50 transition-colors group/icon"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md group-hover/icon:scale-110 transition-transform">
            <Mail className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-gray-600">Email</span>
        </a>

        <div
          className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-100 transition-colors group/icon cursor-pointer"
          onClick={handleCopy}
        >
          <div className="w-12 h-12 rounded-full bg-gray-600 text-white flex items-center justify-center shadow-md group-hover/icon:scale-110 transition-transform">
            {copied ? <Check className="w-6 h-6 text-green-400" /> : <LinkIcon className="w-6 h-6" />}
          </div>
          <span className="text-xs font-medium text-gray-600">{copied ? "Copied" : "Copy Link"}</span>
        </div>
      </div>
    </DialogContent>
  );

  const QRDialogContent = () => (
    <QRCodeGenerator
      url={cardLink}
      username={firstName}
      defaultImage={userData?.logoUrl}
      premium={isPremium || userData?.isTeam}
    />
  );

  const handleDeleteCard = async () => {
    if (!userData?.id) return;
    try {
      const { error } = await supabaseClient.from('profiles').delete().eq('id', userData.id);

      if (error) {
        console.error("Delete Error:", error);
        alert(`Failed to delete: ${error.message}`);
        return;
      }

      const updatedCards = cards.filter(c => c.id !== userData.id);

      toast({
        title: "Card deleted",
        description: "Your card has been permanently removed.",
      });

      if (updatedCards.length === 0) {
        navigate("/create");
      } else {
        setCards(updatedCards);
        setActiveCardIndex(0);
      }
    } catch (err: any) {
      console.error("Delete failed", err);
      alert(`Failed to delete card: ${err.message || 'Unknown error'}`);
    }
  };

  const handleLockToggle = async () => {
    if (!userData?.id) return;

    const newStatus = !userData.isLocked;

    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ is_locked: newStatus })
        .eq('id', userData.id);

      if (error) throw error;

      // Update local state
      const updatedCards = [...cards];
      if (updatedCards[activeCardIndex]) {
        updatedCards[activeCardIndex].is_locked = newStatus;
        setCards(updatedCards);
      }

      toast({
        title: newStatus ? "Card Locked" : "Card Unlocked",
        description: newStatus
          ? "Your profile is now hidden from public view."
          : "Your profile is now visible to everyone.",
      });

    } catch (err: any) {
      console.error("Lock toggle failed", err);
      toast({
        title: "Error",
        description: "Failed to update card status.",
        variant: "destructive"
      });
    }
  };

  const handleSetPrimary = async (cardId: string) => {
    if (!supabaseClient || !user) return;
    try {
      // Get current primary card (to check for username)
      const { data: currentPrimary, error: oldError } = await supabaseClient
        .from('profiles')
        .select("id, username")
        .eq('is_primary', true)
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (oldError) console.error("Could not find old primary:", oldError);

      let usernameToMove = null;
      if (currentPrimary && currentPrimary.username) {
        // Simple check: is it a 'custom' username or a random generated one?
        // Random ones usually end in 3 digits and have name. Assuming any username user sets is valuable.
        // Let's move ANY username if it's set.
        usernameToMove = currentPrimary.username;
      }

      // 1. Unset all others
      await supabaseClient
        .from('profiles')
        .update({ is_primary: false })
        .eq('clerk_user_id', user.id);

      // 2. Set this one
      // If we are moving a username, we should update it here
      const updates: any = { is_primary: true };

      if (usernameToMove && currentPrimary && currentPrimary.id !== cardId) {
        // We need to clear the old one first to avoid unique constraint if any (Supabase usually enforces unique on username)
        // Let's generate a temporary ID for the old card to be safe.
        const tempUsername = `user_${currentPrimary.id.split('-')[0]}_${Math.floor(Math.random() * 1000)}`;

        await supabaseClient
          .from('profiles')
          .update({ username: tempUsername })
          .eq('id', currentPrimary.id);

        updates.username = usernameToMove;
      }

      const { error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', cardId);

      if (error) throw error;

      // Migrate Physical Card Links: Make physical cards "follow" the primary identity
      if (currentPrimary) {
        await supabaseClient
          .from('cards')
          .update({ profile_uid: cardId })
          .eq('profile_uid', currentPrimary.id);
      }

      toast({
        title: "Default Card Set",
        description: `This card is now your primary profile.${usernameToMove ? " Username moved." : ""}`,
      });

      // Refresh
      initDashboard();
    } catch (err: any) {
      console.error("Set primary failed", err);
      toast({
        title: "Action Restricted",
        description: "Default selection requires an account update.",
        variant: "destructive"
      });
    }
  };

  const DeleteDialogContent = () => (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Delete this card?
        </DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-gray-500 mb-4">
          Are you sure you want to permanently delete <strong>{userData?.job_title || "this card"}</strong>? This action cannot be undone and all analytics data will be lost.
        </p>
        <div className="flex gap-3 justify-end">
          <DialogTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogTrigger>
          <Button variant="destructive" onClick={handleDeleteCard} className="bg-red-600 hover:bg-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Permanently
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-12 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 box-border flex flex-col items-center md:items-stretch">
        <div className="container mx-auto max-w-6xl w-full flex flex-col items-center md:items-stretch">

          {/* Desktop Header */}
          <div className="hidden md:block mb-8 mt-6">
            <div className="flex items-end justify-between gap-4 border-b border-gray-100 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                  Welcome back, {firstName} <span className="animate-wave origin-bottom-right inline-block">👋</span>
                </h1>
                <p className="text-gray-500 mt-2 text-lg">Manage, share, and grow your professional presence</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${userData?.isTeam ? "bg-teal-50 border-teal-200 text-teal-700" : isPremium ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-gray-100 border-gray-200 text-gray-600"}`}>
                    Plan: {userData?.isTeam ? "Teams" : isPremium ? "Plus" : "Free"}
                  </span>
                  {(isPremium || userData?.isTeam) && cards[activeCardIndex]?.subscription?.current_period_end && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                      {(() => {
                        const end = new Date(cards[activeCardIndex].subscription.current_period_end);
                        const now = new Date();
                        const diff = end.getTime() - now.getTime();
                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                        return days > 0 ? `${days} days left` : "Expires today";
                      })()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <TeamInvites />

          {/* Card Switcher (If Multiple) & Create New (Desktop) */}
          {/* Card Switcher (If Multiple) & Create New (Responsive) */}
          {/* Mobile Main Column Wrapper */}
          <div className="flex flex-col items-center w-full md:block">

            {/* Card Switcher & Create New (Mobile: Part of flow, Desktop: Header row) */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full max-w-[420px] md:max-w-none">
              {cards.length > 1 && (
                <div className="flex items-center gap-3 w-full md:w-auto p-1 bg-white md:bg-transparent rounded-xl md:rounded-none border md:border-none border-gray-100 shadow-sm md:shadow-none">
                  <span className="text-sm font-medium text-gray-600 pl-2 whitespace-nowrap">Active Card:</span>
                  <Select value={activeCardIndex.toString()} onValueChange={(v) => setActiveCardIndex(parseInt(v))}>
                    <SelectTrigger className="w-full md:w-[200px] h-10 bg-gray-50 md:bg-white border-0 md:border md:border-gray-200 focus:ring-0">
                      <SelectValue placeholder="Select Card" />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((card, idx) => (
                        <SelectItem key={card.id} value={idx.toString()}>
                          {card.job_title || "My Card"} {card.is_primary ? "(Default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Set as Primary Button */}
                  {isPremium && cards.length > 1 && !cards[activeCardIndex]?.is_primary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(cards[activeCardIndex].id)}
                      className="text-[10px] h-8 text-primary hover:text-primary hover:bg-primary/5 px-2"
                    >
                      Make Default
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => initDashboard()}
                    title="Sync Data"
                    className="h-8 w-8 text-slate-400 hover:text-primary transition-all ml-auto"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              )}

              {/* Create New Card Button */}
              {!userData?.isTeam && (
                <>
                  {/* Standard Create (If under limit) */}
                  {cards.length < (isPremium ? 2 : 1) && (
                    <Link to="/create" className="inline-flex w-full md:w-auto mt-2 md:mt-0">
                      <Button variant="outline" className="w-full md:w-auto gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 justify-center h-12 md:h-10 shadow-sm md:shadow-none rounded-xl font-medium">
                        <Plus className="w-4 h-4" />
                        Create New Card
                      </Button>
                    </Link>
                  )}

                  {/* Locked Create (If Free & Limit Reached) */}
                  {!isPremium && cards.length >= 1 && (
                    <Link to="/pricing" className="inline-flex w-full md:w-auto mt-2 md:mt-0">
                      <Button variant="outline" className="w-full md:w-auto gap-2 bg-white hover:bg-amber-50 text-gray-400 hover:text-amber-700 border border-dashed border-gray-300 hover:border-amber-200 justify-center h-12 md:h-10 shadow-none rounded-xl font-medium group transition-all">
                        <Lock className="w-3.5 h-3.5 group-hover:text-amber-600 transition-colors" />
                        <span className="group-hover:text-amber-700 transition-colors">Create New Card</span>
                        <Crown className="w-3 h-3 text-amber-500 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>


            <div className="grid lg:grid-cols-12 gap-8 items-start mb-12">
              {/* Left Column - Card Preview */}
              <div className="lg:col-span-5 flex flex-col gap-6 items-center w-full">
                {/* Mobile Header (Compact) */}
                {/* Mobile Header (Full) */}
                {/* Mobile Header (Centered) */}
                <div className="md:hidden w-full max-w-[420px] mb-8 mt-4 flex flex-col items-center text-center space-y-4 px-4 mx-auto">
                  <div className="flex flex-col items-center gap-2 w-full">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                      {firstName} <span className="animate-wave origin-bottom-right inline-block">👋</span>
                    </h1>
                    <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${userData?.isTeam ? "bg-teal-50 text-teal-700 border-teal-100" : isPremium ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                      {userData?.isTeam ? "Teams Plan" : isPremium ? "Plus Plan" : "Free Plan"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">Manage, share, and grow your professional presence</p>
                </div>

                {/* Card Container */}
                <div className="relative group w-full max-w-[360px] aspect-[9/16] z-10 mx-auto mb-7">
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] md:text-[11px] font-bold tracking-wide border border-emerald-100 uppercase shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Live
                    </span>
                  </div>

                  <div className="w-full h-full rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:shadow-2xl border-[6px] md:border-[8px] border-white ring-1 ring-gray-950/5 overflow-hidden bg-gray-100 transform transition-transform duration-500 hover:scale-[1.02]">
                    {userData ? (
                      <DigitalCard userData={userData} showBranding={!isPremium} premium={isPremium} previewMode={true} isTeam={userData.isTeam} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Public Profile Link */}
                {/* Public Profile Link (Utility Chip) */}
                <div className="w-full max-w-[360px] md:max-w-xs px-2 md:px-0 mb-6 md:mb-0">
                  <div className="flex items-center gap-2 p-1.5 pl-3 bg-gray-100/80 md:bg-gray-50 rounded-full md:rounded-lg border border-transparent md:border-gray-200 shadow-none md:shadow-none transition-all">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <span className="flex-1 text-[10px] md:text-xs text-gray-600 truncate font-medium font-mono">
                      {displayLinkText}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm text-gray-500 transition-all"
                      onClick={handleCopy}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column - Actions & Insights */}
              <div className="lg:col-span-7 flex flex-col gap-6 w-full max-w-[420px] md:max-w-none">

                {/* FREE PLAN DASHBOARD: Upsell Section */}
                {!isPremium && !userData?.isTeam && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Plus Card */}
                    <Link to="/pricing" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-400/10 rounded-lg text-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                          <Crown className="w-5 h-5 fill-amber-500/10" />
                        </div>
                        <span className="font-bold text-amber-900">Plus</span>
                      </div>
                      <p className="text-xs text-amber-800/80 mb-3 leading-relaxed">
                        Custom card design, QR, and analytics.
                      </p>
                      <div className="flex items-center text-xs font-bold text-amber-700 group-hover:gap-2 transition-all">
                        Upgrade <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    </Link>

                    {/* Teams Card */}
                    <Link to="/teams" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 p-5 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-teal-900">Teams</span>
                      </div>
                      <p className="text-xs text-teal-800/80 mb-3 leading-relaxed">
                        Admin control & central billing. From ₹1499/year.
                      </p>
                      <div className="flex items-center text-xs font-bold text-teal-700 group-hover:gap-2 transition-all">
                        Create Team <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    </Link>

                    {/* NFC Card */}
                    <Link to="/nfc" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <ScanLine className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-blue-900">NFC</span>
                      </div>
                      <p className="text-xs text-blue-800/80 mb-3 leading-relaxed">
                        Premium metal & matte black cards.
                      </p>
                      <div className="flex items-center text-xs font-bold text-primary group-hover:gap-2 transition-all">
                        Shop Now <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    </Link>
                  </div>
                )}

                {/* PLUS USER: Teams Upsell */}
                {isPremium && !userData?.isTeam && (
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 text-[#0F172A]">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0F172A] text-sm">Upgrade your company?</h4>
                        <p className="text-xs text-slate-500">Switch to Teams for centralized control & billing.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {/* Downgrade/Switch Option */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-slate-500 text-xs hover:text-red-600">
                            Leave Plus
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Switching Plans?</DialogTitle>
                          </DialogHeader>
                          <div className="py-4 text-sm text-slate-600 space-y-4">
                            <p>If you are upgrading to Teams, you might want to cancel your individual Plus subscription to avoid double billing.</p>
                            <p>Creating a Team will make you an Admin (which includes Premium features).</p>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={async () => {
                              try {
                                // 1. Update DB
                                const { error } = await supabaseClient
                                  .from("profiles")
                                  .update({ is_premium: false, team_id: null })
                                  .eq("clerk_user_id", user?.id);

                                if (error) throw error;

                                // 2. Update Local State
                                setIsPremium(false);
                                localStorage.setItem("user_card_data", JSON.stringify({ ...userData, isPremium: false, team_id: null }));

                                // 3. Update Cards State (to prevent auto-revert)
                                if (cards.length > 0) {
                                  const updatedCards = [...cards];
                                  if (updatedCards[activeCardIndex]) {
                                    updatedCards[activeCardIndex].is_premium = false;
                                    updatedCards[activeCardIndex].team_id = null;
                                    // also clear team object if joined
                                    if (updatedCards[activeCardIndex].teams) updatedCards[activeCardIndex].teams = null;
                                    setCards(updatedCards);
                                  }
                                }

                                window.dispatchEvent(new Event("local-storage-update"));
                                toast({ title: "Plan Downgraded", description: "You are now on the Free plan." });

                              } catch (err) {
                                console.error("Downgrade failed", err);
                                toast({ title: "Error", description: "Failed to update plan. Please try again.", variant: "destructive" });
                              }
                            }}>Confirm Downgrade</Button>
                            <Link to="/teams"><Button>Go to Teams</Button></Link>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Link to="/teams">
                        <Button size="sm" className="bg-[#0F172A] text-white hover:bg-slate-800 rounded-lg text-xs">
                          Create Team
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* TEAM USER: Management Section */}
                {userData?.isTeam && (
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-full shadow-sm border border-teal-100 text-teal-700">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-teal-900 text-sm">
                          {userData?.company ? `${userData.company} Team` : "Your Team"}
                        </h4>
                        <p className="text-xs text-teal-600/80">You are a member of this team.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {/* Leave Team Option */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-teal-600/70 text-xs hover:text-red-600 hover:bg-red-50">
                            Leave Team
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-red-600 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" />
                              Leave Team?
                            </DialogTitle>
                          </DialogHeader>
                          <div className="py-4 text-sm text-slate-600 space-y-4">
                            <p>Are you sure you want to leave <strong>{userData?.company || "this team"}</strong>?</p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-500 text-xs">
                              <li>You will lose access to team premium features.</li>
                              <li>Your account will be downgraded to the Free plan.</li>
                              <li>You can only rejoin if invited again by the Admin.</li>
                            </ul>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => document.getElementById('close-dialog')?.click()}>Cancel</Button>

                            <Button variant="destructive" onClick={async () => {
                              try {
                                // 1. Unlink Profile & Reset Branding
                                const { error: profileError } = await supabaseClient
                                  .from("profiles")
                                  .update({
                                    team_id: null,
                                    is_premium: false,
                                    theme_color: 'classic-white', // Reset to default
                                    banner_url: null, // Clear team banner
                                    // Keep logo_url if they uploaded their own, usually better experience?
                                    // But typically team overrides logo. Let's start with reset logic.
                                    // Actually, let's keep logo_url to avoid data loss, user can change manually.
                                  })
                                  .eq("id", userData.id);

                                if (profileError) throw profileError;

                                // 2. Update Member Status to 'left'
                                // We need to find the member record first... or just update by email/user_id
                                if (user?.primaryEmailAddress?.emailAddress) {
                                  await supabaseClient
                                    .from("team_members")
                                    .update({ status: 'left' })
                                    .eq("email", user.primaryEmailAddress.emailAddress)
                                    .eq("status", "active"); // only active ones
                                }

                                // 3. Update Local State
                                setIsPremium(false);

                                // Reset cards state
                                const updatedCards = [...cards];
                                if (updatedCards[activeCardIndex]) {
                                  updatedCards[activeCardIndex].is_premium = false;
                                  updatedCards[activeCardIndex].team_id = null;
                                  updatedCards[activeCardIndex].teams = null;
                                  setCards(updatedCards);
                                  setUserData({ ...userData, isTeam: false, company: null });
                                }

                                localStorage.setItem("user_card_data", JSON.stringify({ ...userData, isPremium: false, team_id: null }));
                                window.dispatchEvent(new Event("local-storage-update"));

                                toast({ title: "Left Team", description: "You have successfully left the team." });
                                window.location.reload(); // safest to reload to clear all team state

                              } catch (err: any) {
                                console.error("Leave team failed", err);
                                toast({ title: "Error", description: err.message || "Failed to leave team.", variant: "destructive" });
                              }
                            }}>Confirm Leave</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Link to="/teams">
                        <Button size="sm" className="bg-teal-700 text-white hover:bg-teal-800 rounded-lg text-xs shadow-sm">
                          View Team
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Plus Features Section (Requested) */}
                {isPremium && (
                  <div className={`bg-gradient-to-r ${userData?.isTeam ? "from-teal-50 to-emerald-50 border-teal-100" : "from-amber-50 to-orange-50 border-orange-100"} rounded-2xl border p-6`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-base font-bold ${userData?.isTeam ? "text-teal-900" : "text-amber-900"} flex items-center gap-2`}>
                        {userData?.isTeam ? <Users className="w-5 h-5 text-teal-600" /> : <Crown className="w-5 h-5 text-amber-600 fill-amber-600" />}
                        {userData?.isTeam ? "Team Features" : "Plus Features"}
                      </h3>
                      {cards[activeCardIndex]?.subscription?.current_period_end ? (
                        <div className="flex flex-col items-end">
                          <span className={`text-[10px] font-bold ${userData?.isTeam ? "text-teal-700" : "text-amber-700"}`}>
                            {(() => {
                              const end = new Date(cards[activeCardIndex].subscription.current_period_end);
                              const now = new Date();
                              const diff = end.getTime() - now.getTime();
                              const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                              return days > 0 ? `${days} DAYS LEFT` : "EXPIRES TODAY";
                            })()}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">RENEWS ANNUALLY</span>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-bold ${userData?.isTeam ? "text-teal-700 border-teal-200/50" : "text-amber-700 border-amber-200/50"} bg-white/50 px-2 py-1 rounded-full border`}>ACTIVE</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="h-auto py-3 justify-start bg-white/80 border-orange-200 text-amber-900 hover:bg-white hover:text-amber-700">
                            <QrCode className="w-4 h-4 mr-2 text-amber-600" />
                            <div className="text-left">
                              <span className="block text-sm font-semibold">Custom QR Code</span>
                              <span className="block text-[10px] opacity-70 font-normal">Download high-res formats</span>
                            </div>
                          </Button>
                        </DialogTrigger>
                        <QRDialogContent />
                      </Dialog>

                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start bg-white/80 border-orange-200 text-amber-900 hover:bg-white hover:text-amber-700"
                        onClick={scrollToAnalytics}
                      >
                        <BarChart2 className="w-4 h-4 mr-2 text-amber-600" />
                        <div className="text-left">
                          <span className="block text-sm font-semibold">Detailed Analytics</span>
                          <span className="block text-[10px] opacity-70 font-normal">View traffic insights below</span>
                        </div>
                      </Button>

                      {/* AI Scanner */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative group cursor-pointer">
                            <Button
                              variant="outline"
                              className="w-full h-auto py-3 justify-start bg-white/80 border-orange-200 text-amber-900 hover:bg-white hover:text-amber-700"
                            >
                              <ScanLine className="w-4 h-4 mr-2 text-amber-600" />
                              <div className="text-left">
                                <span className="block text-sm font-semibold">AI Scanner</span>
                                <span className="block text-[10px] opacity-70 font-normal">Digitize paper cards</span>
                              </div>
                            </Button>
                          </div>
                        </DialogTrigger>
                        <AIScanner onSuccess={() => toast({ title: "Card Scanned", description: "Contact saved successfully." })} />
                      </Dialog>

                      {/* Contacts */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative group cursor-pointer">
                            <Button
                              variant="outline"
                              className="w-full h-auto py-3 justify-start bg-white/80 border-orange-200 text-amber-900 hover:bg-white hover:text-amber-700"
                            >
                              <Users className="w-4 h-4 mr-2 text-amber-600" />
                              <div className="text-left">
                                <span className="block text-sm font-semibold">Contacts Manager</span>
                                <span className="block text-[10px] opacity-70 font-normal">Smart address book</span>
                              </div>
                            </Button>
                          </div>
                        </DialogTrigger>
                        <ContactsManager />
                      </Dialog>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <Button
                      variant="ghost"
                      className="h-auto p-3 sm:p-4 flex flex-row items-center justify-start text-left gap-4 bg-gray-50/50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200 rounded-xl group w-full min-h-[48px]"
                      onClick={() => navigate(userData?.id ? `/profile?id=${userData.id}` : "/profile")}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/5 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Edit className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900">Edit Card</span>
                        <span className="text-xs text-gray-500 font-normal hidden sm:block">Update your details & design</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className={`h-auto p-3 sm:p-4 flex flex-row items-center justify-start text-left gap-4 border border-transparent hover:shadow-sm transition-all duration-200 rounded-xl group w-full min-h-[48px] ${userData?.isLocked ? "bg-red-50 text-red-900 hover:bg-red-100 hover:border-red-200" : "bg-gray-50/50 hover:border-gray-200 hover:bg-white"}`}
                      onClick={handleLockToggle}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${userData?.isLocked ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                        {userData?.isLocked ? <Lock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{userData?.isLocked ? "Unlock Card" : "Lock Card"}</span>
                        <span className={`text-xs font-normal hidden sm:block ${userData?.isLocked ? "text-red-700/80" : "text-gray-500"}`}>
                          {userData?.isLocked ? "Card is hidden from public" : "Temporarily hide your profile"}
                        </span>
                      </div>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-auto p-3 sm:p-4 flex flex-row items-center justify-start text-left gap-4 bg-gray-50/50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200 rounded-xl group w-full min-h-[48px]"
                        >
                          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Share2 className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-gray-900">Share Card</span>
                            <span className="text-xs text-gray-500 font-normal hidden sm:block">Send to anyone, anywhere</span>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <ShareDialogContent />
                    </Dialog>

                    {/* Mobile Only QR (Desktop has it in Plus section or modal) - Keeping for consistency */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-auto p-3 sm:p-4 flex flex-row items-center justify-start text-left gap-4 bg-gray-50/50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200 rounded-xl group w-full min-h-[48px]"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-gray-900">Download QR</span>
                            <span className="text-xs text-gray-500 font-normal hidden sm:block">Get print-ready QR codes</span>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <QRDialogContent />
                    </Dialog>

                    <Button
                      variant="ghost"
                      className="h-auto p-3 sm:p-4 flex flex-row items-center justify-start text-left gap-4 bg-gray-50/50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200 rounded-xl group w-full min-h-[48px]"
                      onClick={() => navigate("/nfc")}
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900">Buy NFC</span>
                        <span className="text-xs text-gray-500 font-normal hidden sm:block">Order physical premium cards</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="h-auto p-3 sm:p-4 flex flex-row items-center justify-start text-left gap-4 bg-gray-50/50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200 rounded-xl group w-full min-h-[48px]"
                      onClick={() => navigate("/exchanged-contacts")}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900">Exchanged Contacts</span>
                        <span className="text-xs text-gray-500 font-normal hidden sm:block">View contact exchanges</span>
                      </div>
                    </Button>



                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-auto p-3 sm:p-4 flex flex-row items-center justify-start text-left gap-4 bg-white border border-red-50 hover:bg-red-50 hover:border-red-100 transition-all duration-200 rounded-xl group w-full min-h-[48px]"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform group-hover:bg-red-100">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-red-600 group-hover:text-red-700">Delete Card</span>
                            <span className="text-xs text-red-400 font-normal hidden sm:block group-hover:text-red-500">Permanently remove this card</span>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DeleteDialogContent />
                    </Dialog>
                  </div>
                </div>

                {/* Physical NFC Cards Manager */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <PhysicalCardManager
                    profileId={userData?.id}
                    onUpdate={() => initDashboard()}
                  />
                </div>

                {/* Insights Section */}
                <div ref={analyticsRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-1 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${userData?.isTeam ? "text-teal-500" : isPremium ? "text-amber-500" : "text-gray-400"}`} />
                      Analytics
                    </h3>
                    {isPremium && <span className={`text-[10px] font-bold ${userData?.isTeam ? "text-teal-600 bg-teal-50 border-teal-100" : "text-amber-600 bg-amber-50 border-amber-100"} px-2 py-0.5 rounded-full border`}>
                      {userData?.isTeam ? "TEAMS" : "PLUS"}
                    </span>}
                  </div>

                  <div className={`space-y-4 relative z-10 ${!isPremium ? "opacity-60" : ""}`}>
                    {isPremium && chartData.length > 0 && (
                      <div className="h-40 w-full mb-6 relative">
                        {/* Gradient overlay to make it look smooth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }}
                              dy={10}
                            />
                            <Tooltip
                              cursor={{ fill: '#f8fafc', radius: 4 }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                            />

                            <Bar dataKey="views" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Profile Views</span>
                      <span className={`text-sm font-mono font-bold text-gray-900 ${!isPremium ? "blur-[5px] select-none" : ""}`}>
                        {isPremium ? realStats.views : "1,248"}
                      </span>
                    </div>
                  </div>

                  {!isPremium && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[2px] pt-4 md:pt-10">
                      <Link to="/plus">
                        <Button className="bg-gray-900 text-white hover:bg-black shadow-lg border border-gray-800 transition-all hover:scale-105 rounded-full px-6">
                          <Crown className="w-3.5 h-3.5 mr-2 text-amber-300" />
                          Unlock insights with Plus
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="text-center pt-8 pb-4 opacity-40 hover:opacity-100 transition-opacity">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                Powered by SimplifyTap®
              </p>
              <p className="text-[9px] text-gray-300 font-medium tracking-widest mt-1">Digital Identity Platform</p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
