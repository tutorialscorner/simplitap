import React, { useState } from "react";
import { Mail, Phone, Globe, Linkedin, Twitter, MapPin, Instagram, Facebook, Share2, Save, Youtube, Github, Loader2, Circle, ArrowUpCircle, X, QrCode, Plus } from "lucide-react";
import { themes } from "@/lib/themes";
import logo from "@/assets/simplify-tap-logo.png";


interface UserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  mapLink?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  logoUrl?: string;
  bannerUrl?: string;
  themeColor?: string;
  themeId?: string;
  bio?: string;
  companyLogoUrl?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
    active?: boolean;
    order?: number;
    label?: string;
  }>;
  // New Design Props
  templateId?: string;
  font?: string;
  cardStyle?: {
    borderRadius?: number;
    shadow?: boolean;
    background?: boolean;
    backgroundImage?: string;
  };
  customComponents?: Array<{
    id: string;
    type: 'heading' | 'text' | 'button';
    title?: string;
    content?: string;
    url?: string;
    active: boolean;
  }>;
  customColors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  sectionOrder?: string[];
  pageLoader?: {
    type?: string; // Legacy support
    animation?: 'default' | 'pulse' | 'bounce' | 'none';
    logoType?: 'brand' | 'custom' | 'none';
    customUrl?: string;
  };
  visibleSections?: Record<string, boolean>;
}

interface DigitalCardProps {
  showBranding?: boolean;
  premium?: boolean;
  userData?: UserData;
  previewMode?: boolean;
  onLinkClick?: (type: string) => void;
  isTeam?: boolean;
  onSaveContact?: () => void;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37055 0 0 5.37055 0 12C0 18.6295 5.37055 24 12 24C18.6295 24 24 18.6295 24 12C24 5.37055 18.6295 0 12 0ZM17.9734 8.71887C17.7533 10.963 16.634 16.4862 16.0963 19.3448C15.8675 20.5517 15.4191 20.9479 14.9961 20.9858C14.0759 21.0691 13.3768 20.3701 12.4851 19.7924C11.0894 18.8878 10.3013 18.3308 8.94709 17.447C7.38153 16.4258 8.39706 15.8631 9.29084 14.9431C9.52462 14.7025 13.5855 11.0543 13.6644 10.7225C13.6738 10.6806 13.6826 10.6277 13.6558 10.5802C13.6288 10.5332 13.562 10.5176 13.5303 10.5103C13.4847 10.5002 12.7663 10.9702 11.3742 11.9029C9.3242 13.2982 7.25197 14.5492 7.25197 14.5492C5.97931 14.9452 4.88876 14.9084 3.99602 14.6555C2.89679 14.3439 2.05374 14.1203 2.05374 14.1203C1.22941 13.8443 2.15545 13.3957 2.15545 13.3957C4.64016 12.2227 10.2319 9.8973 14.7176 8.04603C16.4252 7.35414 18.1738 7.03606 17.9734 8.71887Z" /></svg>
);

const PLATFORM_ICONS: Record<string, any> = {
  linkedin: { icon: Linkedin, color: "#0077b5" },
  twitter: { icon: Twitter, color: "#000000" },
  instagram: { icon: Instagram, color: "#bc1888", gradient: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]" },
  facebook: { icon: Facebook, color: "#1877f2" },
  youtube: { icon: Youtube, color: "#ff0000" },
  github: { icon: Github, color: "#333333" },
  whatsapp: { icon: WhatsAppIcon, color: "#25D366" },
  telegram: { icon: TelegramIcon, color: "#0088cc" },
  website: { icon: Globe, color: "#2563eb" },
  // Add fallback or generic
  default: { icon: Globe, color: "#333333" }
};

