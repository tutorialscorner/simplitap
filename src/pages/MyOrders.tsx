
import { useState, useEffect } from "react";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { useUser } from "@clerk/clerk-react";
import { useSupabase } from "@/hooks/useSupabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, MapPin, Truck, Copy, CheckCircle, ExternalLink, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { products } from "@/data/products";

const MyOrders = () => {
    const { user, isLoaded, isSignedIn } = useUser();
    const authenticatedClient = useSupabase();
    const { toast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user || !authenticatedClient) return;

            setLoading(true);
            try {
                // First try specialized query
                const { data, error } = await authenticatedClient
                    .from('orders')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setOrders(data || []);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded && isSignedIn) {
            fetchOrders();
        }
    }, [user, isLoaded, isSignedIn, authenticatedClient]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    };

    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <p className="text-slate-600 mb-6">You need to be logged in to view your orders.</p>
                    <Link to="/signin"><Button>Sign In</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24">
            <Navbar />

            <main className="pt-28 px-4 md:px-8 max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex items-center gap-3">
                            <ShoppingBag className="w-8 h-8 text-primary" />
                            My Orders
                        </h1>
                        <p className="text-slate-500 mt-2">Track recent purchases and manage your deliveries.</p>
                    </div>
                    <Link to="/nfc">
                        <Button variant="outline" className="gap-2">
                            Browse Products <ExternalLink className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <Package className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">It looks like you haven't placed any orders yet. Explore our NFC products to get started.</p>
                        <Link to="/nfc">
                            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl text-lg shadow-lg shadow-primary/20">
                                Shop Now
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <Card key={order.id} className="overflow-hidden border-0 shadow-md shadow-slate-200/50 bg-white rounded-2xl ring-1 ring-slate-100">
                                {/* Order Header */}
                                <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order ID:</span>
                                            <div className="flex items-center gap-2 font-mono text-sm font-medium text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                                                {order.razorpay_order_id || order.id}
                                                <button onClick={() => copyToClipboard(order.razorpay_order_id || order.id, "Order ID")} className="text-slate-400 hover:text-primary transition-colors">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(order.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`${order.status === 'paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                                order.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                                    'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                                } border-0 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`}>
                                                {order.status === 'paid' ? 'Payment Successful' : order.status}
                                            </Badge>
                                            <span className="text-sm font-bold text-slate-900">₹{order.total_amount}</span>
                                        </div>
                                        {order.status === 'paid' && (
                                            <Link to="/activate" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                                                Activate this card <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <CardContent className="p-6">
                                    {/* Items List */}
                                    <div className="space-y-6">
                                        {/* Since items are JSONB, we map them carefully. Assuming consistent structure from Cart. */}
                                        {Array.isArray(order.items) && order.items.map((item: any, idx: number) => {
                                            const product = products.find(p => p.id === item.id);
                                            const displayImage = item.image || product?.image || product?.images?.[0] || "https://placehold.co/400x400?text=Digital+Card";

                                            return (
                                                <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                                    {/* Product Image Placeholder - Since DB might store exact URL or not, we fallback safely */}
                                                    <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                                                        {/* Ideally item.image should be stored in order JSON. If not, use generic placeholder */}
                                                        <img
                                                            src={displayImage}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/150?text=Card"; }}
                                                        />
                                                    </div>

                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                                                        <p className="text-sm text-slate-500 font-medium">Qty: {item.quantity} × ₹{item.price}</p>

                                                        {/* Customization Details if any */}
                                                        {item.customization && (
                                                            <div className="mt-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block text-slate-600">
                                                                {item.customization.businessName && <p>Business: <span className="font-semibold">{item.customization.businessName}</span></p>}
                                                                {item.customization.designUrl && (
                                                                    <a href={item.customization.designUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-1 block flex items-center gap-1">
                                                                        View Custom Design <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Divider */}
                                        <div className="h-px bg-slate-100 w-full my-4"></div>

                                        {/* Shipping Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-semibold text-slate-900 mb-1">Shipping Address</p>
                                                <p className="text-slate-600 leading-relaxed max-w-md">{order.shipping_address || "Address not available"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>

                                {order.status === 'paid' && (
                                    <div className="bg-primary/5 p-4 border-t border-primary/10 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            Ready to Activate
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary hover:text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider"
                                            onClick={() => {
                                                copyToClipboard(order.razorpay_order_id || order.id, "Actication Code");
                                                window.location.href = "/activate";
                                            }}
                                        >
                                            Copy Code & Activate →
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default MyOrders;
