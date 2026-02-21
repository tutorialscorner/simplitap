import { useRef, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Image as ImageIcon, Type, Palette, Upload, Lock, Crown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

interface QRCodeGeneratorProps {
    url: string;
    username: string;
    defaultImage?: string;
    premium?: boolean;
}

const BRAND_COLORS = [
    { name: "Black", value: "#000000" },
    { name: "Blue", value: "#2563eb" },
    { name: "Purple", value: "#9333ea" },
    { name: "Emerald", value: "#059669" },
    { name: "Red", value: "#dc2626" },
    { name: "Orange", value: "#d97706" },
    { name: "Pink", value: "#db2777" },
    { name: "Navy", value: "#1e293b" },
];

export const QRCodeGenerator = ({ url, username, defaultImage, premium = false }: QRCodeGeneratorProps) => {
    // If not premium, enforce defaults
    const [fgColor, setFgColor] = useState(premium ? "#000000" : "#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [includeLogo, setIncludeLogo] = useState(premium);
    const [logoSize, setLogoSize] = useState(24);
    const [customText, setCustomText] = useState(premium ? `Scan to connect with ${username}` : "");
    const [downloading, setDownloading] = useState(false);
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    // Use default image if available and no custom logo set
    const logoUrl = customLogo || defaultImage;

    // Enforce non-premium limits if prop changes
    useEffect(() => {
        if (!premium) {
            setFgColor("#000000");
            setBgColor("#ffffff");
            setIncludeLogo(false);
            setCustomText("");
        } else {
            // Restore defaults for premium feel
            setIncludeLogo(true);
            setCustomText(`Scan to connect with ${username}`);
        }
    }, [premium, username]);

    const handleDownload = async () => {
        if (qrRef.current) {
            setDownloading(true);
            try {
                const dataUrl = await toPng(qrRef.current, { cacheBust: true, pixelRatio: 3 });
                const link = document.createElement("a");
                link.download = `${username}-qrcode.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error("Failed to download QR", err);
            } finally {
                setDownloading(false);
            }
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const LockOverlay = () => {
        const { isSignedIn } = useUser();
        const navigate = useNavigate();

        return (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
                <div className="bg-white p-3 rounded-full shadow-lg mb-3">
                    <Crown className="w-6 h-6 text-amber-500 fill-amber-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Plus Feature</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-[200px]">Upgrade to customize colors, add logos, and custom text.</p>
                <Button
                    size="sm"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 text-white shadow-md"
                    onClick={() => {
                        if (!isSignedIn) {
                            navigate("/create");
                        } else {
                            navigate("/pricing");
                        }
                    }}
                >
                    Upgrade to Plus
                </Button>
            </div>
        );
    };

    return (
        <DialogContent className="sm:max-w-md md:max-w-3xl h-[90vh] md:h-auto flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle>Customize Your QR Code</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col md:flex-row h-full overflow-hidden">
                {/* Preview Section */}
                <div className="flex-1 bg-gray-50/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 min-h-[300px] md:min-h-[400px]">
                    <div
                        ref={qrRef}
                        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-6 relative"
                        style={{ backgroundColor: bgColor }}
                    >
                        <QRCodeSVG
                            value={url}
                            size={200}
                            fgColor={fgColor}
                            bgColor={bgColor} // Transparent in SVG, but container handles it
                            level="H" // High error correction for logo
                            imageSettings={includeLogo && logoUrl ? {
                                src: logoUrl,
                                x: undefined,
                                y: undefined,
                                height: logoSize,
                                width: logoSize,
                                excavate: true,
                            } : undefined}
                        />
                        {customText && (
                            <p
                                className="text-center font-medium text-sm max-w-[200px] break-words"
                                style={{ color: fgColor === '#ffffff' ? '#000000' : fgColor }}
                            >
                                {customText}
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">Preview</p>
                </div>

                {/* Controls Section */}
                <div className="flex-1 flex flex-col h-[50%] md:h-auto relative">
                    {/* Global Lock for Basic Users */}
                    {!premium && <LockOverlay />}

                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-6">
                            <Tabs defaultValue="color">
                                <TabsList className="w-full grid grid-cols-3 mb-4">
                                    <TabsTrigger value="color"><Palette className="w-4 h-4 mr-2" /> Colors</TabsTrigger>
                                    <TabsTrigger value="logo"><ImageIcon className="w-4 h-4 mr-2" /> Logo</TabsTrigger>
                                    <TabsTrigger value="text"><Type className="w-4 h-4 mr-2" /> Text</TabsTrigger>
                                </TabsList>

                                {/* Colors Tab */}
                                <TabsContent value="color" className="space-y-4">
                                    <div className="space-y-3">
                                        <Label>Foreground Color</Label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {BRAND_COLORS.map((c) => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setFgColor(c.value)}
                                                    className={`h-8 w-full rounded-md border transition-all ${fgColor === c.value ? 'ring-2 ring-primary ring-offset-1' : 'hover:scale-105'}`}
                                                    style={{ backgroundColor: c.value }}
                                                    title={c.name}
                                                    disabled={!premium}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input
                                                type="color"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="w-12 h-8 p-1"
                                                disabled={!premium}
                                            />
                                            <span className="text-xs text-muted-foreground">Custom Hex</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <Label>Background Color</Label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setBgColor("#ffffff")}
                                                className={`h-8 w-8 rounded-full border bg-white ${bgColor === '#ffffff' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                                title="White"
                                                disabled={!premium}
                                            />
                                            <button
                                                onClick={() => setBgColor("#f9fafb")}
                                                className={`h-8 w-8 rounded-full border bg-gray-50 ${bgColor === '#f9fafb' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                                title="Light Gray"
                                                disabled={!premium}
                                            />
                                            <button
                                                onClick={() => setBgColor("#fffbeb")}
                                                className={`h-8 w-8 rounded-full border bg-amber-50 ${bgColor === '#fffbeb' ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                                title="Amber tint"
                                                disabled={!premium}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Logo Tab */}
                                <TabsContent value="logo" className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Show Profile Picture</Label>
                                        <Switch checked={includeLogo} onCheckedChange={setIncludeLogo} disabled={!premium} />
                                    </div>

                                    <div className={`space-y-4 ${includeLogo ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                        <div className="space-y-3">
                                            <Label>Logo Size</Label>
                                            <Slider
                                                value={[logoSize]}
                                                onValueChange={(val) => setLogoSize(val[0])}
                                                min={10}
                                                max={60}
                                                step={2}
                                                disabled={!includeLogo || !premium}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Text Tab */}
                                <TabsContent value="text" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Label Text</Label>
                                        <Input
                                            value={customText}
                                            onChange={(e) => setCustomText(e.target.value)}
                                            placeholder="Scan me!"
                                            maxLength={40}
                                            disabled={!premium}
                                        />
                                        <p className="text-[10px] text-muted-foreground text-right">{customText.length}/40</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ScrollArea>

                    <div className="p-6 border-t border-gray-100 bg-white relative z-30">
                        <Button
                            onClick={handleDownload}
                            className="w-full gap-2"
                            disabled={downloading}
                        >
                            {downloading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download {premium ? "Custom" : "Standard"} PNG
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
};
