import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Camera, Upload, Check, AlertTriangle, ScanLine, RefreshCw } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';

export const AIScanner = ({ onSuccess, onClose }: { onSuccess?: () => void, onClose?: () => void }) => {
    const { user } = useUser();
    const supabaseClient = useSupabase();

    const [image, setImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        job_title: '',
        company: '',
        website: '',
        notes: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const [rawText, setRawText] = useState('');
    const [showRaw, setShowRaw] = useState(false);

    const preprocessImage = (imageSrc: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(imageSrc);
                    return;
                }

                // Resize for consistency (limit width to 1500px)
                const MAX_WIDTH = 1500;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = (MAX_WIDTH / width) * height;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                const len = data.length;

                // 1. Calculate average brightness to detect dark mode
                let totalBrightness = 0;
                for (let i = 0; i < len; i += 4) {
                    totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
                }
                const avgBrightness = totalBrightness / (len / 4);
                const isDark = avgBrightness < 100; // Threshold for "dark card"

                // 2. Apply Filters (Grayscale -> Invert if Dark -> Contrast -> Binarize)
                for (let i = 0; i < len; i += 4) {
                    let r = data[i];
                    let g = data[i + 1];
                    let b = data[i + 2];

                    // Grayscale
                    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

                    // Invert if dark background (make text black, bg white)
                    if (isDark) {
                        gray = 255 - gray;
                    }

                    // Contrast Boost
                    const contrast = 1.2; // 20% boost
                    gray = contrast * (gray - 128) + 128;

                    // Soft clamping
                    gray = Math.max(0, Math.min(255, gray));

                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL());
            };
            img.onerror = () => resolve(imageSrc);
        });
    };

    const processImage = async () => {
        if (!image) return;
        setScanning(true);
        setStep('scanning');
        setProgress(0);

        try {
            // 1. Preprocess
            const processedImage = await preprocessImage(image);

            // 2. OCR
            const result = await Tesseract.recognize(
                processedImage,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            console.log("Extracted Text:", text);
            setRawText(text);
            parseText(text);
            setStep('review');
        } catch (err) {
            console.error(err);
            toast.error("Failed to scan image. Please try again.");
            setStep('upload');
        } finally {
            setScanning(false);
        }
    };

    const toTitleCase = (str: string) => {
        return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    };

    const cleanText = (str: string) => {
        return str.replace(/[|!_[\]]/g, '').trim();
    };

    const parseText = (text: string) => {
        const lines = text.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);

        let email = '';
        let phone = '';
        let website = '';
        let name = '';
        let company = '';
        let job_title = '';

        // Name finding is complex, let's collect candidates and score them
        let nameCandidates: { text: string, score: number }[] = [];

        // Regex Library
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/;
        const phoneRegex = /(?:\+?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4,}/;
        const urlRegex = /((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?)/i;
        const commonTitles = ['ceo', 'founder', 'president', 'manager', 'director', 'lead', 'head', 'vp', 'vice president', 'executive', 'engineer', 'developer', 'designer', 'consultant', 'associate', 'chief', 'partner', 'owner', 'co-founder', 'chairman'];

        // 1. Extract Email
        const emailMatch = text.match(emailRegex);
        if (emailMatch) {
            email = cleanText(emailMatch[0]);
        }

        // 2. Extract Phone
        for (const line of lines) {
            const match = line.match(phoneRegex);
            if (match && match[0].length > 9) {
                phone = match[0].replace(/[^\d+]/g, '');
                if (phone.startsWith('491') && phone.length > 11) phone = '+' + phone.substring(1);
                else if (phone.startsWith('191') && phone.length > 11) phone = '+' + phone.substring(1);
                break;
            }
        }

        // 3. Extract Website
        for (const line of lines) {
            if (line.includes('@')) continue;
            const match = line.match(urlRegex);
            if (match) {
                website = match[0].replace(/^(re[:!]?|e[:!]?|w[:!]?)\s*/i, '');
                break;
            }
        }

        // 4. Iterate lines for Company, Title, and potential Name candidates
        for (const line of lines) {
            let processedLine = cleanText(line);
            if (processedLine.length < 2) continue;

            const lower = processedLine.toLowerCase();

            // PRIORITY: Check for Title-Company Separation (e.g. "President - Vishwas.io")
            const splitMatch = processedLine.match(/(.+?)(\s+[-|@]\s+?|\s+at\s+)(.+)/i);
            if (splitMatch) {
                const part1 = splitMatch[1].trim();
                const part3 = splitMatch[3].trim();

                if (commonTitles.some(t => part1.toLowerCase().includes(t))) {
                    if (!job_title) job_title = toTitleCase(part1);
                    if (!company) {
                        if (part3.toLowerCase().includes('.')) {
                            const domainParts = part3.split('.');
                            company = toTitleCase(domainParts[0]);
                        } else {
                            company = part3;
                        }
                    }
                    continue;
                }
                else if (commonTitles.some(t => part3.toLowerCase().includes(t))) {
                    if (!job_title) job_title = toTitleCase(part3);
                    if (!company) company = part1;
                    continue;
                }
            }

            // Skip known fields for other extractions
            const isTitle = commonTitles.some(t => lower.includes(t));
            if (!isTitle && (lower.includes('@') || lower.match(phoneRegex) || lower.includes('www.') || lower.includes('.com') || lower.includes('.io'))) {
                // Fallback company
                if (!company && (lower.endsWith('.io') || lower.endsWith('.com'))) {
                    const parts = lower.split('.');
                    if (parts.length > 1) company = toTitleCase(parts[parts.length - 2]);
                }
                continue;
            }

            // A. Job Title
            if (!job_title && isTitle) {
                job_title = toTitleCase(processedLine);
                continue;
            }

            // B. Company (Fallback)
            if (!company && (lower.includes('inc') || lower.includes('llc') || lower.includes('ltd') || lower.includes('pvt'))) {
                company = processedLine;
                continue; // Don't treat company line as name
            }

            // C. Name Candidate Scoring
            if (!/\d/.test(processedLine) && !isTitle) {
                let score = 0;
                let candidate = processedLine;

                // Scrub junk
                const junkStarts = ['eircom', 'email', 'tel', 'fax', 'mob', 'web', 'http', 'www', 'address', '[a]', '[ a]'];
                if (junkStarts.some(j => lower.startsWith(j))) {
                    // It had junk, strip it but penalize slightly as it might be a label line
                    candidate = candidate.replace(/^eircom\s*/i, ''); // specific fix
                    for (const junk of junkStarts) {
                        if (candidate.toLowerCase().startsWith(junk)) {
                            candidate = candidate.substring(junk.length).trim();
                        }
                    }
                    score -= 2;
                }

                if (candidate.length < 3) continue;

                // Capitalization Analysis
                const originalWords = line.split(/\s+/);
                const cleanWords = candidate.split(/\s+/);

                // Boost for having multiple words (First Last)
                if (cleanWords.length > 1) score += 5;

                // Boost for capitalization
                let capsCount = 0;
                for (const w of cleanWords) {
                    if (/^[A-Z]/.test(w)) capsCount++;
                }
                score += (capsCount * 3);

                // Penalties
                if (cleanWords.length === 1) score -= 5; // Single word is rarely a full name on card
                if (lower.startsWith('no:')) score -= 10;

                // Prefer longer names (up to a limit)
                if (candidate.length > 10) score += 2;

                nameCandidates.push({ text: toTitleCase(candidate), score });
            }
        }

        // Select best name
        if (nameCandidates.length > 0) {
            // Sort by score desc
            nameCandidates.sort((a, b) => b.score - a.score);
            if (nameCandidates[0].score > -5) {
                name = nameCandidates[0].text;
            }
        }

        // Final cleanup
        if (!company && website) {
            try {
                const domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname;
                const companyName = domain.replace('www.', '').split('.')[0];
                company = toTitleCase(companyName);
            } catch (e) { }
        }

        setFormData({
            name,
            email,
            phone,
            website,
            company,
            job_title,
            notes: ''
        });
    };

    const handleSave = async () => {
        if (!user) {
            toast.error("You must be logged in to save contacts.");
            return;
        }
        if (!supabaseClient) {
            toast.error("Database connection not initialized. Please try again.");
            return;
        }

        try {
            const { error } = await supabaseClient.from('contacts_v2').insert({
                user_id: user.id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                job_title: formData.job_title,
                website: formData.website,
                notes: formData.notes
            });

            if (error) throw error;

            toast.success("Contact saved successfully!");
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Save error:", err);

            // Fallback error handling
            if (err.message && err.message.includes('relation "public.contacts_v2" does not exist')) {
                toast.error("Database Setup Required: Please run the CREATE_CONTACTS_V2.sql script in Supabase.");
            } else {
                toast.error("Failed to save: " + (err.message || err.error_description || "Unknown error"));
            }
        }
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <ScanLine className="w-5 h-5 text-amber-600" />
                    AI Business Card Scanner
                </DialogTitle>
            </DialogHeader>

            <div className="py-4">
                {step === 'upload' && (
                    <div className="flex flex-col gap-4">
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer min-h-[200px]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {image ? (
                                <img src={image} alt="Preview" className="max-h-[200px] object-contain rounded-md shadow-sm" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">Click to upload or take photo</p>
                                    <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG</p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {image && (
                            <Button onClick={processImage} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                <ScanLine className="w-4 h-4 mr-2" />
                                Extract Details
                            </Button>
                        )}
                    </div>
                )}

                {step === 'scanning' && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="relative w-16 h-16 mb-4">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div
                                className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"
                            ></div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Scanning Card...</h3>
                        <p className="text-sm text-gray-500 mt-1">Extracting text with AI ({progress}%)</p>
                    </div>
                )}

                {step === 'review' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        {/* Debugger */}
                        <div className="text-right">
                            <button onClick={() => setShowRaw(!showRaw)} className="text-[10px] text-amber-600 underline">
                                {showRaw ? "Hide Raw Text" : "Show Raw Scanned Text"}
                            </button>
                        </div>
                        {showRaw && (
                            <textarea
                                className="w-full h-24 text-xs p-2 border rounded-md font-mono bg-gray-50"
                                value={rawText}
                                readOnly
                            />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-xs">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="phone" className="text-xs">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-xs">Email</Label>
                            <Input
                                id="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="title" className="text-xs">Job Title</Label>
                                <Input
                                    id="title"
                                    value={formData.job_title}
                                    onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                                    placeholder="Manager"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="company" className="text-xs">Company</Label>
                                <Input
                                    id="company"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="Acme Inc"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="website" className="text-xs">Website</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                placeholder="www.example.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="notes" className="text-xs">Notes (Meeting details, follow-ups...)</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Met at Tech Conference 2024..."
                                className="h-20"
                            />
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retake
                            </Button>
                            <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                <Check className="w-4 h-4 mr-2" />
                                Save to Contacts
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
};
