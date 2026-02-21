import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/simplify-tap-logo.png";
import { themes } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { DigitalCard } from "@/components/simplify-tap/DigitalCard";
import { PremiumModal } from "@/components/simplify-tap/PremiumModal";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Globe, Linkedin, Twitter, Instagram, Save, Share2, Crown, Building2, Trash2, Plus, Facebook, Youtube, Github, Image as ImageIcon, Link as LinkIcon, Video, Palette, QrCode, Layout, Settings, Smartphone, Lock, CheckCircle2, ChevronLeft, ChevronRight, Upload, X, Type, CreditCard, Loader2, Circle, ArrowUpCircle, MousePointerClick, AlignLeft, GripVertical, ChevronDown, Check } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/hooks/useSupabase";
import { ImageUpload } from "@/components/simplify-tap/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableSection = ({ id, children }: { id: string, children: (props: { listeners: any, attributes: any }) => React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : 'auto',
    position: 'relative' as const,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className={`mb-5 ${isDragging ? 'shadow-2xl scale-105' : ''}`}>
      {children({ listeners, attributes })}
    </div>
  );
};

const DragHandle = () => (
  <div className="text-slate-300 cursor-grab active:cursor-grabbing p-1">
    <GripVertical className="w-4 h-4" />
  </div>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37055 0 0 5.37055 0 12C0 18.6295 5.37055 24 12 24C18.6295 24 24 18.6295 24 12C24 5.37055 18.6295 0 12 0ZM17.9734 8.71887C17.7533 10.963 16.634 16.4862 16.0963 19.3448C15.8675 20.5517 15.4191 20.9479 14.9961 20.9858C14.0759 21.0691 13.3768 20.3701 12.4851 19.7924C11.0894 18.8878 10.3013 18.3308 8.94709 17.447C7.38153 16.4258 8.39706 15.8631 9.29084 14.9431C9.52462 14.7025 13.5855 11.0543 13.6644 10.7225C13.6738 10.6806 13.6826 10.6277 13.6558 10.5802C13.6288 10.5332 13.562 10.5176 13.5303 10.5103C13.4847 10.5002 12.7663 10.9702 11.3742 11.9029C9.3242 13.2982 7.25197 14.5492 7.25197 14.5492C5.97931 14.9452 4.88876 14.9084 3.99602 14.6555C2.89679 14.3439 2.05374 14.1203 2.05374 14.1203C1.22941 13.8443 2.15545 13.3957 2.15545 13.3957C4.64016 12.2227 10.2319 9.8973 14.7176 8.04603C16.4252 7.35414 18.1738 7.03606 17.9734 8.71887Z" /></svg>
);

