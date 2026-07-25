import React, { useState } from "react";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { Cookie, Scale, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

const TOC = [
    { id: "e-commerce-disclosure", label: "Affirmative Consent Requirement" },
    { id: "preference-manager", label: "Manage Cookie Preferences" },
];

export default function CookiePolicy() {
    const [analytics, setAnalytics] = useState(true);
    const [marketing, setMarketing] = useState(false);

    const handleSavePreferences = () => {
        toast.success("Cookie preference settings updated successfully!");
    };

    return (
        <LegalPageLayout
            title="Cookie Policy & Preference Center"
            subtitle="Transparent Cookie Disclosures under the Consumer Protection (E-Commerce) Rules 2020 & DPDP Act 2023."
            seoTitle="Cookie Policy & Consent Manager - Renters"
            seoDescription="Statutory Cookie disclosures under DPDP Act 2023 and Consumer Protection (E-Commerce) Rules 2020. Manage your cookie consent settings."
            icon={Cookie}
            toc={TOC}
        >
            {/* Section 1: Disclosure */}
            <section id="e-commerce-disclosure" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Scale className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">1.0 Affirmative Consent Requirement</h2>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    In strict compliance with Rule 4(2) of the E-Commerce Rules 2020, Renters records consent through explicit user action. Non-essential cookies are disabled by default and require affirmative opt-in.
                </p>
            </section>

            {/* Section 2: Preference Manager */}
            <section id="preference-manager" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-4">2.0 Manage Your Cookie Preferences</h2>

                <div className="space-y-6">
                    {/* Essential Cookies */}
                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                        <div>
                            <h3 className="font-semibold text-foreground text-sm">Essential Authentication & Security Cookies</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Strictly necessary for account session login, security tokens, wishlist persistence, and theme preference.</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full">Always Active</span>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                        <div>
                            <h3 className="font-semibold text-foreground text-sm">Analytical & Search Performance Cookies</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Measures web performance, search latency, and high-demand neighborhood search patterns in aggregate.</p>
                        </div>
                        <button onClick={() => setAnalytics(!analytics)} className="text-primary">
                            {analytics ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                        </button>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                        <div>
                            <h3 className="font-semibold text-foreground text-sm">Marketing & Personalized Recommendations</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Allows tailored property suggestions based on your budget, city, and bedroom filter history.</p>
                        </div>
                        <button onClick={() => setMarketing(!marketing)} className="text-primary">
                            {marketing ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                        </button>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                    <Button onClick={handleSavePreferences} className="h-10 px-6 text-sm font-semibold">
                        Save Preference Settings
                    </Button>
                </div>
            </section>
        </LegalPageLayout>
    );
}