const getContrastColor = (hex?: string) => {
  if (!hex) return "#ffffff";
  try {
    const color = hex.startsWith("#") ? hex.replace("#", "") : hex;
    if (color.length < 6) return "#ffffff";
    const r = parseInt(color.substring(0, 2), 16) || 0;
    const g = parseInt(color.substring(2, 4), 16) || 0;
    const b = parseInt(color.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq > 149 ? "#111827" : "#ffffff";
  } catch (e) {
    return "#ffffff";
  }
};

export const DigitalCard = ({
  showBranding = true,
  premium = false,
  userData,
  previewMode = false,
  onLinkClick,
  isTeam = false,
  onSaveContact,
}: DigitalCardProps) => {
  const [showQr, setShowQr] = useState(false);

  const firstName = userData?.firstName || "";
  const lastName = userData?.lastName || "";
  const title = userData?.title || "Product Designer";
  const company = userData?.company || "TechCorp Inc.";
  const bio = userData?.bio || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`;

  // Active status checks
  const isPhoneActive = Boolean(userData?.phone);
  const isEmailActive = Boolean(userData?.email);
  const isWebActive = Boolean(userData?.website);
  const isMapActive = Boolean(userData?.mapLink);

  let socialLinks = userData?.socialLinks || [];

  // Backward compatibility: If no socialLinks array, construct from legacy fields
  if (socialLinks.length === 0 && userData) {
    if (userData.linkedin) socialLinks.push({ platform: 'linkedin', url: userData.linkedin, active: true });
    if (userData.twitter) socialLinks.push({ platform: 'twitter', url: userData.twitter, active: true });
    if (userData.instagram) socialLinks.push({ platform: 'instagram', url: userData.instagram, active: true });
    if (userData.facebook) socialLinks.push({ platform: 'facebook', url: userData.facebook, active: true });
  }

  // Helper to ensure URL has protocol and smart format for messaging apps
  const getUrl = (url?: string, platform?: string) => {
    if (!url) return "#";

    // Smart formatting
    if (platform === 'whatsapp') {
      // Remove any non-numeric chars for default standard format if it looks like a number
      const cleanNum = url.replace(/\D/g, '');
      // If user pasted a full link, use it
      if (url.includes('wa.me') || url.includes('whatsapp.com')) return url.startsWith('http') ? url : `https://${url}`;
      // formatting just number
      return `https://wa.me/${cleanNum}`;
    }

    if (platform === 'telegram') {
      if (url.includes('t.me') || url.includes('telegram.me')) return url.startsWith('http') ? url : `https://${url}`;
      // Assume username
      return `https://t.me/${url.replace('@', '')}`;
    }

    // Default protocol check
    return url.startsWith("http") ? url : `https://${url}`;
  };

  // Video Helper
  const featuredVideoLink = socialLinks.find(l => l.platform === 'featured_video');
  const featuredVideoUrl = featuredVideoLink?.url;

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleDownloadVCard = async () => {
    if (previewMode) return;

    if (onSaveContact) {
      onSaveContact();
      return;
    }

    const { downloadVCard: vCardUtil } = await import("@/lib/vcard");
    await vCardUtil({
      firstName,
      lastName,
      title,
      company,
      email: userData?.email,
      phone: userData?.phone,
      website: userData?.website,
      logoUrl: userData?.logoUrl,
      socialLinks: socialLinks
    });

    onLinkClick?.('Save Contact');
  };

  // --- Styles ---

  // Theme Logic with Custom Color Overrides
  const baseTheme = themes.find(t => t.id === userData?.themeId) || themes[0];
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...(userData?.customColors?.primary ? { primary: userData.customColors.primary } : {}),
      ...(userData?.customColors?.secondary ? { secondary: userData.customColors.secondary } : {}),
      ...(userData?.customColors?.background ? { cardBackground: userData.customColors.background } : {}),
      ...(userData?.customColors?.text ? { text: userData.customColors.text } : {}),
    }
  };

  const primaryColor = theme.colors.primary;

  // Save Button Theme Contrast Logic
  const saveButtonTextColor = getContrastColor(primaryColor);

  const cardLink = userData?.username
    ? `${window.location.origin}/card/${userData.username}`
    : window.location.href;

  // Font Family
  const fontFamily = userData?.font || 'Inter';

  // Card Background Logic
  const cardBgVal = userData?.cardStyle?.backgroundImage || "";
  const isCardBgUrl = cardBgVal.match(/^(https?:\/\/|data:|blob:|\/)/);

  // Card Container Style
  const shouldUseClassBg = cardBgVal && !isCardBgUrl;

  const cardStyle: React.CSSProperties = {
    backgroundColor: userData?.cardStyle?.background === false ? 'transparent' : (shouldUseClassBg ? undefined : (theme.colors.cardBackground || '#ffffff')),
    backgroundImage: isCardBgUrl ? `url(${cardBgVal})` : undefined,
    backgroundSize: isCardBgUrl ? 'cover' : undefined,
    backgroundPosition: isCardBgUrl ? 'center' : undefined,
    fontFamily: fontFamily,
    borderRadius: userData?.cardStyle?.borderRadius !== undefined ? `${userData.cardStyle.borderRadius}px` : '0px',
    boxShadow: userData?.cardStyle?.shadow === true ? '0 10px 30px -5px rgba(0,0,0,0.1)' : 'none',
  };

  const cardBgClass = !isCardBgUrl ? cardBgVal : ""; // If it's a tailwind class

  // Banner Style
  const bannerVal = userData?.bannerUrl || "";
  const isBannerUrl = bannerVal.match(/^(https?:\/\/|data:|blob:|\/)/);

  const bannerStyle: React.CSSProperties = {
    backgroundColor: !bannerVal ? theme.colors.primary : undefined,
    backgroundImage: isBannerUrl ? `url(${bannerVal})` : undefined,
  };

  const bannerClass = !isBannerUrl ? bannerVal : "bg-cover bg-center bg-no-repeat";

  // Text Styles
  const textStyle: React.CSSProperties = { fontFamily, color: theme.colors.text };
  const mutedTextStyle = { color: theme.colors.secondary };
  const accentTextStyle = { color: theme.colors.accent };



  // Banner Style



  // Page Loader Logic
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Always simulate load on mount or when loader settings change to preview it
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [userData?.pageLoader]); // Re-run when loader settings change

  return (
    <>
      {/* Page Loader Overlay */}
      {isLoading && userData?.pageLoader && userData.pageLoader.animation !== 'none' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 gap-6" style={{ backgroundColor: theme.colors.cardBackground }}>

          {/* Logo Section */}
          {userData.pageLoader.logoType === 'brand' && (
            <img src={logo} alt="Simplify Tap" className="h-12 w-auto object-contain animate-pulse" />
          )}
          {userData.pageLoader.logoType === 'custom' && userData.pageLoader.customUrl && (
            <img src={userData.pageLoader.customUrl} className="h-16 w-auto object-contain animate-pulse" alt="Logo" />
          )}

          {/* Animation Section */}
          {(userData.pageLoader.animation === 'default' || !userData.pageLoader.animation) && <Loader2 className="w-8 h-8 animate-spin text-blue-600" style={{ color: primaryColor }} />}

          {userData.pageLoader.animation === 'pulse' && (
            <div className="w-4 h-4 rounded-full animate-ping text-blue-600" style={{ backgroundColor: primaryColor }} />
          )}

          {userData.pageLoader.animation === 'bounce' && (
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full animate-bounce bg-blue-600" style={{ backgroundColor: primaryColor, animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full animate-bounce bg-blue-600" style={{ backgroundColor: primaryColor, animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full animate-bounce bg-blue-600" style={{ backgroundColor: primaryColor, animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      )}

      <div
        className={`w-full h-full overflow-hidden flex flex-col relative font-sans transition-all duration-300 ${cardBgClass}`}
        style={cardStyle}
      >
        {/* Decorative top pattern/sheen */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />

        {/* Scrollable Content Container */}
        <div className="w-full h-full overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* --- DYNAMIC TEMPLATE RENDERING --- */}

          {/* Template: MODERN (Default) */}
          {(!userData?.templateId || userData.templateId === 'modern') && (
            <>
              <div
                className={`h-32 relative shrink-0 ${bannerClass}`}
                style={bannerStyle}
              >
                {!userData?.bannerUrl && !theme.backgroundImage && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                )}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0)] bg-[length:12px_12px]" />
                {/* Company Logo Top Right */}
                {premium && userData?.companyLogoUrl && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl p-1 shadow-sm border border-white/30 overflow-hidden">
                      <img src={userData.companyLogoUrl} alt="Company Logo" className="w-full h-full object-contain rounded-lg" />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 -mt-14 relative z-20 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full p-1 shadow-2xl ring-2 ring-white/20" style={{ backgroundColor: theme.colors.cardBackground }}>
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-2" style={{ borderColor: theme.colors.border }}>
                    {userData?.logoUrl ? <img src={userData.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-2xl" style={{ color: theme.colors.primary }}>{initials}</div>}
                  </div>
                </div>
                <div className="text-center mt-2.5 w-full space-y-1">
                  <h2 className="text-xl font-bold tracking-tight leading-tight" style={textStyle}>{fullName}</h2>
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    {title && <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm border border-transparent" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary, borderColor: `${theme.colors.primary}10` }}>{title}</span>}
                    <div className="flex items-center gap-1 opacity-80"><span className="text-xs font-medium" style={mutedTextStyle}>{company && `at ${company}`}</span></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Template: SLEEK (Left aligned, Banner) */}
          {userData?.templateId === 'sleek' && (
            <>
              <div className={`h-28 relative shrink-0 ${bannerClass}`} style={bannerStyle}>
                {/* Company Logo Top Left */}
                {premium && userData?.companyLogoUrl && (
                  <div className="absolute top-4 left-4 z-20">
                    <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full overflow-hidden shadow-sm">
                      <img src={userData.companyLogoUrl} className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 -mt-10 relative z-20 flex flex-row items-end gap-3 mb-4">
                <div className="w-24 h-24 rounded-full shadow-lg ring-4 ring-white overflow-hidden shrink-0 bg-white">
                  {userData?.logoUrl ? <img src={userData.logoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-2xl" style={{ color: theme.colors.primary }}>{initials}</div>}
                </div>
                <div className="pb-1 text-left min-w-0 flex-1">
                  <h2 className="text-lg font-bold tracking-tight leading-tight truncate" style={textStyle}>{fullName}</h2>
                  {title && <div className="text-xs font-medium opacity-80 truncate" style={{ color: theme.colors.primary }}>{title}</div>}
                </div>
              </div>
              <div className="px-6 text-left w-full mb-2">
                <div className="text-xs font-medium opacity-70" style={mutedTextStyle}>{company}</div>
              </div>
            </>
          )}

          {/* Template: MINIMAL (No Banner, Clean, Centered) */}
          {(userData?.templateId === 'minimal' || userData?.templateId === 'elegant') && (
            <div className="pt-12 px-6 flex flex-col items-center relative">
              {/* Decorative Circle */}
              <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />

              {premium && userData?.companyLogoUrl && (
                <div className="absolute top-6 left-6">
                  <img src={userData.companyLogoUrl} className="h-8 w-auto object-contain opacity-80" />
                </div>
              )}

              <div className="w-28 h-28 rounded-full shadow-2xl overflow-hidden mb-6 z-10 border-4 border-white">
                {userData?.logoUrl ? <img src={userData.logoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-3xl bg-slate-100" style={{ color: theme.colors.primary }}>{initials}</div>}
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-1" style={textStyle}>{fullName}</h2>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-8 bg-slate-300" />
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: theme.colors.primary }}>{title}</span>
                <div className="h-px w-8 bg-slate-300" />
              </div>
              <div className="text-sm font-medium opacity-60" style={mutedTextStyle}>{company}</div>
            </div>
          )}

          {/* Template: PROFESSIONAL (Clean, structured, corporate) */}
          {userData?.templateId === 'professional' && (
            <div className="w-full pt-8 px-6 pb-4 flex flex-col gap-4 relative">
              <div className="absolute top-0 left-0 w-full h-32 bg-slate-50/50 -skew-y-3 origin-top-left -z-10" />

              <div className="flex flex-row items-start gap-5 relative z-10">
                {/* Profile Image - Rounded Square */}
                <div className="w-24 h-24 rounded-2xl shadow-md overflow-hidden shrink-0 bg-white ring-1 ring-slate-100">
                  {userData?.logoUrl ? (
                    <img src={userData.logoUrl} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-2xl bg-slate-100" style={{ color: theme.colors.primary }}>{initials}</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-xl font-bold leading-snug tracking-tight mb-1.5" style={textStyle}>{fullName}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-0.5 w-8 rounded-full" style={{ backgroundColor: theme.colors.primary }}></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
                  </div>
                  <div className="text-sm font-medium opacity-70" style={mutedTextStyle}>{company}</div>
                </div>
              </div>

              {/* Company Logo - Top Left */}
              {premium && userData?.companyLogoUrl && (
                <div className="absolute top-4 left-4 z-20">
                  <img src={userData.companyLogoUrl} className="h-8 w-auto object-contain opacity-80" />
                </div>
              )}

              <div className="w-full h-px bg-slate-100 mt-2" />
            </div>
          )}

          {/* Template: CREATIVE (Glassmorphism Overlay) */}
          {userData?.templateId === 'creative' && (
            <div className="flex flex-col mb-4">
              <div className="relative w-full h-48 shrink-0 overflow-hidden">
                {/* Banner Background */}
                <div className={`absolute inset-0 ${bannerClass}`} style={bannerStyle} />
                <div className="absolute inset-0 bg-black/5" />


              </div>

              <div className="relative px-5 -mt-24 z-10 flex flex-col items-center">
                <div className="w-full bg-white/70 backdrop-blur-lg border border-white/60 shadow-xl rounded-2xl p-6 flex flex-col items-center text-center relative">
                  {/* Company Logo Top Right */}
                  {premium && userData?.companyLogoUrl && (
                    <div className="absolute top-3 right-3 opacity-90">
                      <img src={userData.companyLogoUrl} className="h-8 w-auto object-contain" alt="Logo" />
                    </div>
                  )}
                  {/* Profile Image */}
                  <div className="w-24 h-24 rounded-full shadow-lg mb-4 ring-4 ring-white/80 overflow-hidden bg-white">
                    {userData?.logoUrl ? (
                      <img src={userData.logoUrl} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-2xl" style={{ color: theme.colors.primary }}>{initials}</div>
                    )}
                  </div>

                  {/* Text */}
                  <h2 className="text-xl font-bold mb-1.5" style={textStyle}>{fullName}</h2>
                  {title && (
                    <div className="text-xs font-bold uppercase tracking-widest opacity-90 mb-1.5" style={{ color: theme.colors.primary }}>
                      {title}
                    </div>
                  )}
                  <div className="text-sm font-medium opacity-70" style={mutedTextStyle}>{company}</div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Section Ordering */}
          <div className="px-5 mt-6 mb-2 flex flex-col w-full space-y-6">
            {/* Fixed Top Section: Contact Buttons (always shown right after profile header) */}
            {(() => {
              // Render contact buttons
              const isPhoneActive = Boolean(userData?.phone);
              const isEmailActive = Boolean(userData?.email);
              const isWebActive = Boolean(userData?.website);
              const isMapActive = Boolean(userData?.mapLink);

              return (
                <div key="contact" className="flex justify-center gap-4">
                  {[
                    { icon: Phone, label: "Call", active: isPhoneActive, href: isPhoneActive && !previewMode ? `tel:${userData?.phone}` : "#" },
                    { icon: Mail, label: "Email", active: isEmailActive, href: isEmailActive && !previewMode ? `mailto:${userData?.email}` : "#" },
                    { icon: Globe, label: "Web", active: isWebActive, href: isWebActive && !previewMode ? getUrl(userData?.website) : "#", external: true },
                    { icon: MapPin, label: "Map", active: isMapActive, href: isMapActive && !previewMode ? getUrl(userData?.mapLink) : "#", external: true },
                  ].map((action, i) => (
                    <a key={i} href={action.href} target={action.external && !previewMode ? "_blank" : undefined} rel="noopener noreferrer" onClick={(e) => {
                      if (previewMode) { e.preventDefault(); return; }
                      onLinkClick?.(action.label);
                    }} className={`group flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl transition-all duration-300 ${action.active ? 'hover:-translate-y-1 cursor-pointer' : 'opacity-30 grayscale pointer-events-none'}`}>
                      <div className="w-10 h-10 rounded-[18px] flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-lg ring-1 ring-white/10" style={{ backgroundColor: theme.colors.cardBackground, color: theme.colors.primary }}>
                        <action.icon className="w-4.5 h-4.5" strokeWidth={2} />
                      </div>
                      <span className="text-[9px] font-semibold tracking-wide opacity-80" style={mutedTextStyle}>{action.label}</span>
                    </a>
                  ))}
                </div>
              );
            })()}

            {/* Dynamic Sections (excluding profile and contact which are fixed at top) */}
            {(userData?.sectionOrder || ['bio', 'social', 'weblinks', 'video', 'gallery'])
              .filter(sectionId => sectionId !== 'profile' && sectionId !== 'contact') // Exclude fixed sections
              .map((sectionId) => {
                // Check visibility (default to true if undefined)
                if (userData?.visibleSections?.[sectionId] === false) return null;

                // 1. Custom Components
                const customComp = userData?.customComponents?.find(c => c.id === sectionId);
                if (customComp && customComp.active) {
                  return (
                    <div key={sectionId} className="w-full">
                      {customComp.type === 'heading' && <h3 className="text-lg font-bold text-center" style={textStyle}>{customComp.title}</h3>}
                      {customComp.type === 'text' && <p className="text-sm opacity-80 text-center whitespace-pre-wrap" style={mutedTextStyle}>{customComp.content}</p>}
                      {customComp.type === 'button' && (
                        <a href={getUrl(customComp.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full py-3.5 rounded-xl font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ backgroundColor: theme.colors.primary, color: saveButtonTextColor }}>
                          {customComp.title || 'Click Here'}
                        </a>
                      )}
                    </div>
                  );
                }

                // 2. Standard Sections
                switch (sectionId) {
                  case 'profile': // Profile section (handled in header)
                    return null;

                  case 'bio': // Bio
                    if (!userData?.bio) return null;
                    return (
                      <div key="bio" className="w-full flex justify-center">
                        <div className="relative px-4 py-2.5 rounded-2xl text-center border max-w-[90%] backdrop-blur-[2px]" style={{ backgroundColor: `${theme.colors.secondary}08`, borderColor: `${theme.colors.text}10` }}>
                          <p className="text-[11px] leading-relaxed font-medium relative z-10 opacity-90 whitespace-pre-wrap" style={mutedTextStyle}>{userData.bio}</p>
                        </div>
                      </div>
                    );

                  case 'contact': // Contact handled above
                    return null;

                  case 'social':
                    const visibleSocials = socialLinks.filter(l => !['featured_video', 'web_link', 'gallery_image'].includes(l.platform) && l.active !== false && l.url);
                    if (visibleSocials.length === 0) return null;
                    return (
                      <div key="social" className="flex justify-center gap-4 flex-wrap">
                        {visibleSocials.map((link, i) => {
                          const platformConfig = PLATFORM_ICONS[link.platform.toLowerCase()] || PLATFORM_ICONS['default'];
                          const Icon = platformConfig.icon;
                          return (
                            <a key={i} href={getUrl(link.url, link.platform.toLowerCase())} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.(link.platform)} className="transform hover:scale-110 active:scale-95 transition-all duration-200">
                              <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md ring-2 ring-white/20 ${platformConfig.gradient || ''}`} style={{ backgroundColor: platformConfig.gradient ? undefined : platformConfig.color }}><Icon className="w-5 h-5" /></div>
                            </a>
                          );
                        })}
                      </div>
                    );

                  case 'weblinks':
                    const webLinks = socialLinks.filter(l => l.platform === 'web_link' && l.active !== false);
                    if (webLinks.length === 0) return null;
                    return (
                      <div key="weblinks" className="w-full flex flex-col gap-3 px-4">
                        {webLinks.map((link, i) => (
                          <a key={i} href={getUrl(link.url)} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.('web_link')} className="flex items-center gap-3 w-full p-3 rounded-xl border transition-all duration-200 hover:shadow-md active:scale-[0.99]" style={{ backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, color: theme.colors.text }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}><Globe className="w-5 h-5" /></div>
                            <div className="flex-1 min-w-0 text-left"><div className="font-semibold text-sm truncate">{link.label || 'Web Link'}</div><div className="text-xs opacity-60 truncate" style={{ color: theme.colors.secondary }}>{link.url}</div></div>
                          </a>
                        ))}
                      </div>
                    );

                  case 'video':
                    if (!featuredVideoUrl) return null;
                    return (
                      <div key="video" className="w-full space-y-4 px-1 pb-4">
                        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm border border-black/5 bg-black relative z-20" style={{ borderColor: theme.colors.border }}>
                          {getYoutubeId(featuredVideoUrl) ? (
                            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYoutubeId(featuredVideoUrl)}?rel=0`} title="Featured Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0 }} />
                          ) : (
                            <video src={featuredVideoUrl} controls className="w-full h-full object-cover" preload="metadata" />
                          )}
                        </div>
                      </div>
                    );

                  case 'gallery':
                    const galleryLinks = socialLinks.filter(l => l.platform === 'gallery_image' && l.active !== false);
                    if (galleryLinks.length === 0) return null;
                    return (
                      <div key="gallery" className="w-full px-3 pb-2">
                        <h3 className="text-sm font-semibold mb-3 px-1" style={textStyle}>Gallery</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {galleryLinks.map((link, i) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: theme.colors.border }}><img src={link.url} alt="Gallery" className="w-full h-full object-cover" /></div>
                          ))}
                        </div>
                      </div>
                    );
                  default: return null;
                }
              })}
          </div>

          {/* Branding Footer */}
          <div className="mt-auto pt-8 pb-6 w-full flex justify-center">
            {showBranding && (
              <a
                href="https://simplifytap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-all duration-300"
              >
                <div className="h-px w-10 mb-1 group-hover:w-16 transition-all duration-500" style={{ backgroundColor: `${theme.colors.border}` }} />
                <div className="flex items-baseline gap-1 text-[10px] tracking-widest uppercase font-medium" style={mutedTextStyle}>
                  <span>Powered by</span>
                  <span className="font-semibold font-sans" style={textStyle}>SimplifyTap</span>
                </div>
                <span className="text-[8px] tracking-[0.2em] font-medium uppercase scale-95" style={{ color: `${theme.colors.secondary}80` }}>
                  Digital Identity Platform
                </span>
              </a>
            )}
          </div>

          {premium && !showBranding && (
            <div className="mt-4 pb-32 text-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium" style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}>
                {isTeam ? "Teams" : "Plus"}
              </span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {true && (
          <>
            <div className={`${previewMode ? 'absolute' : 'fixed md:absolute'} bottom-6 left-4 right-4 z-[60] max-w-[420px] mx-auto transition-all duration-500 animate-in fade-in slide-in-from-bottom-4`}>
              <div className="bg-gray-950/80 backdrop-blur-2xl border border-white/10 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3">
                {/* QR Button */}
                <button
                  onClick={() => setShowQr(true)}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 shrink-0 border border-white/5"
                  style={{ backgroundColor: primaryColor, color: saveButtonTextColor }}
                >
                  <QrCode className="w-5 h-5" />
                </button>

                {/* Share Button */}
                <button
                  onClick={() => {
                    const shareLink = cardLink;
                    if (navigator.share) {
                      navigator.share({
                        title: `${userData?.firstName} ${userData?.lastName}`,
                        text: 'Check out my digital business card!',
                        url: shareLink,
                      });
                    } else {
                      navigator.clipboard.writeText(shareLink);
                      alert("Link copied!");
                    }
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 shrink-0 border border-white/5"
                  style={{ backgroundColor: primaryColor, color: saveButtonTextColor }}
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {/* Add to Contact Button */}
                <button
                  onClick={handleDownloadVCard}
                  className="flex-1 h-12 rounded-full flex items-center justify-between px-2 pl-6 shadow-lg active:scale-95 transition-all duration-200 border border-white/5"
                  style={{ backgroundColor: primaryColor, color: saveButtonTextColor }}
                >
                  <span className="font-bold text-sm tracking-tight text-inherit">Add Contact</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: saveButtonTextColor }}
                  >
                    <Plus className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                </button>
              </div>
            </div>

            {/* QR Overlay */}
            {showQr && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowQr(false)}>
                <div className="bg-white p-6 rounded-3xl w-full max-w-sm flex flex-col items-center gap-4 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowQr(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                  <div className="text-center space-y-1 mt-2">
                    <h3 className="font-bold text-lg text-slate-900">Scan to Connect</h3>
                    <p className="text-sm text-slate-500">Point your camera at the QR code</p>
                  </div>
                  <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardLink)}`} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest pt-2">
                    <span className="font-bold text-slate-800">SimplifyTap</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
