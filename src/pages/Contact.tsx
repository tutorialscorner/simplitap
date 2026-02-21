import { useState } from "react";
import { Navbar } from "@/components/simplify-tap/Navbar";
import { Footer } from "@/components/simplify-tap/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);

        try {
            const response = await fetch("https://formspree.io/f/xeelkwab", {
                method: "POST",
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                setIsSubmitted(true);
                toast.success("Message sent successfully!");
                (e.target as HTMLFormElement).reset();
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } catch (error) {
            toast.error("Failed to send message. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-12 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Message Sent!</h2>
                        <p className="text-[#64748B] mb-8 leading-relaxed">
                            Thank you for reaching out to Simplify Tap. Our team will get back to you within 24-48 hours.
                        </p>
                        <Button
                            onClick={() => setIsSubmitted(false)}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
                        >
                            Send Another Message
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 pt-32 pb-24 px-6 md:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-16 animate-in fade-in slide-in-from-top-10 duration-700">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#0F172A] mb-6">
                            Let's start a <span className="text-primary">conversation.</span>
                        </h1>
                        <p className="text-lg text-[#64748B] max-w-2xl mx-auto font-normal">
                            Have questions about our NFC products or need custom solutions for your team? We're here to help.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Contact Info Cards */}
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-10 duration-700 delay-200">
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0F172A] mb-2">Email Us</h3>
                                        <p className="text-[#64748B] mb-4">Our friendly team is here to help.</p>
                                        <a href="mailto:support@simplifytap.com" className="text-primary font-bold hover:underline">
                                            support@simplifytap.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0F172A] mb-2">Call Us</h3>
                                        <p className="text-[#64748B] mb-4">Mon-Fri from 9am to 6pm IST.</p>
                                        <a href="tel:+917618619610" className="text-blue-600 font-bold hover:underline">
                                            +91 7618619610
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0F172A] mb-2">Our Office</h3>
                                        <p className="text-[#64748B] mb-2">Come say hello at our HQ.</p>
                                        <p className="text-[#0F172A] font-medium leading-relaxed">
                                            Hyderabad, Telangana, India
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 md:p-12 animate-in fade-in slide-in-from-right-10 duration-700 delay-300">
                            <div className="mb-8">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Send a message
                                </div>
                                <h2 className="text-3xl font-bold text-[#0F172A]">Get in touch</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="full-name" className="text-sm font-semibold text-[#64748B]">Full Name</Label>
                                        <Input
                                            id="full-name"
                                            name="name"
                                            placeholder="John Doe"
                                            required
                                            className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-[#64748B]">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            required
                                            className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-semibold text-[#64748B]">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+91 XXXXX XXXXX"
                                        required
                                        className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-sm font-semibold text-[#64748B]">Message</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="How can we help you?"
                                        required
                                        className="min-h-[150px] rounded-2xl bg-gray-50 border-gray-200 focus:bg-white transition-all resize-none p-4"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        "Sending..."
                                    ) : (
                                        <>
                                            Send Message
                                            <Send className="w-5 h-5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