const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
];

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const [searchParams] = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Premium & Team simulation
  const [isPremium, setIsPremium] = useState(false);
  const [teamSettings, setTeamSettings] = useState<{ id: string, theme: string, logo: string, company?: string, isTeamAdmin?: boolean, template_id?: string, style?: any } | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("user_card_data");
    const data = savedData ? JSON.parse(savedData) : {};
    setIsPremium(!!data.isPremium);
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    company: "",
    username: "",
    email: "",
    phone: "",
    countryCode: "+91",
    website: "",
    bio: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    logoUrl: "",
    bannerUrl: "",
    themeColor: "",
    themeId: "classic-white",
    showBranding: false,
    mapLink: "",
    companyLogoUrl: "",
    featuredVideo: "",
    socialLinks: [] as Array<{ id: string, platform: string, url: string, active: boolean, label?: string }>,
    // New Design State
    templateId: "modern",
    font: "Inter",
    cardStyle: {
      borderRadius: 16,
      shadow: true,
      background: true,
      backgroundImage: ''
    },
    customColors: {
      primary: '',
      secondary: '',
      background: '',
      text: ''
    },
    customComponents: [] as Array<{ id: string, type: 'heading' | 'text' | 'button', title?: string, content?: string, url?: string, active: boolean }>,
    pageLoader: {
      animation: 'default' as 'default' | 'pulse' | 'bounce' | 'none',
      logoType: 'brand' as 'brand' | 'custom' | 'none',
      customUrl: ''
    },
    visibleSections: {} as Record<string, boolean>,
    is_primary: false,
  });

  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 240;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Section Order State
  const [sectionOrder, setSectionOrder] = useState<string[]>(
    (JSON.parse(localStorage.getItem("user_card_data") || '{}').sectionOrder || ['profile', 'bio', 'social', 'contact', 'weblinks', 'video', 'gallery'])
      .flatMap((s: string) => s === 'media' ? ['video', 'gallery'] : s)
  );

  // Deduplicate and filter sectionOrder to ensure safety
  const validSectionOrder = useMemo(() => {
    // Ensure sectionOrder is always an array
    const baseOrder = Array.isArray(sectionOrder) ? sectionOrder : [];
    // Ensure all items are strings and unique
    const unique = Array.from(new Set(baseOrder.filter(item => typeof item === 'string' && item.trim() !== '')));

    // Safety: dnd-kit crashes if items are undefined or not unique.
    console.log("Safe Section Order:", unique);
    return unique;
  }, [sectionOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = () => {
    // Add dragging class to body to disable pointer events on accordion content
    document.body.classList.add('dragging');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Remove dragging class from body
    document.body.classList.remove('dragging');

    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/signin");
    }
  }, [isLoaded, isSignedIn, navigate]);

  const authenticatedClient = useSupabase();

  // Fetch Profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        setLoadingProfile(true);
        if (!authenticatedClient) return;

        let data, error;
        const paramId = searchParams.get('id');

        if (paramId) {
          // Check if paramId is a valid UUID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramId);

          if (isUuid) {
            const result = await authenticatedClient.from("profiles").select("*").eq('id', paramId).maybeSingle();
            data = result.data;
            error = result.error;
          } else {
            // If not UUID, try matching by username or Clerk ID (strictly for this user via RLS)
            const result = await authenticatedClient
              .from("profiles")
              .select("*")
              .or(`username.eq.${paramId},clerk_user_id.eq.${paramId}`)
              .maybeSingle();
            data = result.data;
            error = result.error;
          }
        } else {
          const result = await authenticatedClient.from("profiles").select("*").eq("clerk_user_id", user.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
          data = result.data;
          error = result.error;
        }

        if (data) {
          setProfileId(data.id);
          let teamTheme = data.theme_color;
          let teamLogo = data.company_logo_url;

          // --- Global Premium Sync Logic ---
          let isPremiumAcc = data.is_premium || false;
          if (!isPremiumAcc && user.id) {
            const { data: premiumCheck } = await authenticatedClient
              .from('profiles')
              .select('id')
              .eq('clerk_user_id', user.id)
              .eq('is_premium', true)
              .limit(1)
              .maybeSingle();

            if (premiumCheck) {
              isPremiumAcc = true;
              // Self-healing: if we found another premium card, mark this one as premium too
              await authenticatedClient.from('profiles').update({ is_premium: true }).eq('id', data.id);
            }
          }
          setIsPremium(isPremiumAcc);
          // ----------------------------------

          let companyNameOverride = data.company;
          let teamTemplate = null;
          let teamStyle = null;

          if (data.team_id) {
            const { data: teamData } = await authenticatedClient
              .from("teams")
              .select("*")
              .eq("id", data.team_id)
              .maybeSingle();

            if (teamData) {
              if (teamData.theme_color) teamTheme = teamData.theme_color;
              if (teamData.logo_url) teamLogo = teamData.logo_url;
              if (teamData.company_name) companyNameOverride = teamData.company_name;
              teamTemplate = teamData.template_id;
              teamStyle = teamData.style;

              setTeamSettings({
                id: data.team_id,
                theme: teamData.theme_color,
                logo: teamData.logo_url,
                company: teamData.company_name,
                isTeamAdmin: teamData.admin_id === user.id,
                template_id: teamData.template_id,
                style: teamData.style
              });
              setIsPremium(true);
            }
          }

          let loadedLinks: any[] = [];
          if (data.social_links && Array.isArray(data.social_links)) {
            loadedLinks = data.social_links;
          } else {
            if (data.linkedin) loadedLinks.push({ id: 'legacy_li', platform: 'linkedin', url: data.linkedin, active: true });
            if (data.X) loadedLinks.push({ id: 'legacy_tw', platform: 'twitter', url: data.X, active: true });
            if (data.Instagram) loadedLinks.push({ id: 'legacy_ig', platform: 'instagram', url: data.Instagram, active: true });
          }

          // Parse Phone Number
          const rawPhone = data.phone || "";
          const foundCode = COUNTRY_CODES.find(c => rawPhone.startsWith(c.code))?.code || "+91";
          const phoneNum = rawPhone.startsWith(foundCode) ? rawPhone.slice(foundCode.length) : rawPhone;

          setFormData(prev => ({
            ...prev,
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            title: data.job_title || "",
            company: companyNameOverride || "",
            username: data.username || "",
            email: data.card_mail || data.email || "",
            phone: phoneNum,
            countryCode: foundCode,
            bio: data.bio || "",
            website: data.website || "",
            linkedin: data.linkedin || "",
            twitter: data.X || "",
            instagram: data.Instagram || "",
            mapLink: data.map_link || "",
            logoUrl: data.avatar_url || "",
            bannerUrl: data.banner_url || "",
            themeColor: teamTheme || "",
            themeId: teamTheme || "classic-white",

            // Load Design Settings
            templateId: teamTemplate || data.style?.templateId || "modern",
            font: data.style?.font || "Inter",
            cardStyle: data.style?.cardStyle || { borderRadius: 16, shadow: true, background: true },
            customComponents: data.style?.customComponents || [],

            // Load Missing Style Props
            visibleSections: data.style?.visibleSections || {},
            customColors: teamStyle?.customColors || data.style?.customColors || { primary: '', secondary: '', background: '', text: '' },
            pageLoader: data.style?.pageLoader || { animation: 'default', logoType: 'brand', customUrl: '' },
            is_primary: data.is_primary || false,
            companyLogoUrl: teamLogo || "",
            // Filter out old helper fields if present in JSON to avoid dups? No, just load them.
            // Filter out 'featured_video' from socialLinks to prevent duplication with the specific state field
            socialLinks: loadedLinks.filter((l: any) => l.platform !== 'featured_video'),
            featuredVideo: loadedLinks.find((l: any) => l.platform === 'featured_video')?.url || "",
            showBranding: !data.is_premium,
          }));

          // Set Section Order
          if (data.style?.sectionOrder && Array.isArray(data.style?.sectionOrder)) {
            // Migrate 'media' -> 'video', 'gallery'
            let migratedOrder = data.style.sectionOrder.flatMap((s: string) => s === 'media' ? ['video', 'gallery'] : s);

            // Migration: Add 'bio' after 'profile' if it doesn't exist
            if (!migratedOrder.includes('bio')) {
              const profileIndex = migratedOrder.indexOf('profile');
              if (profileIndex !== -1) {
                // Insert 'bio' right after 'profile'
                migratedOrder.splice(profileIndex + 1, 0, 'bio');
              } else {
                // If no 'profile', add 'bio' at the beginning
                migratedOrder.unshift('bio');
              }
            }

            // Migration: Remove 'contact' since it's now part of profile (but keep it in section order for rendering)
            // Actually, we need to keep 'contact' in the order so buttons render, just don't show it in editor
            // migratedOrder = migratedOrder.filter(s => s !== 'contact');

            // Migration: Ensure 'contact' exists for button rendering (add after 'bio' if missing)
            if (!migratedOrder.includes('contact')) {
              const bioIndex = migratedOrder.indexOf('bio');
              if (bioIndex !== -1) {
                migratedOrder.splice(bioIndex + 1, 0, 'contact');
              } else {
                const profileIndex = migratedOrder.indexOf('profile');
                if (profileIndex !== -1) {
                  migratedOrder.splice(profileIndex + 1, 0, 'contact');
                } else {
                  migratedOrder.push('contact');
                }
              }
            }

            setSectionOrder(migratedOrder);
          } else {
            // Default order + any custom components found
            const defaultOrder = ['profile', 'bio', 'social', 'contact', 'weblinks', 'video', 'gallery'];
            const customIds = (data.style?.customComponents || []).map((c: any) => c.id);
            setSectionOrder([...defaultOrder, ...customIds]);
          }
        } else {
          setProfileId(null);
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.primaryEmailAddress?.emailAddress || "",
          }));
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    if (isLoaded && isSignedIn) {
      fetchProfile();
    }
  }, [isLoaded, isSignedIn, user, authenticatedClient, searchParams]);

  const cardUrl = useMemo(() => {
    const identifier = formData.username || user?.id;
    if (!identifier) return "";
    return `${window.location.origin}/card/${identifier}`;
  }, [user, formData.username]);

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) return;
    setCheckingUsername(true);
    try {
      if (!authenticatedClient) return;
      const { data, error } = await authenticatedClient
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .neq("id", profileId || "")
        .maybeSingle();

      if (error) throw error;
      setUsernameValid(!data);
    } catch (err) {
      console.error("Username check failed", err);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'username') {
      const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      setFormData({ ...formData, [name]: sanitized });
      if (sanitized.length >= 3) {
        checkUsername(sanitized);
      } else {
        setUsernameValid(null);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!user || !authenticatedClient) return;
    setIsSaving(true);

    try {
      const getLink = (plat: string) => formData.socialLinks?.find(l => l.platform === plat && l.active !== false)?.url || "";

      // Ensure socialLinks includes featured_video if set
      let finalLinks = [...formData.socialLinks];
      // Remove existing video entry if exists to avoid dup
      finalLinks = finalLinks.filter(l => l.platform !== 'featured_video');
      if (formData.featuredVideo) {
        finalLinks.push({ id: 'feat_vid', platform: 'featured_video', url: formData.featuredVideo, active: true });
      }

      // 1. Sanitize Custom Colors to prevent empty strings
      const safeCustomColors = {
        primary: formData.customColors?.primary || formData.themeColor || '#000000',
        secondary: formData.customColors?.secondary || '#ffffff',
        background: formData.customColors?.background || '#ffffff',
        text: formData.customColors?.text || '#000000',
      };

      // 2. Fetch existing style to prevent overwrite (Safe Merge)
      let existingStyle = {};
      if (profileId) {
        const { data: currentProfile } = await authenticatedClient
          .from("profiles")
          .select("style")
          .eq("id", profileId)
          .single();
        if (currentProfile?.style) {
          existingStyle = currentProfile.style;
        }
      }

      const updates: any = {
        clerk_user_id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        job_title: formData.title,
        company: formData.company,
        username: formData.username || null,
        is_primary: formData.is_primary || false,
        email: formData.email,
        card_mail: formData.email,
        bio: formData.bio,
        phone: `${formData.countryCode}${formData.phone}`,
        website: formData.website,
        linkedin: getLink('linkedin'),
        "X": getLink('twitter'),
        "Instagram": getLink('instagram'),
        map_link: formData.mapLink,
        avatar_url: formData.logoUrl,
        banner_url: formData.bannerUrl,
        theme_color: formData.themeId, // Saving themeId
        style: {
          ...existingStyle, // Merge existing props
          templateId: formData.templateId,
          font: formData.font,
          cardStyle: formData.cardStyle,
          customComponents: formData.customComponents,
          sectionOrder: sectionOrder,
          visibleSections: formData.visibleSections,
          customColors: safeCustomColors, // Use safe colors
          pageLoader: formData.pageLoader
        },
        company_logo_url: formData.companyLogoUrl,
        social_links: finalLinks,
        updated_at: new Date().toISOString(),
      };

      // 1b. If user is Team Admin, update the Team record as well
      if (teamSettings?.isTeamAdmin) {
        await authenticatedClient
          .from("teams")
          .update({
            theme_color: formData.themeId,
            template_id: formData.templateId,
            style: {
              ...(teamSettings.style || {}),
              customColors: safeCustomColors
            }
          })
          .eq("id", teamSettings.id);
      }

      let savedData;
      let saveError;

      if (profileId) {
        const result = await authenticatedClient
          .from("profiles")
          .update(updates)
          .eq("id", profileId)
          .select()
          .single();
        savedData = result.data;
        saveError = result.error;
      } else {
        const result = await authenticatedClient
          .from("profiles")
          .insert(updates)
          .select()
          .single();
        savedData = result.data;
        saveError = result.error;
      }

      if (saveError || !savedData) {
        throw new Error(saveError?.message || "Save failed - No data returned from database");
      }

      // 4. Update state with confirmed ID
      setProfileId(savedData.id);

      toast({ title: "Profile saved", description: "Redirecting to dashboard..." });

      // Redirect to dashboard with the specific card selected
      setTimeout(() => {
        window.location.href = `/dashboard?cardId=${savedData.id}`;
      }, 500);

    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'banner' | 'company_logo' | 'gallery' | 'card-bg' | 'loader_image') => {
    if (!user || !authenticatedClient) return;

    try {
      const fileName = `${type}/${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('card-assets').upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('card-assets').getPublicUrl(fileName);
      const publicUrlWithAuth = `${publicUrl}?t=${new Date().getTime()}`;

      if (type === 'gallery') {
        // Add to gallery
        addGalleryImage(publicUrlWithAuth);
      } else {
        // Update state
        if (type === 'profile') setFormData(prev => ({ ...prev, logoUrl: publicUrlWithAuth }));
        else if (type === 'banner') setFormData(prev => ({ ...prev, bannerUrl: publicUrlWithAuth }));
        else if (type === 'card-bg') setFormData(prev => ({ ...prev, cardStyle: { ...prev.cardStyle, backgroundImage: publicUrlWithAuth } }));
        else if (type === 'loader_image') setFormData(prev => ({ ...prev, pageLoader: { ...prev.pageLoader, customUrl: publicUrlWithAuth, logoType: 'custom' } }));
        else if (type === 'company_logo') setFormData(prev => ({ ...prev, companyLogoUrl: publicUrlWithAuth }));
      }

      toast({ title: "Upload Successful", description: "Image updated." });

    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    }
  };

  // Helper Functions
  const handleSocialLinkUpdate = (index: number, field: string, value: any) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, socialLinks: newLinks });
  };

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { id: crypto.randomUUID(), platform: 'instagram', url: '', active: true }]
    });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, socialLinks: newLinks });
  };

  // Web Links
  const addWebLink = () => {
    if (!isPremium && formData.socialLinks.filter(l => l.platform === 'web_link').length >= 2) {
      setShowModal(true);
      return;
    }
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { id: crypto.randomUUID(), platform: 'web_link', url: '', label: '', active: true }]
    });
  };

  // Gallery
  const addGalleryImage = (url: string) => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { id: crypto.randomUUID(), platform: 'gallery_image', url, active: true }]
    });
  };

  // Filter Helper
  const getSocialLinksByType = (type: 'social' | 'web' | 'gallery') => {
    if (type === 'social') return formData.socialLinks.filter(l => !['web_link', 'gallery_image', 'featured_video'].includes(l.platform));
    if (type === 'web') return formData.socialLinks.filter(l => l.platform === 'web_link');
    if (type === 'gallery') return formData.socialLinks.filter(l => l.platform === 'gallery_image');
    return [];
  };

  if (!isLoaded || (isSignedIn && loadingProfile)) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }
  if (!isSignedIn) return null;

  const tabs = [
    { id: "content", label: "Content", icon: Layout },
    { id: "design", label: "Design", icon: Palette },
  ];

  const getSectionContent = (id: string) => {
    switch (id) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-2">
                <Label className="text-xs text-slate-500 font-normal uppercase tracking-wider">Profile Image</Label>
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-sm overflow-hidden bg-slate-100">
                  <ImageUpload currentImageUrl={formData.logoUrl} onUpload={async (f) => { await handleImageUpload(f, 'profile'); }} label="Upload" isCircular={true} className="w-full h-full" />
                </div>
              </div>
              <div className="flex-1 w-full flex flex-col gap-2">
                <Label className="text-xs text-slate-500 font-normal uppercase tracking-wider">Banner Image</Label>
                <div className="w-full h-28 rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50">
                  <ImageUpload currentImageUrl={formData.bannerUrl} onUpload={async (f) => { await handleImageUpload(f, 'banner'); }} label="Upload Banner" aspectRatio="banner" className="w-full h-full" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Label className="text-xs text-slate-500 font-normal uppercase tracking-wider flex items-center gap-1">
                  Logo
                  {!isPremium && !teamSettings && <Lock className="w-3 h-3 text-amber-500" />}
                </Label>
                <div
                  className="w-28 h-28 rounded-xl border-4 border-white shadow-sm overflow-hidden bg-slate-100 relative group cursor-pointer"
                  onClick={() => (!isPremium && !teamSettings) && setShowModal(true)}
                >
                  <ImageUpload
                    currentImageUrl={formData.companyLogoUrl}
                    onUpload={async (f: File) => {
                      if (!isPremium && !teamSettings) return;
                      if (teamSettings && !teamSettings.isTeamAdmin) return;
                      await handleImageUpload(f, 'company_logo');
                    }}
                    label="Logo"
                    className="w-full h-full"
                  />

                  {/* Lock Overlay for Free Users */}
                  {(!isPremium && !teamSettings) && (
                    <div className="absolute inset-0 bg-slate-900/60 z-20 flex items-center justify-center backdrop-blur-[1px]">
                      <Lock className="w-8 h-8 text-white/90" />
                    </div>
                  )}

                  {/* Lock Overlay for Team Members (Non-Admin) */}
                  {(teamSettings && !teamSettings.isTeamAdmin) && (
                    <div className="absolute inset-0 bg-slate-100/80 z-20 flex flex-col items-center justify-center text-slate-400">
                      <Lock className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-medium">Team Managed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5"><Label className="text-sm font-medium text-slate-700">First Name</Label><Input name="firstName" value={formData.firstName} onChange={handleChange} className="bg-white border-slate-200 focus:border-primary" /></div>
              <div className="space-y-1.5"><Label className="text-sm font-medium text-slate-700">Last Name</Label><Input name="lastName" value={formData.lastName} onChange={handleChange} className="bg-white border-slate-200 focus:border-primary" /></div>
              <div className="space-y-1.5"><Label className="text-sm font-medium text-slate-700">Job Title</Label><Input name="title" value={formData.title} onChange={handleChange} className="bg-white border-slate-200 focus:border-primary" /></div>
              <div className="space-y-1.5"><Label className="text-sm font-medium text-slate-700">Company Name</Label><Input name="company" value={formData.company} onChange={handleChange} disabled={!!teamSettings && !teamSettings.isTeamAdmin} className="bg-white border-slate-200 focus:border-primary" /></div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Username / Custom URL</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">simplifytap.in/</div>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`bg-white pl-[118px] border-slate-200 focus:border-primary font-mono text-sm ${usernameValid === false ? 'border-red-500 focus:border-red-500' : usernameValid === true ? 'border-green-500 focus:border-green-500' : ''}`}
                    placeholder="john-doe"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> :
                      usernameValid === true ? <Check className="w-3.5 h-3.5 text-green-500" /> :
                        usernameValid === false ? <div className="text-[10px] text-red-500 font-bold">Taken</div> : null}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">Your card will be available at simplifytap.in/{formData.username || 'username'}</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Contact Information</h3>
              <div className="grid gap-5">
                <div className="space-y-1.5"><Label className="text-sm font-medium text-slate-700">Email Address</Label><Input name="email" value={formData.email} onChange={handleChange} disabled={!!teamSettings && !teamSettings.isTeamAdmin} className="bg-white border-slate-200" /></div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                  <div className="flex gap-2">
                    <Select value={formData.countryCode} onValueChange={(val) => setFormData({ ...formData, countryCode: val })} >
                      <SelectTrigger className="w-[110px] border-slate-200 bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.country} value={c.code}>
                            <span className="mr-2">{c.flag}</span> {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input name="phone" value={formData.phone} onChange={handleChange} className="flex-1 bg-white border-slate-200" placeholder="9876543210" />
                  </div>
                </div>
                <div className="space-y-1.5"><Label className="text-sm font-medium text-slate-700">Website URL</Label><Input name="website" value={formData.website} onChange={handleChange} className="bg-white border-slate-200" /></div>
                <div className="space-y-1.5"><Label className="text-sm font-medium text-slate-700">Location Map URL</Label><Input name="mapLink" value={formData.mapLink} onChange={handleChange} className="bg-white border-slate-200" /></div>
              </div>
            </div>
          </div>
        );
      case 'bio':
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">About / Bio</Label>
            <Textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell people about yourself..."
              className="bg-white border-slate-200 focus:border-primary resize-none"
            />
            <p className="text-xs text-slate-400">This will appear on your digital card</p>
          </div>
        );
      case 'social':
        return (
          <div className="space-y-4">
            {formData.socialLinks
              .map((link, originalIndex) => ({ ...link, originalIndex }))
              .filter(l => !['web_link', 'gallery_image', 'featured_video'].includes(l.platform))
              .map((link, idx) => {
                const SOCIAL_PLATFORMS = [
                  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
                  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                  { id: 'twitter', label: 'X (Twitter)', icon: Twitter, color: 'text-black' },
                  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, color: 'text-green-500' },
                  { id: 'telegram', label: 'Telegram', icon: TelegramIcon, color: 'text-sky-500' },
                  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
                  { id: 'github', label: 'GitHub', icon: Github, color: 'text-slate-800' },
                ];

                const selectedPlatform = SOCIAL_PLATFORMS.find(p => p.id === link.platform) || SOCIAL_PLATFORMS[0];
                const PlatformIcon = selectedPlatform.icon;

                return (
                  <div key={link.id || idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm group">
                    <DragHandle />
                    <Select value={link.platform} onValueChange={(val) => handleSocialLinkUpdate(link.originalIndex, 'platform', val)}>
                      <SelectTrigger className="w-full sm:w-[180px] border-slate-200 bg-slate-50">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <PlatformIcon className={`w-4 h-4 ${selectedPlatform.color}`} />
                            <span>{selectedPlatform.label}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <platform.icon className={`w-4 h-4 ${platform.color}`} />
                              <span>{platform.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1 w-full relative">
                      <Input
                        value={link.url}
                        onChange={(e) => handleSocialLinkUpdate(link.originalIndex, 'url', e.target.value)}
                        placeholder={link.platform === 'whatsapp' ? 'Phone (e.g. 919876543210)' : (link.platform === 'telegram' ? 'Username (e.g. johndoe)' : 'URL...')}
                        className="w-full border-slate-200 text-sm"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeSocialLink(link.originalIndex)} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                );
              })}
            <Button variant="outline" onClick={addSocialLink} className="w-full py-6 border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-medium rounded-2xl"><Plus className="w-4 h-4 mr-2" /> Add Social Link</Button>
          </div>
        );
      case 'contact':
        // Contact details are now part of profile section
        return null;
      case 'weblinks':
        return (
          <div className="space-y-4">
            {formData.socialLinks
              .map((link, originalIndex) => ({ ...link, originalIndex }))
              .filter(l => l.platform === 'web_link')
              .map((link, idx) => (
                <div key={link.id || idx} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-3 relative group">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2"><DragHandle /></div>
                  <div className="pl-6 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1"><Label className="text-xs text-slate-400 uppercase">Label</Label><Input value={link.label} onChange={(e) => handleSocialLinkUpdate(link.originalIndex, 'label', e.target.value)} placeholder="My Portfolio" className="h-9 font-medium" /></div>
                      <Button variant="ghost" size="icon" onClick={() => removeSocialLink(link.originalIndex)} className="text-slate-300 hover:text-red-500 mt-5"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <div className="space-y-1"><Label className="text-xs text-slate-400 uppercase">Destination URL</Label><Input value={link.url} onChange={(e) => handleSocialLinkUpdate(link.originalIndex, 'url', e.target.value)} placeholder="https://..." className="h-9 text-slate-500" /></div>
                  </div>
                </div>
              ))}
            <Button variant="outline" onClick={addWebLink} className="w-full py-6 border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-medium rounded-2xl"><Plus className="w-4 h-4 mr-2" /> Add Web Link</Button>
          </div>
        );
      case 'video':
        return (
          <div className="space-y-6">
            <div><Label className="mb-2 block text-sm font-medium text-slate-700">Featured Video</Label><Input name="featuredVideo" value={formData.featuredVideo} onChange={handleChange} placeholder="YouTube Video URL..." className="bg-white border-slate-200" /></div>
          </div>
        );
      case 'gallery':
        return (
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block text-sm font-medium text-slate-700">Gallery Images</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-slate-100">
                {getSocialLinksByType('gallery').map((link, i) => {
                  const realIndex = formData.socialLinks.findIndex(l => l.id === link.id);
                  return (
                    <div key={link.id} className="aspect-square relative group rounded-lg overflow-hidden border shadow-sm">
                      <img src={link.url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeSocialLink(realIndex)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  );
                })}
                <div className="aspect-square">
                  <ImageUpload onUpload={async (f) => { await handleImageUpload(f, 'gallery'); }} label="+" className="w-full h-full border-2 border-dashed border-slate-200 hover:border-primary/60 hover:bg-primary/10 transition-colors" currentImageUrl="" />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Drag handle helper
  const DragHandle = () => (
    <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 mr-2">
      <div className="flex flex-col gap-[2px]">
        <div className="flex gap-[2px]">
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </div>
        <div className="flex gap-[2px]">
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </div>
        <div className="flex gap-[2px]">
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7f9] font-sans">
      <Navbar />

      <main
        className="pt-16 lg:pt-24 pb-32 lg:pb-32 px-4 h-full relative"
        style={{
          paddingRight: 'env(safe-area-inset-right)',
          paddingLeft: 'env(safe-area-inset-left)',
        }}
      >
        <div className="container mx-auto max-w-7xl">

          <div className="grid lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Editor */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Header / Save Bar */}
              <div className="flex flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-sm relative lg:sticky lg:top-24 z-30 mb-6 transition-all overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-800 leading-tight">Edit Profile</h1>
                    <p className="text-xs text-slate-500 font-medium">Manage your digital card details</p>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="hidden lg:flex w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-full px-6 transition-all transform hover:scale-105 active:scale-95">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              <Tabs defaultValue="content" className="w-full">
                <TabsList className="w-full grid grid-cols-2 h-auto p-1.5 bg-slate-100 rounded-full border border-slate-200/50 sticky top-[calc(4rem+1px)] lg:top-[calc(6rem+5rem)] z-40 select-none">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="rounded-full py-3 text-sm font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm hover:text-slate-700 transition-all duration-300 ease-out flex items-center justify-center gap-2 ring-0 outline-none"
                    >
                      <tab.icon className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                      <span className="truncate">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* --- CONTENT TAB --- */}
                <TabsContent value="content" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-32">
                  {/* 1. Page Template Carousel */}
                  <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-bold text-slate-800">Page Template</Label>
                      <div className="hidden lg:flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-colors"
                          onClick={() => scrollCarousel('left')}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-colors"
                          onClick={() => scrollCarousel('right')}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div
                      ref={carouselRef}
                      className={`grid grid-cols-2 lg:flex gap-4 lg:overflow-x-auto pb-4 scrollbar-hide snap-x px-1 scroll-smooth ${teamSettings && !teamSettings.isTeamAdmin ? 'opacity-70 grayscale-[0.5]' : ''}`}
                    >
                      {['Modern', 'Sleek', 'Minimal', 'Professional', 'Creative'].map((template, i) => (
                        <div
                          key={template}
                          onClick={() => {
                            if (teamSettings && !teamSettings.isTeamAdmin) {
                              toast({ title: "Locked", description: "Team branding is managed by your administrator." });
                              return;
                            }
                            setFormData(prev => ({ ...prev, templateId: template.toLowerCase() }));
                          }}
                          className={`
                                snap-start shrink-0 w-full lg:w-32 cursor-pointer group space-y-2 relative
                                ${teamSettings && !teamSettings.isTeamAdmin ? 'cursor-not-allowed' : ''}
                             `}
                        >
                          <div className={`
                                h-48 rounded-2xl border-2 overflow-hidden relative transition-all bg-white
                                ${formData.templateId === template.toLowerCase() ? 'border-primary ring-4 ring-primary/10' : 'border-slate-200 group-hover:border-slate-300'}
                             `}>
                            {/* Visual Mockup of Template */}
                            <div className="w-full h-full relative opacity-60">
                              {/* Banner Area */}
                              {(template === 'Modern' || template === 'Sleek' || template === 'Creative') && (
                                <div className={`w-full ${template === 'Creative' ? 'h-24' : 'h-16'} bg-slate-300`} />
                              )}
                              {/* Avatar Area */}
                              <div className={`absolute w-10 h-10 bg-slate-400 rounded-full border-2 border-white
                                      ${template === 'Modern' ? 'left-1/2 -translate-x-1/2 top-10' : ''}
                                      ${template === 'Sleek' ? 'left-4 top-12' : ''}
                                      ${template === 'Minimal' ? 'left-1/2 -translate-x-1/2 top-8 w-16 h-16' : ''}
                                      ${template === 'Professional' ? 'left-3 top-3 rounded-lg' : ''}
                                      ${template === 'Creative' ? 'left-1/2 -translate-x-1/2 top-16 ring-4 ring-white' : ''}
                                   `} />
                              {/* Text Lines */}
                              <div className={`absolute space-y-1.5
                                      ${template === 'Modern' || template === 'Minimal' ? 'top-24 left-4 right-4 text-center items-center flex flex-col' : ''}
                                      ${template === 'Sleek' ? 'top-24 left-4 right-4' : ''}
                                      ${template === 'Professional' ? 'top-4 left-16 right-2' : ''}
                                      ${template === 'Creative' ? 'top-32 left-4 right-4 flex flex-col items-center gap-1.5' : ''}
                                   `}>
                                <div className={`h-2 rounded bg-slate-800 ${template === 'Creative' ? 'w-24' : 'w-3/4'}`} />
                                <div className={`h-1.5 rounded bg-slate-400 ${template === 'Creative' ? 'w-16' : 'w-1/2'}`} />
                              </div>
                            </div>

                            {formData.templateId === template.toLowerCase() && (
                              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center animate-in fade-in">
                                <div className="bg-white p-1.5 rounded-full text-primary shadow-sm"><CheckCircle2 className="w-6 h-6" /></div>
                              </div>
                            )}
                          </div>
                          <div className="text-center text-xs font-semibold text-slate-600">{template}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Accordion type="multiple" defaultValue={["profile"]} className="w-full space-y-3">

                    {/* Fixed Profile Information Section (Always at Top, Not Draggable) */}
                    <AccordionItem value="profile" className="bg-white border text-left border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-3xl mb-5 data-[state=open]:ring-2 data-[state=open]:ring-primary/10 transition-all group">
                      <div className="flex items-center w-full sticky top-[7.5rem] z-10 bg-white rounded-t-3xl">
                        <div className="pl-3 py-4">
                          {/* No drag handle - this section is fixed */}
                        </div>
                        <AccordionTrigger className="flex-1 py-5 pr-6 pl-2 hover:no-underline hover:bg-slate-50/50 data-[state=open]:bg-slate-50/50 transition-colors [&>svg]:hidden text-right">
                          <div className="flex items-center w-full justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <User className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-base w-[180px] truncate text-left text-slate-800">Profile Information</span>
                              {/* No toggle switch for profile section */}
                            </div>
                            <div className="flex items-center justify-end gap-3 shrink-0">
                              <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </div>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="bg-slate-50/30 border-t border-slate-100 p-6">
                        {getSectionContent('profile')}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Draggable Sections (Excluding Profile) */}
                    {validSectionOrder.length > 0 && (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <SortableContext items={validSectionOrder.filter(id => id !== 'profile')} strategy={verticalListSortingStrategy}>
                          {validSectionOrder.filter(id => id !== 'profile').map((sectionId) => {
                            const meta = {
                              profile: { label: "Profile Information", icon: User },
                              bio: { label: "About / Bio", icon: AlignLeft },
                              social: { label: "Social Links", icon: Globe },
                              video: { label: "Featured Video", icon: Video },
                              gallery: { label: "Gallery Images", icon: ImageIcon },
                            }[sectionId as keyof typeof meta];

                            if (meta) {
                              const Icon = meta.icon;
                              return (
                                <SortableSection key={sectionId} id={sectionId}>
                                  {({ listeners, attributes }) => (
                                    <AccordionItem value={sectionId} className="relative bg-white border text-left border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-3xl mb-5 data-[state=open]:ring-2 data-[state=open]:ring-primary/10 transition-all group hover:z-30">
                                      <div className="flex items-center w-full sticky top-[7.5rem] z-10 bg-white rounded-t-3xl">
                                        {sectionId !== 'profile' && (
                                          <div className="pl-3 py-4 text-slate-300 outline-none hover:text-primary cursor-grab active:cursor-grabbing transition-colors touch-none" {...listeners} {...attributes}>
                                            <GripVertical className="w-5 h-5" />
                                          </div>
                                        )}
                                        {sectionId === 'profile' && (
                                          <div className="pl-3 py-4">
                                            {/* Empty space to maintain alignment */}
                                          </div>
                                        )}
                                        <AccordionTrigger className="flex-1 py-5 pr-6 pl-2 hover:no-underline hover:bg-slate-50/50 data-[state=open]:bg-slate-50/50 transition-colors [&>svg]:hidden text-right">
                                          <div className="flex items-center w-full justify-between">
                                            <div className="flex items-center gap-3">
                                              <div className={`p-2 rounded-xl ${formData.visibleSections?.[sectionId] !== false ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                <Icon className="w-5 h-5" />
                                              </div>
                                              <span className={`font-bold text-base w-[180px] truncate text-left ${formData.visibleSections?.[sectionId] !== false ? 'text-slate-800' : 'text-slate-400'}`}>{meta.label}</span>
                                              <div onClick={(e) => e.stopPropagation()}>
                                                {sectionId !== 'profile' && (
                                                  <Switch
                                                    checked={formData.visibleSections?.[sectionId] !== false}
                                                    onCheckedChange={(checked) => {
                                                      setFormData(prev => ({
                                                        ...prev,
                                                        visibleSections: { ...prev.visibleSections, [sectionId]: checked }
                                                      }));
                                                    }}
                                                    className="data-[state=checked]:bg-primary"
                                                  />
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-3 shrink-0">
                                              <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                            </div>
                                          </div>
                                        </AccordionTrigger>
                                      </div>
                                      <AccordionContent className="bg-slate-50/30 border-t border-slate-100 p-6 pointer-events-auto">
                                        {getSectionContent(sectionId)}
                                      </AccordionContent>
                                    </AccordionItem>
                                  )}
                                </SortableSection>
                              );
                            }

                            const comp = formData.customComponents.find(c => c.id === sectionId);
                            if (comp) {
                              return (
                                <SortableSection key={comp.id} id={comp.id}>
                                  {({ listeners, attributes }) => (
                                    <AccordionItem value={comp.id} className="bg-white border text-left border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-3xl group mb-3 data-[state=open]:ring-2 data-[state=open]:ring-primary/10 transition-all">
                                      <div className="flex items-center w-full sticky top-[7.5rem] z-20 bg-white rounded-t-3xl">
                                        <div className="pl-3 py-4 text-slate-300 outline-none hover:text-primary cursor-grab active:cursor-grabbing transition-colors touch-none" {...listeners} {...attributes}>
                                          <GripVertical className="w-5 h-5" />
                                        </div>
                                        <AccordionTrigger className="flex-1 py-5 pr-6 pl-2 hover:no-underline hover:bg-slate-50/50 data-[state=open]:bg-slate-50/50 transition-colors [&>svg]:hidden text-right">
                                          <div className="flex items-center w-full justify-between">
                                            <div className="flex items-center gap-3">
                                              <div className="p-2 rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100 flex items-center justify-center">
                                                {comp.type === 'heading' && <Type className="w-5 h-5" />}
                                                {comp.type === 'text' && <AlignLeft className="w-5 h-5" />}
                                                {comp.type === 'button' && <MousePointerClick className="w-5 h-5" />}
                                              </div>
                                              <span className="font-bold text-base text-slate-800 capitalize text-left w-[180px] truncate">{comp.type}</span>
                                              <div onClick={(e) => e.stopPropagation()}>
                                                <Switch
                                                  checked={comp.active}
                                                  onCheckedChange={(checked) => {
                                                    const newComps = [...formData.customComponents];
                                                    const idx = newComps.findIndex(c => c.id === comp.id);
                                                    if (idx !== -1) {
                                                      newComps[idx].active = checked;
                                                      setFormData(prev => ({ ...prev, customComponents: newComps }));
                                                    }
                                                  }}
                                                  className="data-[state=checked]:bg-primary"
                                                />
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                              <Button
                                                variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                onClick={() => {
                                                  setFormData(prev => ({ ...prev, customComponents: prev.customComponents.filter(c => c.id !== comp.id) }));
                                                  setSectionOrder(prev => prev.filter(id => id !== comp.id));
                                                }}
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                              <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                            </div>
                                          </div>
                                        </AccordionTrigger>
                                      </div>
                                      <AccordionContent className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                                        {comp.type === 'heading' && (
                                          <div className="space-y-2">
                                            <Label>Heading Text</Label>
                                            <Input value={comp.title || ''} onChange={(e) => {
                                              const newComps = [...formData.customComponents];
                                              const idx = newComps.findIndex(c => c.id === comp.id);
                                              if (idx !== -1) {
                                                newComps[idx].title = e.target.value;
                                                setFormData(prev => ({ ...prev, customComponents: newComps }));
                                              }
                                            }} placeholder="Enter heading..." />
                                          </div>
                                        )}
                                        {comp.type === 'text' && (
                                          <div className="space-y-2">
                                            <Label>Text Content</Label>
                                            <Textarea value={comp.content || ''} onChange={(e) => {
                                              const newComps = [...formData.customComponents];
                                              const idx = newComps.findIndex(c => c.id === comp.id);
                                              if (idx !== -1) {
                                                newComps[idx].content = e.target.value;
                                                setFormData(prev => ({ ...prev, customComponents: newComps }));
                                              }
                                            }} placeholder="Enter text content..." />
                                          </div>
                                        )}
                                        {comp.type === 'button' && (
                                          <>
                                            <div className="space-y-2">
                                              <Label>Button Label</Label>
                                              <Input value={comp.title || ''} onChange={(e) => {
                                                const newComps = [...formData.customComponents];
                                                const idx = newComps.findIndex(c => c.id === comp.id);
                                                if (idx !== -1) {
                                                  newComps[idx].title = e.target.value;
                                                  setFormData(prev => ({ ...prev, customComponents: newComps }));
                                                }
                                              }} placeholder="Click Me" />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Button URL</Label>
                                              <Input value={comp.url || ''} onChange={(e) => {
                                                const newComps = [...formData.customComponents];
                                                const idx = newComps.findIndex(c => c.id === comp.id);
                                                if (idx !== -1) {
                                                  newComps[idx].url = e.target.value;
                                                  setFormData(prev => ({ ...prev, customComponents: newComps }));
                                                }
                                              }} placeholder="https://..." />
                                            </div>
                                          </>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>
                                  )}
                                </SortableSection>
                              );
                            }
                            return null;
                          })}
                        </SortableContext>
                      </DndContext>
                    )}
                  </Accordion>

                  {/* Add Component Button & Modal */}
                  <div className="pt-4">
                    <Dialog open={isAddComponentOpen} onOpenChange={setIsAddComponentOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full py-6 bg-transparent hover:bg-slate-50 text-slate-500 border-2 border-dashed border-slate-300 shadow-sm text-lg font-semibold rounded-xl transition-all active:scale-[0.99] group">
                          <Plus className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" /> Add Component
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">Add to your Card</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
                          {[
                            { id: 'heading', label: 'Heading', icon: Type, desc: 'Add a section title' },
                            { id: 'text', label: 'Text Block', icon: AlignLeft, desc: 'Add a paragraph of text' },
                            { id: 'button', label: 'Custom Button', icon: MousePointerClick, desc: 'Add a link button' },
                          ].map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                const newId = `${item.id}_${Date.now()}`;
                                setFormData(prev => ({
                                  ...prev,
                                  customComponents: [
                                    ...prev.customComponents,
                                    { id: newId, type: item.id as any, active: true, title: '', content: '' }
                                  ]
                                }));
                                setSectionOrder(prev => [...prev, newId]);
                                setIsAddComponentOpen(false);
                              }}
                              className="flex flex-col items-center justify-center p-6 border rounded-xl hover:border-primary hover:bg-primary/10 cursor-pointer transition-all group text-center space-y-3"
                            >
                              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-600 group-hover:text-primary transition-colors">
                                <item.icon className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{item.label}</div>
                                <div className="text-xs text-slate-500">{item.desc}</div>
                              </div>
                            </div>
                          ))}

                          {/* Disabled "Coming Soon" styling for existing ones just to mock the full library */}
                          <div className="flex flex-col items-center justify-center p-6 border rounded-xl opacity-50 cursor-not-allowed text-center space-y-3 grayscale">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><ImageIcon className="w-6 h-6" /></div>
                            <div><div className="font-semibold text-slate-800">Images</div><div className="text-xs text-slate-500">Already Added</div></div>
                          </div>
                          <div className="flex flex-col items-center justify-center p-6 border rounded-xl opacity-50 cursor-not-allowed text-center space-y-3 grayscale">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><LinkIcon className="w-6 h-6" /></div>
                            <div><div className="font-semibold text-slate-800">Links</div><div className="text-xs text-slate-500">Already Added</div></div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TabsContent>

                {/* --- DESIGN TAB --- */}
                <TabsContent value="design" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-32">



                  {/* Design Settings Accordion */}
                  <Accordion type="single" collapsible defaultValue="colors" className="w-full space-y-3">

                    {/* 2. Background Image / Video */}
                    <AccordionItem value="background" className="bg-white border text-left border-slate-200 shadow-sm rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 data-[state=open]:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><ImageIcon className="w-4 h-4" /></div>
                          <span className="font-semibold text-slate-700">Background Image / Video</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 bg-slate-50/50 border-t border-slate-100 relative group">
                        {(!isPremium && !teamSettings) && (
                          <div
                            className="absolute inset-0 z-30 bg-white/20 backdrop-blur-[2px] cursor-pointer flex flex-col items-center justify-center transition-all hover:bg-white/30"
                            onClick={() => setShowModal(true)}
                          >
                            <div className="bg-white/90 shadow-2xl border border-amber-100 px-6 py-4 rounded-2xl flex flex-col items-center gap-3 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                <Lock className="w-6 h-6" />
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-slate-800">Premium Backgrounds</div>
                                <p className="text-[11px] text-slate-500 max-w-[180px] mt-1">Upgrade to Plus to use custom images, gradients, and videos.</p>
                              </div>
                              <Button size="sm" className="h-8 text-[10px] font-bold bg-amber-600 hover:bg-amber-700">UPGRADE NOW</Button>
                            </div>
                          </div>
                        )}

                        <div className={(!isPremium && !teamSettings) ? 'opacity-40 grayscale-[0.5] pointer-events-none' : ''}>
                          <Tabs defaultValue="image" className="w-full">
                            <TabsList className="w-full grid grid-cols-2 mb-4 bg-slate-200/50">
                              <TabsTrigger value="image">Image</TabsTrigger>
                              <TabsTrigger value="video">Video</TabsTrigger>
                            </TabsList>
                            <TabsContent value="image" className="space-y-4">
                              <div className="grid grid-cols-4 gap-3">
                                <div className="aspect-[9/16] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary/60 hover:bg-primary/10 cursor-pointer transition-all" onClick={() => (isPremium || teamSettings) ? document.getElementById('card-bg-upload')?.click() : setShowModal(true)}>
                                  <Upload className="w-5 h-5 mb-1" />
                                  <span className="text-[10px] font-semibold uppercase">Upload</span>
                                  <input
                                    id="card-bg-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(file, 'card-bg');
                                    }}
                                  />
                                </div>
                                <div onClick={() => setFormData(prev => ({ ...prev, cardStyle: { ...prev.cardStyle, backgroundImage: '' } }))} className="aspect-[9/16] rounded-lg border border-slate-200 bg-white flex flex-col items-center justify-center text-red-500 hover:bg-red-50 cursor-pointer transition-all">
                                  <X className="w-6 h-6" />
                                  <span className="text-[10px] font-semibold mt-1">Clear</span>
                                </div>
                                {/* Presets */}
                                {[
                                  'bg-gradient-to-br from-blue-500 to-purple-600',
                                  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80',
                                  'bg-gradient-to-tr from-emerald-400 to-cyan-500',
                                  'bg-slate-900',
                                  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
                                  'bg-orange-500',
                                ].map((bg, i) => (
                                  <div
                                    key={i}
                                    className={`aspect-[9/16] rounded-lg shadow-sm cursor-pointer border-2 hover:border-primary transition-all bg-cover bg-center ${bg.startsWith('http') ? '' : bg} ${bg.startsWith('bg-slate') ? 'border-white/20' : ''}`}
                                    style={bg.startsWith('http') ? { backgroundImage: `url(${bg})` } : undefined}
                                    onClick={() => setFormData(prev => ({ ...prev, cardStyle: { ...prev.cardStyle, backgroundImage: bg } }))}
                                  />
                                ))}
                              </div>
                            </TabsContent>
                            <TabsContent value="video" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                                  <Video className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                  <h3 className="font-bold text-slate-800 text-lg">Coming Soon</h3>
                                  <p className="text-sm text-slate-500 max-w-[200px]">Video backgrounds will be available in the next update.</p>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* 3. Colors */}
                    <AccordionItem value="colors" className="bg-white border text-left border-slate-200 shadow-sm rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 data-[state=open]:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center"><Palette className="w-4 h-4" /></div>
                          <span className="font-semibold text-slate-700">Colors</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6">

                        {/* Color Palette Presets */}
                        <div className={`space-y-3 relative ${teamSettings && !teamSettings.isTeamAdmin ? 'opacity-70' : ''}`}>
                          <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                            Color Palette
                            {teamSettings && !teamSettings.isTeamAdmin && <Lock className="w-3 h-3" />}
                          </Label>
                          {teamSettings && !teamSettings.isTeamAdmin && (
                            <div className="absolute inset-0 z-10 cursor-not-allowed" onClick={() => toast({ title: "Locked", description: "Branding is team-managed." })} />
                          )}
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {themes.slice(0, 12).map((theme, index) => {
                              const isLocked = index >= 3 && !isPremium && !teamSettings;
                              return (
                                <div
                                  key={theme.id}
                                  onClick={() => {
                                    if (isLocked) {
                                      setShowModal(true);
                                      return;
                                    }
                                    if (teamSettings && !teamSettings.isTeamAdmin) return;
                                    setFormData(prev => ({
                                      ...prev,
                                      themeId: theme.id,
                                      themeColor: theme.colors.primary,
                                      customColors: {
                                        primary: theme.colors.primary,
                                        secondary: theme.colors.secondary,
                                        background: theme.colors.cardBackground || '#ffffff',
                                        text: theme.colors.text || '#000000'
                                      }
                                    }))
                                  }}
                                  className={`
                                            w-full aspect-square rounded-full cursor-pointer shadow-sm border-2 transition-all relative overflow-hidden group
                                            ${formData.themeId === theme.id ? 'border-primary ring-2 ring-primary/20 ring-offset-1' : 'border-white hover:scale-110'}
                                            ${isLocked ? 'opacity-90' : ''}
                                         `}
                                  style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 50%, ${theme.colors.secondary} 50%)` }}
                                >
                                  {formData.themeId === theme.id && !isLocked && <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white"><CheckCircle2 className="w-4 h-4" /></div>}
                                  {isLocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 text-white backdrop-blur-[1px]">
                                      <Lock className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Colors */}
                        <div className="space-y-3 pt-4 border-t border-dashed border-slate-200 relative group">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Custom Colors</Label>
                            {(!isPremium && !teamSettings) && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5 fill-amber-600" /> PLUS
                              </span>
                            )}
                          </div>

                          {(!isPremium && !teamSettings) && (
                            <div
                              className="absolute inset-0 -top-2 -bottom-2 -left-2 -right-2 z-20 bg-white/10 backdrop-blur-[1px] cursor-pointer group-hover:bg-white/20 transition-all rounded-xl border border-transparent group-hover:border-amber-200/50 flex items-center justify-center"
                              onClick={() => setShowModal(true)}
                            >
                              <div className="bg-white/90 shadow-xl border border-amber-100 px-4 py-2 rounded-full flex items-center gap-2 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-xs font-bold text-amber-900">Unlock Custom Colors with Plus</span>
                              </div>
                            </div>
                          )}

                          <div className={`grid sm:grid-cols-2 gap-4 ${(!isPremium && !teamSettings) ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                            {[
                              { label: 'Primary Color', key: 'primary', value: formData.customColors?.primary || formData.themeColor },
                              { label: 'Secondary Color', key: 'secondary', value: formData.customColors?.secondary || '#ffffff' },
                              { label: 'Background Color', key: 'background', value: formData.customColors?.background || '#f8fafc' },
                              { label: 'Text Color', key: 'text', value: formData.customColors?.text || '#1e293b' },
                            ].map((color, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border shadow-sm">
                                <div className="w-10 h-10 rounded-full border shadow-inner flex shrink-0 overflow-hidden relative">
                                  <input
                                    type="color"
                                    className="absolute -top-2 -left-2 w-16 h-16 cursor-disabled opacity-0"
                                    value={color.value}
                                    disabled={(!isPremium && !teamSettings) || (teamSettings && !teamSettings.isTeamAdmin)}
                                    onChange={(e) => {
                                      const key = color.key as keyof typeof formData.customColors;
                                      setFormData(prev => ({
                                        ...prev,
                                        themeColor: key === 'primary' ? e.target.value : prev.themeColor,
                                        customColors: { ...prev.customColors, [key]: e.target.value }
                                      }));
                                    }}
                                  />
                                  <div className="w-full h-full" style={{ backgroundColor: color.value || '#000' }} />
                                  {(teamSettings && !teamSettings.isTeamAdmin) && (
                                    <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center cursor-not-allowed">
                                      <Lock className="w-4 h-4 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-slate-500">{color.label}</div>
                                  <div className="text-sm font-semibold text-slate-700 font-mono">{color.value}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* 4. Font Style */}
                    <AccordionItem value="fonts" className="bg-white border text-left border-slate-200 shadow-sm rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 data-[state=open]:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><Type className="w-4 h-4" /></div>
                          <span className="font-semibold text-slate-700">Font Style</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 bg-slate-50/50 border-t border-slate-100">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {['Inter', 'Roboto', 'Playfair Display', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Oswald', 'Raleway', 'Merriweather'].map((font) => {
                            const isFree = font === 'Inter' || font === 'Roboto';
                            const isLocked = !isFree && !isPremium && !teamSettings;

                            return (
                              <div
                                key={font}
                                onClick={() => {
                                  if (isLocked) {
                                    setShowModal(true);
                                    return;
                                  }
                                  setFormData(prev => ({ ...prev, font }));
                                }}
                                className={`
                                  h-16 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                                  ${formData.font === font ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 hover:border-orange-200 hover:bg-slate-50 text-slate-600'}
                                  ${isLocked ? 'grayscale-[0.5] opacity-70' : ''}
                                `}
                              >
                                <span className="text-xl" style={{ fontFamily: font }}>Aa</span>
                                <span className="text-[10px] absolute bottom-1.5 opacity-60 group-hover:opacity-100 transition-opacity">{font}</span>

                                {isLocked && (
                                  <div className="absolute top-1 right-1">
                                    <Lock className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* 5. Card Style */}
                    <AccordionItem value="cardStyle" className="bg-white border text-left border-slate-200 shadow-sm rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 data-[state=open]:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center"><CreditCard className="w-4 h-4" /></div>
                          <span className="font-semibold text-slate-700">Card Style</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6">

                        {/* Background Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                          <Label className="text-sm font-semibold text-slate-700">Card Background</Label>
                          <Switch
                            checked={formData.cardStyle?.background !== false}
                            onCheckedChange={(c) => setFormData(prev => ({ ...prev, cardStyle: { ...prev.cardStyle, background: c } }))}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-xs font-bold uppercase text-slate-500">Corners</Label>
                              <span className="text-xs text-slate-400">{formData.cardStyle?.borderRadius || 16}px</span>
                            </div>
                            <input
                              type="range" min="0" max="32"
                              value={formData.cardStyle?.borderRadius || 16}
                              onChange={(e) => setFormData(prev => ({ ...prev, cardStyle: { ...prev.cardStyle, borderRadius: parseInt(e.target.value) } }))}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2 pt-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Drop Shadow</Label>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                              <Label className="text-sm font-semibold text-slate-700">Enable Shadow</Label>
                              <Switch
                                checked={formData.cardStyle?.shadow !== false}
                                onCheckedChange={(c) => setFormData(prev => ({ ...prev, cardStyle: { ...prev.cardStyle, shadow: c } }))}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* 7. Page Loader */}
                    <AccordionItem value="loader" className="bg-white border text-left border-slate-200 shadow-sm rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 data-[state=open]:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center"><Loader2 className="w-4 h-4" /></div>
                          <span className="font-semibold text-slate-700">Page Loader</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 bg-slate-50/50 border-t border-slate-100">
                        <div className="space-y-4">
                          <Label className="text-xs uppercase text-slate-400 font-bold tracking-wider">Animation Style</Label>
                          <div className="grid grid-cols-4 gap-4">
                            {[
                              { id: 'default' as const, icon: Loader2, animate: 'animate-spin', label: 'Spinner' },
                              { id: 'pulse' as const, icon: Circle, animate: 'animate-pulse', label: 'Pulse' },
                              { id: 'bounce' as const, icon: ArrowUpCircle, animate: 'animate-bounce', label: 'Bounce' },
                              { id: 'none' as const, icon: X, animate: '', label: 'None' },
                            ].map((loader) => (
                              <div
                                key={loader.id}
                                onClick={() => setFormData((prev: any) => ({
                                  ...prev,
                                  pageLoader: {
                                    ...prev.pageLoader,
                                    animation: loader.id as 'default' | 'pulse' | 'bounce' | 'none',
                                    // If Premium and no logo selected, default to brand
                                    logoType: (isPremium || (teamSettings && teamSettings.isTeamAdmin)) && prev.pageLoader.logoType === 'none' ? 'brand' : prev.pageLoader.logoType
                                  }
                                }))}
                                className={`aspect-square rounded-lg border shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all ${formData.pageLoader?.animation === loader.id
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-primary/60 hover:text-primary'
                                  }`}
                              >
                                <loader.icon className={`w-6 h-6 mb-1 ${loader.animate}`} />
                                <span className="text-[10px] font-medium">{loader.label}</span>
                              </div>
                            ))}
                          </div>

                          <Label className="text-xs uppercase text-slate-400 font-bold tracking-wider pt-2 block">Brand & Logo</Label>
                          <div className="grid grid-cols-2 gap-4">

                            {/* Brand Loader */}
                            <div
                              onClick={() => {
                                if (isPremium || (teamSettings && teamSettings.isTeamAdmin)) {
                                  setFormData(prev => ({ ...prev, pageLoader: { ...prev.pageLoader, logoType: 'brand' } }));
                                } else {
                                  setShowModal(true);
                                }
                              }}
                              className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${formData.pageLoader?.logoType === 'brand' ? 'border-primary bg-primary/10' : 'bg-white border-slate-100 hover:border-blue-300 hover:bg-slate-50'
                                }`}
                            >
                              <img src={logo} alt="Simplify Tap" className="h-8 w-auto object-contain mb-2" />
                              <span className="text-xs font-semibold text-slate-600">Simplify Tap</span>

                              {/* Lock Overlay for Free Users */}
                              {(!isPremium && !teamSettings) && (
                                <div className="absolute inset-0 bg-slate-900/60 z-20 flex flex-col items-center justify-center backdrop-blur-[1px] text-white">
                                  <Lock className="w-5 h-5 mb-1" />
                                  <span className="text-[10px] font-medium">Premium</span>
                                </div>
                              )}
                            </div>

                            {/* Custom Loader Upload */}
                            <div
                              className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-all ${formData.pageLoader?.logoType === 'custom' ? 'border-primary bg-primary/10/50' : 'border-slate-300 bg-slate-50 hover:border-primary/60 hover:bg-primary/10'
                                }`}
                              onClick={() => {
                                if (!isPremium && !teamSettings) {
                                  setShowModal(true);
                                } else {
                                  document.getElementById('loader-upload')?.click();
                                }
                              }}
                            >
                              {/* Content based on state */}
                              {formData.pageLoader?.customUrl && formData.pageLoader?.logoType === 'custom' ? (
                                <img src={formData.pageLoader.customUrl} alt="Custom Loader" className="h-10 w-auto object-contain mb-2" />
                              ) : (
                                <Upload className="w-6 h-6 text-slate-400 mb-2 group-hover:text-primary transition-colors" />
                              )}

                              <span className="text-xs font-medium text-slate-600">Custom Logo</span>

                              <input
                                id="loader-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'loader_image');
                                }}
                              />

                              {/* Lock Overlay for Free Users */}
                              {(!isPremium && !teamSettings) && (
                                <div className="absolute inset-0 bg-slate-900/60 z-20 flex flex-col items-center justify-center backdrop-blur-[1px] text-white">
                                  <Lock className="w-5 h-5 mb-1" />
                                  <span className="text-[10px] font-medium">Premium</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3 text-xs text-slate-500 border border-slate-100">
                            <div className="p-1.5 bg-white rounded shadow-sm"><Loader2 className="w-3 h-3 animate-spin" /></div>
                            <span>Loaders appear for 1-2 seconds when your card is first opened.</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                  </Accordion>
                </TabsContent>



              </Tabs>
            </div>

            {/* RIGHT COLUMN: Sticky Preview */}
            <div className="hidden lg:block lg:col-span-5 relative">
              <div className="lg:sticky lg:top-24 lg:pt-4 lg:pl-8">
                <div className="relative mx-auto w-[360px] h-[720px] bg-[#1a1a1a] rounded-[3.5rem] shadow-2xl p-4 ring-8 ring-slate-900/5 border-4 border-slate-600/50">
                  {/* Phone Buttons */}
                  <div className="absolute top-24 -right-1.5 w-1.5 h-16 bg-slate-700/80 rounded-r-md"></div>
                  <div className="absolute top-24 -left-1.5 w-1.5 h-8 bg-slate-700/80 rounded-l-md"></div>
                  <div className="absolute top-36 -left-1.5 w-1.5 h-16 bg-slate-700/80 rounded-l-md"></div>

                  {/* Screen */}
                  <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[#1a1a1a] rounded-b-2xl z-50 flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800/80 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-slate-800/80 rounded-full"></div>
                    </div>

                    <DigitalCard
                      userData={{
                        ...formData,
                        pageLoader: {
                          ...formData.pageLoader,
                          animation: formData.pageLoader.animation as 'default' | 'pulse' | 'bounce' | 'none',
                          logoType: formData.pageLoader.logoType as 'brand' | 'custom' | 'none'
                        },
                        socialLinks: [
                          ...formData.socialLinks,
                          ...(formData.featuredVideo ? [{ platform: 'featured_video', url: formData.featuredVideo }] : [])
                        ],
                        sectionOrder: validSectionOrder,
                        customColors: formData.customColors
                      }}
                      showBranding={formData.showBranding}
                      premium={isPremium || !!teamSettings}
                      previewMode={true}
                      isTeam={!!teamSettings}
                    />


                  </div>
                </div>

                <div className="text-center mt-8 space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border text-xs font-semibold text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Live Preview
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div >
      </main >

      <PremiumModal open={showModal} onOpenChange={setShowModal} />




      {/* Mobile Bottom Action Bar */}
      {/* Mobile Bottom Action Bar */}
      <div className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl p-3 lg:hidden z-50 flex items-center gap-3 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-black/5 overflow-hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="flex-1 py-6 rounded-2xl hover:bg-slate-50 text-slate-600 font-semibold">
              <Smartphone className="w-5 h-5 mr-2" /> Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="!fixed !inset-0 !left-0 !top-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !p-0 !m-0 !border-none !rounded-none !bg-white !shadow-none md:!left-[50%] md:!top-[50%] md:!translate-x-[-50%] md:!translate-y-[-50%] md:!max-w-md md:!w-auto md:!h-[90vh] md:!rounded-3xl md:!inset-auto !overflow-hidden">
            <div className="w-full h-full relative isolate overflow-y-auto overflow-x-hidden bg-white">
              <DialogClose className="absolute top-4 right-4 z-[70] bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-all">
                <X className="w-6 h-6" />
              </DialogClose>
              <DigitalCard
                userData={{
                  ...formData,
                  pageLoader: {
                    ...formData.pageLoader,
                    animation: formData.pageLoader.animation as 'default' | 'pulse' | 'bounce' | 'none',
                    logoType: formData.pageLoader.logoType as 'brand' | 'custom' | 'none'
                  },
                  socialLinks: [
                    ...formData.socialLinks,
                    ...(formData.featuredVideo ? [{ platform: 'featured_video', url: formData.featuredVideo }] : [])
                  ],
                  sectionOrder: validSectionOrder,
                  customColors: formData.customColors
                }}
                showBranding={formData.showBranding}
                premium={isPremium || !!teamSettings}
                previewMode={true}
                isTeam={!!teamSettings}
              />
            </div>
          </DialogContent>
        </Dialog>
        <Button onClick={handleSave} disabled={isSaving} className="flex-[2] py-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 text-lg font-semibold rounded-2xl">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

    </div >
  );
};

// Icon helper

export default Profile;

