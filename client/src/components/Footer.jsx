import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    Heart,
    ShieldCheck,
    Lock,
    Scale,
    Building2,
    ShieldAlert
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const footerLinks = {
    explore: [
        { label: "All Listings", to: "/listings" },
        { label: "Rent Properties", to: "/rent-properties" },
        { label: "Buy Properties", to: "/buy-properties" },
        { label: "Post Property", to: "/post-property" },
        { label: "Wishlist", to: "/wishlist" },
    ],
    company: [
        { label: "About Us", to: "/about" },
        { label: "Contact Us", to: "/contact" },
        { label: "FAQs", to: "/faqs" },
        { label: "Blog & Guides", to: "/blog" },
    ],
    legalActions: [
        { label: "Data Privacy Request", to: "/do-not-sell-my-info" },
        { label: "RERA Intermediary Rules", to: "/terms" },
        { label: "Report Fraud / Scam", to: "/avoid-scams" },
        { label: "Copyright Notice", to: "/dmca-policy" },
        { label: "Fair Housing Policy", to: "/fair-housing-policy" },
    ],
};

const topCities = [
    { label: "Flats for Rent in Mumbai", to: "/rent-properties?city=Mumbai" },
    { label: "Apartments in Bengaluru", to: "/rent-properties?city=Bengaluru" },
    { label: "Properties in Delhi NCR", to: "/buy-properties?city=Delhi" },
    { label: "Flats for Rent in Pune", to: "/rent-properties?city=Pune" },
    { label: "Buy Flats in Hyderabad", to: "/buy-properties?city=Hyderabad" },
    { label: "Properties in Chennai", to: "/rent-properties?city=Chennai" },
];

