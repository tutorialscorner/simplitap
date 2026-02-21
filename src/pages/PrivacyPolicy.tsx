import React from "react";
import { Footer } from "@/components/simplify-tap/Footer";
import { Navbar } from "@/components/simplify-tap/Navbar";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>

                        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
                            {/* Privacy Policy */}
                            <div className="space-y-6">
                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Information Collection</h2>
                                    <p>
                                        We collect personal details (name, contact number, email, address) only for order processing and customer support.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Data Usage</h2>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Your information is not shared, sold, or misused.</li>
                                        <li>We use data for order fulfillment, marketing updates (if opted in), and service improvement.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Security Measures</h2>
                                    <p>
                                        We implement security practices to protect customer information. However, we advise users to avoid sharing sensitive details over unsecured networks.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Third-Party Links</h2>
                                    <p>
                                        Our website may contain links to third-party platforms. We are not responsible for their privacy policies or content.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Policy Updates</h2>
                                    <p>
                                        We reserve the right to update this policy. Continued use of our website implies acceptance of any changes.
                                    </p>
                                </section>
                            </div>

                            {/* Cancellation Policy */}
                            <div className="pt-8 border-t border-slate-100 space-y-6">
                                <h1 className="text-4xl font-bold text-slate-900 mb-2">Cancellation Policy</h1>

                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Order Cancellation</h2>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Customers can cancel their order within <span className="font-semibold text-slate-900">12 hours</span> of placing it for a full refund.</li>
                                        <li>Once an order is processed or shipped, cancellation is not allowed.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Refunds for Cancellations</h2>
                                    <p>
                                        Eligible cancellations will be refunded within <span className="font-semibold text-slate-900">5-7 business days</span> to the original payment method.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Company-Initiated Cancellations</h2>
                                    <p>
                                        If we are unable to process an order due to stock unavailability or unforeseen circumstances, a full refund will be issued.
                                    </p>
                                </section>
                            </div>

                            <section className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Have Questions?</h3>
                                <p className="text-sm">
                                    For any queries, reach out to us at <span className="font-semibold">+91 7618619610</span> or email us at <a href="mailto:support@simplifytap.com" className="text-primary hover:underline font-semibold">support@simplifytap.com</a>
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

export default PrivacyPolicy;
