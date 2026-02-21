import React from "react";
import { Footer } from "@/components/simplify-tap/Footer";
import { Navbar } from "@/components/simplify-tap/Navbar";

const TermsConditions = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms and Conditions</h1>

                        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Introduction</h2>
                                <p>
                                    Welcome to Simplify Tap. By accessing our website (www.simplifytap.in) or purchasing our products, you agree to comply with the following terms and conditions.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Use of Products</h2>
                                <p>
                                    Our NFC products are designed to enhance networking and business interactions. Unauthorized reproduction, resale, or modification of our products is strictly prohibited.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Pricing & Payments</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Prices listed on our website are subject to change without prior notice.</li>
                                    <li>We accept online payments via UPI, credit/debit cards, and net banking. Orders will be processed only after payment confirmation.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Order Processing & Delivery</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Orders are typically processed within 2-4 business days.</li>
                                    <li>Delivery times vary based on location and shipping partners.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Limitation of Liability</h2>
                                <p>
                                    Simplify Tap is not responsible for any technical issues, damages, or losses arising from improper use of our products.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Governing Law</h2>
                                <p>
                                    These terms are governed by the laws of India. Any disputes shall be resolved in the jurisdiction of Hyderabad, Telangana.
                                </p>
                            </section>

                            <section className="pt-6 border-t border-slate-100">
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">Return & Exchange Policy</h2>
                                <p>
                                    At Simplify Tap, we prioritize customer satisfaction. If for any reason you are not completely satisfied with your NFC products, we offer a straightforward return and exchange policy to ensure your confidence in shopping with us.
                                </p>
                                <p className="mt-4">
                                    Our aim is to provide a hassle-free process, allowing you to return or exchange products with ease. We believe in building trust and ensuring a seamless experience for our valued customers.
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

export default TermsConditions;
