import React from "react";
import { Footer } from "@/components/simplify-tap/Footer";
import { Navbar } from "@/components/simplify-tap/Navbar";

const ShippingReturn = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-8">Shipping & Return Policy</h1>

                        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">Shipping Policy</h2>
                                <ul className="list-disc pl-5 space-y-3">
                                    <li>Orders are processed and dispatched within 3-5 business days after confirmation.</li>
                                    <li>We deliver across India through our trusted courier partners.</li>
                                    <li>Delivery timelines vary based on the shipping location.</li>
                                    <li>Customers will receive tracking details once the order is shipped.</li>
                                </ul>
                            </section>

                            <section className="pt-8 border-t border-slate-100">
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">Returns & Replacements</h2>
                                <ul className="list-disc pl-5 space-y-3">
                                    <li>No returns are accepted as all our products are custom printed/engraved.</li>
                                    <li>Returns are only accepted for damaged or defective products, provided the issue is reported within 24 hours of delivery with supporting images/videos.</li>
                                    <li>If eligible, a replacement will be provided after verification.</li>
                                    <li>Returns will not be accepted for incorrect product selection or change of mind.</li>
                                </ul>
                            </section>

                            <section className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Need Help?</h3>
                                <p className="text-sm">
                                    For any concerns, contact us at <span className="font-semibold">+91 7618619610</span> or email <a href="mailto:support@simplifytap.com" className="text-primary hover:underline font-semibold">support@simplifytap.com</a>
                                </p>
                            </section>

                            <p className="text-sm text-slate-400 pt-8 border-t border-slate-100">
                                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ShippingReturn;
