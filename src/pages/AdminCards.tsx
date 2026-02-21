import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminCards() {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [search, setSearch] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === "17022026" && password === "SimplifyTap@1702") {
            setIsAuthenticated(true);
            toast.success("Welcome, Admin");
        } else {
            toast.error("Invalid credentials");
        }
    };

    const fetchCards = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("cards")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Failed to fetch cards");
        } else {
            setCards(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchCards();
        }
    }, [isAuthenticated]);

    const generateCards = async () => {
        setGenerating(true);
        try {
            const { data: existingCards } = await supabase.from("cards").select("card_uid");
            const existingUids = new Set(existingCards?.map((c) => c.card_uid) || []);

            const newCards: any[] = [];
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const digits = "0123456789";

            while (newCards.length < 500) {
                let uid = "";
                const letterArr = new Uint32Array(2);
                window.crypto.getRandomValues(letterArr);
                for (let i = 0; i < 2; i++) {
                    uid += letters[letterArr[i] % letters.length];
                }

                const digitArr = new Uint32Array(3);
                window.crypto.getRandomValues(digitArr);
                for (let i = 0; i < 3; i++) {
                    uid += digits[digitArr[i] % digits.length];
                }

                if (!existingUids.has(uid) && !newCards.some(c => c.card_uid === uid)) {
                    newCards.push({
                        card_uid: uid,
                        status: "UNACTIVATED",
                    });
                }
            }

            const batchSize = 100;
            for (let i = 0; i < newCards.length; i += batchSize) {
                const batch = newCards.slice(i, i + batchSize);
                const { error } = await supabase.from("cards").insert(batch);
                if (error) throw error;
            }

            toast.success("500 cards generated successfully");
            fetchCards();
        } catch (error: any) {
            toast.error("Generation failed: " + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const exportCSV = () => {
        const headers = ["Card UID", "Link", "Status", "Created At"];
        const rows = cards.map((c) => [
            c.card_uid,
            `https://www.simplifytap.in/${c.card_uid}`,
            c.status,
            new Date(c.created_at).toLocaleString(),
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers, ...rows].map((e) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "simplify_tap_cards.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredCards = cards.filter((c) =>
        c.card_uid.toLowerCase().includes(search.toLowerCase())
    );

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter admin username"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="rounded-xl"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 text-lg">
                                Login
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-outfit">Card Management</h1>
                        <p className="text-gray-500">Manage NFC card UIDs and activation status</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={generateCards}
                            disabled={generating}
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-lg shadow-primary/20"
                        >
                            {generating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            Generate 500 Cards
                        </Button>
                        <Button
                            variant="outline"
                            onClick={exportCSV}
                            className="border-gray-200 rounded-xl h-11 px-6"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-lg">Inventory ({cards.length} cards)</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search UID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-gray-50 border-0 rounded-xl h-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center p-20">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow>
                                            <TableHead>Card UID</TableHead>
                                            <TableHead>Full Link</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCards.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20 text-gray-400">
                                                    No cards found. Click "Generate 500 Cards" to start.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCards.map((card) => (
                                                <TableRow key={card.id}>
                                                    <TableCell className="font-bold font-mono text-primary">
                                                        {card.card_uid}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-sm">
                                                        <a
                                                            href={`https://www.simplifytap.in/${card.card_uid}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="hover:underline"
                                                        >
                                                            simplifytap.in/{card.card_uid}
                                                        </a>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                card.status === "ACTIVATED"
                                                                    ? "default"
                                                                    : "secondary"
                                                            }
                                                            className={
                                                                card.status === "ACTIVATED"
                                                                    ? "bg-green-100 text-green-700 hover:bg-green-100 border-0"
                                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-100 border-0"
                                                            }
                                                        >
                                                            {card.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-gray-400 text-sm">
                                                        {new Date(card.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
