import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, X, Search, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ExchangeContactModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cardOwnerName: string;
    cardOwnerId: string;
    cardOwnerData: any;
}

export const ExchangeContactModal = ({
    open,
    onOpenChange,
    cardOwnerName,
    cardOwnerId,
    cardOwnerData,
}: ExchangeContactModalProps) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        jobTitle: "",
        company: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Save the contact exchange to database
            const { error } = await supabase.from("contact_exchanges").insert({
                card_owner_id: cardOwnerId,
                visitor_name: formData.name,
                visitor_email: formData.email,
                visitor_phone: formData.phone,
                visitor_job_title: formData.jobTitle,
                visitor_company: formData.company,
            });

            if (error) {
                console.error("Error saving contact exchange:", error);
                alert("Failed to exchange contact. Please try again.");
            } else {
                setSubmitted(true);

                // Auto-download the card owner's vCard
                handleDownloadVCard();

                // Close modal after 2 seconds
                setTimeout(() => {
                    onOpenChange(false);
                }, 2000);
            }
        } catch (err) {
            console.error("Error:", err);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadVCard = async () => {
        const { downloadVCard: vCardUtil } = await import("@/lib/vcard");
        await vCardUtil({
            firstName: cardOwnerData.firstName,
            lastName: cardOwnerData.lastName,
            title: cardOwnerData.title,
            company: cardOwnerData.company,
            email: cardOwnerData.email,
            phone: cardOwnerData.phone,
            website: cardOwnerData.website,
            logoUrl: cardOwnerData.logoUrl,
            socialLinks: cardOwnerData.socialLinks
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl shadow-lg gap-6">
                {!submitted ? (
                    <>
                        <div className="flex flex-col gap-2 text-center">
                            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                                Exchange Contact
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                Share your info with <span className="font-semibold text-slate-900">{cardOwnerName}</span> to save their contact.
                            </DialogDescription>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-xs font-semibold text-slate-700 ml-0.5">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="h-10 text-sm bg-slate-50 border-slate-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700 ml-0.5">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="h-10 text-sm bg-slate-50 border-slate-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 ml-0.5">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+91 XXXXX XXXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        className="h-10 text-sm bg-slate-50 border-slate-200"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="jobTitle" className="text-xs font-semibold text-slate-700 ml-0.5">Job Title</Label>
                                        <Input
                                            id="jobTitle"
                                            placeholder="Job Title"
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                            required
                                            className="h-10 text-sm bg-slate-50 border-slate-200"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="company" className="text-xs font-semibold text-slate-700 ml-0.5">Company</Label>
                                        <Input
                                            id="company"
                                            placeholder="Company"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            required
                                            className="h-10 text-sm bg-slate-50 border-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="flex-1 h-10 text-sm font-medium text-slate-500 hover:text-slate-900"
                                    disabled={isSubmitting}
                                >
                                    Skip
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] h-10 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm rounded-lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Share & Save Contact"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="py-8 text-center space-y-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900">Saved!</h3>
                            <p className="text-sm text-slate-500">
                                Contact downloaded to your device.
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
