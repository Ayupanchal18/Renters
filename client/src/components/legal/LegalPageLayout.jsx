import React, { useState } from "react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import SEOHead from "../seo/SEOHead";
import { Link, useLocation } from "react-router-dom";
import { Printer, ShieldCheck, ChevronRight, FileText, Lock, EyeOff, Scale, Copyright, Cookie, Accessibility, ShieldAlert, TrendingUp, Search } from "lucide-react";
import { Button } from "../ui/button";

const ALL_POLICIES = [
    { path: "/privacy-policy", label: "Privacy Policy", icon: Lock },
    { path: "/terms", label: "Terms of Use", icon: FileText },
    { path: "/do-not-sell-my-info", label: "Do Not Sell My Info", icon: EyeOff },
    { path: "/fair-housing-policy", label: "Fair Housing Policy", icon: Scale },
    { path: "/dmca-policy", label: "DMCA Policy", icon: Copyright },
    { path: "/cookie-policy", label: "Cookie Policy", icon: Cookie },
    { path: "/accessibility-statement", label: "Accessibility", icon: Accessibility },
    { path: "/avoid-scams", label: "Avoid Rental Scams", icon: ShieldAlert },
    { path: "/investors", label: "Investors & Corporate", icon: TrendingUp },
];

export default function LegalPageLayout({
    title,
    subtitle,
    seoTitle,
    seoDescription,
    icon: IconHeader = ShieldCheck,
    lastUpdated = "January 1, 2026",
    effectiveDate = "January 1, 2026",
    version = "2026.1 (Statutory)",
    toc = [],
    children
}) {
    const location = useLocation();
    const [activeSection, setActiveSection] = useState(toc[0]?.id || "");

    const handlePrint = () => {
        window.print();
    };

    const scrollToSection = (id) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans antialiased text-foreground">
            <SEOHead title={seoTitle || `${title} - Renters`} description={seoDescription} />
            <Navbar />

            {/* Top Policy Tab Ribbon Bar */}
            <div className="bg-card/90 backdrop-blur border-b border-border sticky top-16 z-30 shadow-xs print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
                        {ALL_POLICIES.map((policy) => {
                            const Icon = policy.icon;
                            const isActive = location.pathname === policy.path;
                            return (
                                <Link
                                    key={policy.path}
                                    to={policy.path}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex-shrink-0 ${
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{policy.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Legal Document Container */}
            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
                {/* Header Banner */}
                <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <IconHeader className="w-48 h-48 text-primary" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Renters Statutory Legal Hub
                            </div>

                            <div className="flex items-center gap-3 print:hidden">
                                <Button
                                    onClick={handlePrint}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Print Document
                                </Button>
                            </div>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-2">
                            {title}
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                            {subtitle}
                        </p>

                        {/* Metadata Bar */}
                        <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground">
                            <div>
                                <span className="font-semibold text-foreground">Effective Date:</span> {effectiveDate}
                            </div>
                            <div className="hidden sm:block">•</div>
                            <div>
                                <span className="font-semibold text-foreground">Last Updated:</span> {lastUpdated}
                            </div>
                            <div className="hidden sm:block">•</div>
                            <div>
                                <span className="font-semibold text-foreground">Version:</span> {version}
                            </div>
                            <div className="hidden sm:block">•</div>
                            <div className="text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                In Effect (India)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid with Sticky Sidebar TOC */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Sidebar TOC (Desktop) */}
                    {toc.length > 0 && (
                        <aside className="hidden lg:block lg:col-span-3 sticky top-32 space-y-4 print:hidden">
                            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">
                                    Table of Contents
                                </h3>
                                <nav className="space-y-1">
                                    {toc.map((item, idx) => (
                                        <button
                                            key={item.id}
                                            onClick={() => scrollToSection(item.id)}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                                                activeSection === item.id
                                                    ? "bg-primary/10 text-primary font-bold"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            }`}
                                        >
                                            <span className="truncate">{idx + 1}.0 {item.label}</span>
                                            {activeSection === item.id && <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 ml-1" />}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </aside>
                    )}

                    {/* Main Reader View */}
                    <div className={`${toc.length > 0 ? "lg:col-span-9" : "lg:col-span-12"} space-y-6`}>
                        {children}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
