import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Briefcase, Building2, Calendar, Download, Trash2, Loader2, Users, Phone } from "lucide-react";
import { format } from "date-fns";

interface ContactExchange {
    id: string;
    visitor_name: string;
    visitor_email: string;
    visitor_phone: string | null;
    visitor_job_title: string | null;
    visitor_company: string | null;
    created_at: string;
}

const ExchangedContacts = () => {
    const { user } = useUser();
    const [contacts, setContacts] = useState<ContactExchange[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchExchangedContacts();
        }
    }, [user]);

    const fetchExchangedContacts = async () => {
        if (!user) return;

        try {
            // Get all profiles for the user (in case of duplicates or multiple cards)
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id")
                .eq("clerk_user_id", user.id);

            if (!profiles || profiles.length === 0) return;

            const profileIds = profiles.map(p => p.id);

            // Fetch contact exchanges for all profiles
            const { data, error } = await supabase
                .from("contact_exchanges")
                .select("*")
                .in("card_owner_id", profileIds)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching contacts:", error);
            } else {
                setContacts(data || []);
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this contact?")) return;

        setDeleting(id);
        try {
            const { error } = await supabase
                .from("contact_exchanges")
                .delete()
                .eq("id", id);

            if (error) {
                console.error("Error deleting contact:", error);
                alert("Failed to delete contact");
            } else {
                setContacts(contacts.filter((c) => c.id !== id));
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setDeleting(null);
        }
    };

    const handleDownloadVCard = async (contact: ContactExchange) => {
        const { downloadVCard: vCardUtil } = await import("@/lib/vcard");
        await vCardUtil({
            firstName: contact.visitor_name,
            lastName: '',
            company: contact.visitor_company,
            title: contact.visitor_job_title,
            email: contact.visitor_email,
            phone: contact.visitor_phone,
            website: '',
            logoUrl: '',
            socialLinks: []
        });
    };

    const downloadAllVCards = () => {
        contacts.forEach((contact) => {
            setTimeout(() => handleDownloadVCard(contact), 100);
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f7f9]">
                <Navbar />
                <div className="pt-24 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7f9]">
            <Navbar />

            <main className="pt-24 pb-12 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                <Users className="w-8 h-8 text-primary" />
                                Exchanged Contacts
                            </h1>
                            {contacts.length > 0 && (
                                <Button
                                    onClick={downloadAllVCards}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download All
                                </Button>
                            )}
                        </div>
                        <p className="text-slate-600">
                            People who have exchanged their contact information with you
                        </p>
                    </div>

                    {/* Stats Card */}
                    <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-slate-900">{contacts.length}</div>
                                    <div className="text-sm text-slate-600">Total Exchanges</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contacts List */}
                    {contacts.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                    No Exchanges Yet
                                </h3>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    When someone views your card and exchanges their contact information,
                                    they'll appear here.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {contacts.map((contact) => (
                                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                {/* Name */}
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">
                                                        {contact.visitor_name}
                                                    </h3>
                                                </div>

                                                {/* Details Grid */}
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Mail className="w-4 h-4 text-slate-400" />
                                                        <a
                                                            href={`mailto:${contact.visitor_email}`}
                                                            className="hover:text-primary hover:underline"
                                                        >
                                                            {contact.visitor_email}
                                                        </a>
                                                    </div>

                                                    {contact.visitor_phone && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <Phone className="w-4 h-4 text-slate-400" />
                                                            <a
                                                                href={`tel:${contact.visitor_phone}`}
                                                                className="hover:text-primary hover:underline"
                                                            >
                                                                {contact.visitor_phone}
                                                            </a>
                                                        </div>
                                                    )}

                                                    {contact.visitor_job_title && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                                            <span>{contact.visitor_job_title}</span>
                                                        </div>
                                                    )}

                                                    {contact.visitor_company && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <Building2 className="w-4 h-4 text-slate-400" />
                                                            <span>{contact.visitor_company}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        <span>
                                                            {format(new Date(contact.created_at), "MMM d, yyyy 'at' h:mm a")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadVCard(contact)}
                                                    className="gap-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(contact.id)}
                                                    disabled={deleting === contact.id}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    {deleting === contact.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ExchangedContacts;
