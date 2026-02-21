import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/hooks/useSupabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Trash2, Loader2, AlertTriangle, Link2Off, Nfc } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface PhysicalCardManagerProps {
    profileId: string;
    onUpdate?: () => void;
}

export function PhysicalCardManager({ profileId, onUpdate }: PhysicalCardManagerProps) {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [delinking, setDelinking] = useState<string | null>(null);
    const [makeFree, setMakeFree] = useState(false);
    const authenticatedClient = useSupabase();

    const fetchLinkedCards = async () => {
        if (!profileId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("cards")
            .select("*")
            .eq("profile_uid", profileId);

        if (error) {
            console.error("Error fetching linked cards:", error);
        } else {
            setCards(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLinkedCards();
    }, [profileId]);

    const handleDelink = async (cardUid: string) => {
        setDelinking(cardUid);
        try {
            if (!authenticatedClient) throw new Error("Auth required");

            // 1. Delink the card
            const { error: delinkError } = await authenticatedClient
                .from("cards")
                .update({
                    profile_uid: null,
                    status: "UNACTIVATED",
                    activated_at: null
                })
                .eq("card_uid", cardUid);

            if (delinkError) throw delinkError;

            // 2. If user requested to make profile free
            if (makeFree) {
                const { error: profileError } = await authenticatedClient
                    .from("profiles")
                    .update({ is_premium: false })
                    .eq("id", profileId);

                if (profileError) throw profileError;
                toast.success("Card delinked and profile set to Free plan");
            } else {
                toast.success("Card delinked successfully");
            }

            // 3. Log event
            await authenticatedClient.from("card_tap_logs").insert({
                card_uid: cardUid,
                event: "DELINKED"
            });

            fetchLinkedCards();
            if (onUpdate) onUpdate();
        } catch (error: any) {
            toast.error("Failed to delink: " + error.message);
        } finally {
            setDelinking(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Nfc className="w-4 h-4 text-primary" />
                    Linked Physical Cards ({cards.length})
                </h4>
            </div>

            {cards.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
                    <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-gray-500">No physical cards linked to this profile.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Tap a card to start the activation flow.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {cards.map((card) => (
                        <div key={card.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                                    <Nfc className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 font-mono tracking-tight">{card.card_uid}</span>
                                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Active</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Linked on {new Date(card.activated_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-red-600">
                                            <AlertTriangle className="w-5 h-5" />
                                            Delink Physical Card?
                                        </DialogTitle>
                                        <DialogDescription>
                                            This will disconnect physical card <strong>{card.card_uid}</strong> from this profile. Anyone who taps it will see the activation screen again.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="flex items-center space-x-2 py-4">
                                        <Checkbox id="make-free" checked={makeFree} onCheckedChange={(v) => setMakeFree(v as boolean)} />
                                        <label
                                            htmlFor="make-free"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 cursor-pointer"
                                        >
                                            Also reset this profile to "Free Plan"
                                        </label>
                                    </div>

                                    <DialogFooter>
                                        <Button variant="destructive" onClick={() => handleDelink(card.card_uid)} disabled={!!delinking} className="w-full sm:w-auto">
                                            {delinking === card.card_uid ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2Off className="w-4 h-4 mr-2" />}
                                            Delink Card
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
