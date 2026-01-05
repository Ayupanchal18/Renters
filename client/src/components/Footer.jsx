import React from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const footerLinks = {
    explore: [
        { label: "All Listings", to: "/listings" },
        { label: "Post Property", to: "/post-property" },
        { label: "Wishlist", to: "/wishlist" },
    ],
    company: [
        { label: "About Us", to: "/about" },
        { label: "Contact", to: "/contact" },
        { label: "FAQs", to: "/faqs" },
    ],
    legal: [
        { label: "Privacy Policy", to: "/privacy-policy" },
        { label: "Terms of Service", to: "/terms" },
        { label: "Cookie Policy", to: "/privacy-policy#cookies" },
    ],
};

const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-card border-t border-border">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
                    
                    {/* Brand Section */}
                    <div className="lg:col-span-4">
                        <Link to="/" className="inline-flex items-center gap-2 mb-4">
                            <img 
                                src="/Logo2.png" 
                                alt="Renters Logo" 
                                className="h-7 w-7 object-contain"
                            />
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                                Renters
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-xs">
                            Your trusted platform for finding the perfect property. 
                            Buy, sell, or rent with confidence.
                        </p>
                        
                        {/* Social Links */}
                        <div className="flex items-center gap-2">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-5 grid grid-cols-3 gap-4 sm:gap-6">
                        {/* Explore */}
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm">Explore</h4>
                            <ul className="space-y-1 sm:space-y-1.5">
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
                            <h4 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm">Company</h4>
                            <ul className="space-y-1 sm:space-y-1.5">
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

                        {/* Legal */}
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm">Legal</h4>
                            <ul className="space-y-1 sm:space-y-1.5">
                                {footerLinks.legal.map((link) => (
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

                    {/* Newsletter Section */}
                    <div className="lg:col-span-3">
                        <h4 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm">Stay Updated</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                            Get the latest listings delivered to your inbox.
                        </p>
                        <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="h-9 bg-background border-border text-sm"
                            />
                            <Button className="w-full h-9 text-sm font-medium">
                                Subscribe
                                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                        </form>
                        
                        {/* Contact Info */}
                        <div className="mt-4 space-y-1.5">
                            <a 
                                href="mailto:info@renters.com" 
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Mail className="h-3.5 w-3.5" />
                                info@renters.com
                            </a>
                            <a 
                                href="tel:+919876543210" 
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Phone className="h-3.5 w-3.5" />
                                +91 98765 43210
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} Renters. All rights reserved.
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> in India
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