const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const [newsletterEmail, setNewsletterEmail] = React.useState("");
    const [newsletterLoading, setNewsletterLoading] = React.useState(false);

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        if (!newsletterEmail || !newsletterEmail.includes("@")) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setNewsletterLoading(true);
        try {
            const res = await fetch("/api/legal/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "newsletter_subscriber",
                    applicantName: "Newsletter Subscriber",
                    applicantEmail: newsletterEmail,
                    details: "Property Alerts & Market Trends Email Newsletter Subscription"
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Subscribed! You will receive verified property alerts.");
                setNewsletterEmail("");
            } else {
                toast.error(data.message || "Subscription failed");
            }
        } catch (err) {
            console.error("Newsletter error:", err);
            toast.error("Network error subscribing");
        } finally {
            setNewsletterLoading(false);
        }
    };

    return (
        <footer className="bg-card border-t border-border text-foreground print:hidden">
            {/* Trust & Compliance Header Bar */}
            <div className="border-b border-border/60 bg-muted/30 py-3">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs text-muted-foreground font-medium">
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <Scale className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span>RERA Act 2016 Compliant</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>DPDP Act 2023 Data Protection</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>256-Bit SSL Encrypted</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                            <span>Cyber Helpline 1930 Partner</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">
                    
                    {/* Brand & Corporate Section */}
                    <div className="lg:col-span-4 space-y-4">
                        <Link to="/" className="inline-flex items-center gap-2.5">
                            <img 
                                src="/Logo2.png" 
                                alt="Renters Logo" 
                                className="h-8 w-8 object-contain"
                            />
                            <span className="text-2xl font-black bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent tracking-tight">
                                Renters
                            </span>
                        </Link>
                        
                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-sm">
                            India's trusted real estate marketplace. Discover verified residential rentals, PG stays, and property acquisitions with complete RERA transparency.
                        </p>

                        <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/40">
                            <p className="font-bold text-foreground">Renters Real Estate Services Pvt. Ltd.</p>
                            <p>CIN: U70100MH2024PTC987654 • Nariman Point, Mumbai</p>
                        </div>
                        
                        {/* Social Links */}
                        <div className="flex items-center gap-2 pt-2">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="lg:col-span-5 grid grid-cols-3 gap-4 sm:gap-6">
                        {/* Explore */}
                        <div>
                            <h4 className="font-bold text-foreground mb-3 text-xs sm:text-sm uppercase tracking-wider">Explore</h4>
                            <ul className="space-y-2">
                                {footerLinks.explore.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-bold text-foreground mb-3 text-xs sm:text-sm uppercase tracking-wider">Company</h4>
                            <ul className="space-y-2">
                                {footerLinks.company.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal Actions */}
                        <div>
                            <h4 className="font-bold text-foreground mb-3 text-xs sm:text-sm uppercase tracking-wider">Legal & Compliance</h4>
                            <ul className="space-y-2">
                                {footerLinks.legalActions.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter & Contact */}
                    <div className="lg:col-span-3 space-y-4">
                        <div>
                            <h4 className="font-bold text-foreground mb-2 text-xs sm:text-sm uppercase tracking-wider">Stay Updated</h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                Get verified property alerts & real estate market trends.
                            </p>
                            <form className="space-y-2" onSubmit={handleNewsletterSubmit}>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    disabled={newsletterLoading}
                                    className="h-9 bg-background border-border text-xs sm:text-sm"
                                />
                                <Button type="submit" disabled={newsletterLoading} className="w-full h-9 text-xs sm:text-sm font-bold gap-1">
                                    {newsletterLoading ? "Subscribing..." : "Subscribe"}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </form>
                        </div>
                        
                        {/* Support Contact */}
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                            <a 
                                href="mailto:info@renters.com" 
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Mail className="h-3.5 w-3.5 text-primary" />
                                info@renters.com
                            </a>
                            <a 
                                href="tel:+919876543210" 
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Phone className="h-3.5 w-3.5 text-primary" />
                                +91 98765 43210
                            </a>
                        </div>
                    </div>
                </div>

                {/* Popular City Searches Bar */}
                <div className="mt-8 pt-6 border-t border-border/60">
                    <h5 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2.5">
                        Popular Real Estate Searches in India:
                    </h5>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        {topCities.map((city, idx) => (
                            <React.Fragment key={city.label}>
                                <Link to={city.to} className="hover:text-primary transition-colors">
                                    {city.label}
                                </Link>
                                {idx < topCities.length - 1 && <span className="opacity-30">•</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Legal Ribbon Bar */}
            <div className="border-t border-border bg-muted/40 text-[11px] sm:text-xs text-muted-foreground py-3.5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2 text-center font-medium">
                        <Link to="/" className="font-black text-foreground hover:text-primary transition-colors">
                            Renters.com
                        </Link>
                        <span className="opacity-30">•</span>
                        <span>© {currentYear} All Rights Reserved</span>
                        <span className="opacity-30">•</span>
                        <Link to="/do-not-sell-my-info" className="hover:text-primary transition-colors">
                            Do Not Sell My Info
                        </Link>
                        <span className="opacity-30">•</span>
                        <Link to="/fair-housing-policy" className="hover:text-primary transition-colors">
                            Fair Housing Policy
                        </Link>
                        <span className="opacity-30">•</span>
                        <Link to="/dmca-policy" className="hover:text-primary transition-colors">
                            DMCA Policy
                        </Link>
                        <span className="opacity-30">•</span>
                        <Link to="/cookie-policy" className="hover:text-primary transition-colors">
                            Cookie Policy
                        </Link>
                        <span className="opacity-30">•</span>
                        <Link to="/accessibility-statement" className="hover:text-primary transition-colors">
                            Accessibility Statement
                        </Link>
                        <span className="opacity-30">•</span>
                        <Link to="/avoid-scams" className="hover:text-primary transition-colors">
                            Avoid Rental Scams
                        </Link>
                        <span className="opacity-30">•</span>
                        <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                            Privacy Policy
                        </Link>
                        <span className="opacity-30">•</span>
                        <Link to="/terms" className="hover:text-primary transition-colors">
                            Terms of Use
                        </Link>
                        <span className="opacity-30">•</span>
                        <Link to="/investors" className="hover:text-primary transition-colors">
                            Investors
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
