import { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Phone, Mail, Globe, Building, User, Trash2, ArrowRight, Plus, ArrowLeft, Save, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@clerk/clerk-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Sparkles, Camera, Loader2 as Spinner, Download } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import { exportToCSV } from '@/lib/export';

export const ContactsManager = () => {
    const { user } = useUser();
    const supabaseClient = useSupabase();

    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newContact, setNewContact] = useState({
        name: '',
        company: '',
        job_title: '',
        email: '',
        email_2: '-',
        phone: '',
        phone_2: '-',
        website: '',
        address: '',
        business_name: '',
        notes: ''
    });
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (user) {
            fetchContacts();
        }
    }, [user]);

    const fetchContacts = async () => {
        try {
            console.log("Fetching contacts for user:", user?.id);

            // 1. Fetch Manual Contacts (contacts_v2)
            const { data: manualContacts, error: manualError } = await supabaseClient
                .from('contacts_v2')
                .select('*')
                .order('created_at', { ascending: false });

            if (manualError) {
                console.error("Manual Contacts Fetch Error:", manualError);
            }

            // 2. Fetch Exchanged Contacts (contact_exchanges) linked to user's profiles
            const { data: profiles } = await supabaseClient
                .from("profiles")
                .select("id")
                .eq("clerk_user_id", user?.id);

            let exchangedContactsMapped: any[] = [];

            if (profiles && profiles.length > 0) {
                const profileIds = profiles.map(p => p.id);
                const { data: exchanged, error: exchangedError } = await supabaseClient
                    .from("contact_exchanges")
                    .select("*")
                    .in("card_owner_id", profileIds)
                    .order("created_at", { ascending: false });

                if (exchangedError) {
                    console.error("Exchanged Contacts Fetch Error:", exchangedError);
                }

                if (exchanged) {
                    exchangedContactsMapped = exchanged.map((c: any) => ({
                        id: c.id,
                        name: c.visitor_name,
                        email: c.visitor_email,
                        phone: c.visitor_phone,
                        company: c.visitor_company,
                        job_title: c.visitor_job_title,
                        website: null,
                        notes: c.visitor_notes || null,
                        created_at: c.created_at,
                        is_exchange: true
                    }));
                }
            }

            const allContacts = [...(manualContacts || []), ...exchangedContactsMapped].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setContacts(allContacts);
        } catch (err) {
            console.error("Fetch Contacts Caught Error:", err);
            toast.error("Failed to load contacts");
        } finally {
            setLoading(false);
        }
    };

    const handleScanCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setIsAdding(true);
        toast.info("AI is analyzing the business card...");

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];

                const response = await fetch(`${CONFIG.VITE_API_URL}/api/scan-card`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64 })
                });

                const result = await response.json();
                if (result.success) {
                    const data = result.data;
                    setNewContact({
                        name: data.name || '',
                        company: data.business_name || '',
                        job_title: data.job_title || '',
                        email: data.email_1 || '',
                        email_2: data.email_2 || '-',
                        phone: data.phone_1 || '',
                        phone_2: data.phone_2 || '-',
                        website: data.website || '',
                        address: data.address || '',
                        business_name: data.business_name || '',
                        notes: `Scanned via AI on ${new Date().toLocaleDateString()}`
                    });
                    toast.success("Card scanned successfully! Please verify details.");
                } else {
                    toast.error(result.error || "AI failed to scan card");
                }
            };
        } catch (err) {
            console.error("Scan error:", err);
            toast.error("Failed to process scan");
        } finally {
            setIsScanning(false);
        }
    };

    const handleSaveContact = async () => {
        if (!newContact.name.trim()) {
            toast.error("Name is required");
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabaseClient
                .from('contacts_v2')
                .insert([{
                    user_id: user?.id,
                    ...newContact,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            setContacts([data, ...contacts]);
            toast.success("Contact added successfully");
            setIsAdding(false);
            setNewContact({ name: '', company: '', job_title: '', email: '', email_2: '-', phone: '', phone_2: '-', website: '', address: '', business_name: '', notes: '' });
        } catch (err: any) {
            console.error("Error adding contact:", err);
            toast.error(err.message || "Failed to add contact");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (contact: any, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const table = contact.is_exchange ? 'contact_exchanges' : 'contacts_v2';
            const { error } = await supabaseClient
                .from(table)
                .delete()
                .eq('id', contact.id);

            if (error) throw error;

            setContacts(contacts.filter(c => c.id !== contact.id));
            toast.success("Contact deleted");
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to delete contact");
        }
    };

    const filteredContacts = contacts.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.job_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
    };

    const handleDownloadVCard = async (contact: any) => {
        const { downloadVCard: vCardUtil } = await import("@/lib/vcard");
        await vCardUtil({
            firstName: contact.name,
            lastName: '',
            company: contact.company || contact.business_name,
            title: contact.job_title,
            email: contact.email,
            email_2: contact.email_2,
            phone: contact.phone,
            phone_2: contact.phone_2,
            website: contact.website,
            address: contact.address,
            logoUrl: '',
            socialLinks: []
        });
    };

    const handleExportExcel = () => {
        const exportData = contacts.map(c => ({
            Name: c.name || '-',
            Business: c.business_name || c.company || '-',
            JobTitle: c.job_title || '-',
            Phone1: c.phone || '-',
            Phone2: c.phone_2 || '-',
            Email1: c.email || '-',
            Email2: c.email_2 || '-',
            Website: c.website || '-',
            Address: c.address || '-',
            Notes: c.notes || '-',
            Type: c.is_exchange ? 'Exchanged' : 'Manual/Scanned',
            Date: format(new Date(c.created_at), "MMM d, yyyy h:mm a")
        }));
        exportToCSV(exportData, `My_Contacts_${format(new Date(), "yyyy-MM-dd")}`);
    };

    const downloadAllVCards = () => {
        contacts.forEach((contact, index) => {
            setTimeout(() => handleDownloadVCard(contact), index * 200);
        });
    };

    return (
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0 text-slate-900">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="flex items-center justify-between">
                    {isAdding ? (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => setIsAdding(false)}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <span className="flex items-center gap-2">
                                Add New Contact
                            </span>
                        </div>
                    ) : (
                        <>
                            <span className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Contacts Manager
                            </span>
                            <div className="flex items-center gap-2 mr-8">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleExportExcel}
                                    className="h-8 gap-2 border-green-600 text-green-700 hover:bg-green-50"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Export Excel
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={downloadAllVCards}
                                    className="h-8 gap-2"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    All vCards
                                </Button>
                                <span className="text-sm font-normal text-muted-foreground mx-1">
                                    {contacts.length} Contacts
                                </span>

                                <input
                                    type="file"
                                    id="ai-card-scan"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleScanCard}
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                    onClick={() => document.getElementById('ai-card-scan')?.click()}
                                    disabled={isScanning}
                                >
                                    {isScanning ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    AI Scan Card
                                </Button>

                                <Button
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => setIsAdding(true)}
                                    title="Add Contact Manually"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </DialogTitle>
            </DialogHeader>

            {!isAdding && (
                <div className="px-6 py-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search contacts..."
                            className="pl-9 bg-gray-50"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <ScrollArea className="flex-1 bg-gray-50/50 p-6">
                {isAdding ? (
                    <div className="bg-white rounded-xl border p-6 space-y-4 max-w-lg mx-auto">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="e.g. John Doe"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Business / Brand Name</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="e.g. Acme Corp"
                                    value={newContact.business_name}
                                    onChange={(e) => setNewContact({ ...newContact, business_name: e.target.value, company: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone 1 (Primary)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        type="tel"
                                        placeholder="+1 234 567 8900"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone 2 (Secondary)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        type="tel"
                                        placeholder="-"
                                        value={newContact.phone_2}
                                        onChange={(e) => setNewContact({ ...newContact, phone_2: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email 1 (Primary)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        type="email"
                                        placeholder="email@example.com"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email 2 (Secondary)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        type="email"
                                        placeholder="-"
                                        value={newContact.email_2}
                                        onChange={(e) => setNewContact({ ...newContact, email_2: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Address</label>
                            <Input
                                placeholder="Street, City, Country, ZIP"
                                value={newContact.address}
                                onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Website</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="www.example.com"
                                    value={newContact.website}
                                    onChange={(e) => setNewContact({ ...newContact, website: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Notes (Met at, details...)</label>
                            <Textarea
                                placeholder="Meeting notes..."
                                value={newContact.notes}
                                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                                className="h-20"
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleSaveContact} disabled={saving}>
                                {saving ? "Saving..." : "Save Contact"}
                            </Button>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center p-8">Loading...</div>
                ) : filteredContacts.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {filteredContacts.map(contact => (
                            <div key={contact.id} className="bg-white rounded-xl border shadow-sm transition-all hover:shadow-md flex flex-col group relative overflow-hidden">
                                <div className="p-4 flex items-start gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {getInitials(contact.name || contact.company)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 text-slate-900">
                                        <h4 className="font-semibold text-gray-900 truncate pr-6">{contact.name || "Unknown Name"}</h4>
                                        <p className="text-xs text-gray-500 truncate mb-2">{contact.job_title} {contact.company ? `@ ${contact.company}` : ''}</p>

                                        <div className="space-y-1.5 hidden md:block">
                                            {(contact.phone || contact.phone_2 !== '-') && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    {contact.phone} {contact.phone_2 !== '-' && `/ ${contact.phone_2}`}
                                                </div>
                                            )}
                                            {(contact.email || contact.email_2 !== '-') && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <span className="truncate">{contact.email} {contact.email_2 !== '-' && `/ ${contact.email_2}`}</span>
                                                </div>
                                            )}
                                            {contact.address && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Globe className="w-3 h-3 text-gray-400" />
                                                    <span className="truncate">{contact.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDelete(contact, e)}
                                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors absolute top-3 right-3"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {contact.notes && (
                                    <div className="px-4 pb-4">
                                        <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 flex gap-2">
                                            <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-gray-600 italic line-clamp-2">
                                                {contact.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto border-t bg-gray-50/50 p-3 flex items-center justify-between gap-2">
                                    <Button
                                        onClick={() => handleDownloadVCard(contact)}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-8 gap-1.5 bg-white border-gray-200 hover:bg-gray-100 hover:text-gray-900 font-medium"
                                    >
                                        <User className="w-3.5 h-3.5" />
                                        Save Contact
                                    </Button>

                                    <div className="flex items-center gap-1.5">
                                        {contact.phone && (
                                            <a
                                                href={`https://wa.me/${contact.phone.replace(/[^\d]/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors shadow-sm"
                                                title="WhatsApp"
                                            >
                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                            </a>
                                        )}
                                        {contact.phone && (
                                            <a
                                                href={`tel:${contact.phone}`}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm"
                                                title="Call"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        {contact.email && (
                                            <a
                                                href={`mailto:${contact.email}`}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
                                                title="Email"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 text-gray-400 opacity-60">
                        <User className="w-12 h-12 mb-4 text-gray-300" />
                        <p>No contacts found.</p>
                        <p className="text-xs">Scan a card to get started.</p>
                    </div>
                )}
            </ScrollArea>
        </DialogContent>
    );
};
