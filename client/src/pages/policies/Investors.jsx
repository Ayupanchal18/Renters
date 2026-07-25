import React from "react";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { TrendingUp, Building2, Mail } from "lucide-react";

const TOC = [
    { id: "entity-details", label: "Statutory Entity Details" },
    { id: "growth-metrics", label: "Key Platform Growth Metrics" },
    { id: "strategic-pillars", label: "Core Strategic Pillars" },
    { id: "investor-contact", label: "Investor Contact & Inquiries" },
];

export default function Investors() {
    return (
        <LegalPageLayout
            title="Investor Relations & Corporate Disclosures"
            subtitle="Corporate Governance & Platform Transparency of Renters Real Estate Services Private Limited."
            seoTitle="Investor Relations & Corporate Disclosures - Renters"
            seoDescription="Corporate governance, legal disclosures, market growth metrics, and investor relations for Renters Real Estate Services Pvt. Ltd."
            icon={TrendingUp}
            toc={TOC}
        >
            {/* Section 1: Entity Details */}
            <section id="entity-details" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">1.0 Statutory Entity Details</h2>
                </div>
                <p><strong className="text-foreground">Legal Entity Name:</strong> Renters Real Estate Services Private Limited</p>
                <p><strong className="text-foreground">Corporate Identification Number (CIN):</strong> U70100MH2024PTC987654</p>
                <p><strong className="text-foreground">Registered Office:</strong> Level 12, Express Towers, Nariman Point, Mumbai, Maharashtra 400021, India</p>
                <p><strong className="text-foreground">Regulatory Standard:</strong> Compliant with Ministry of Corporate Affairs (MCA), RERA Intermediary Rules, and DPDP Act 2023.</p>
            </section>

            {/* Section 2: Metrics */}
            <section id="growth-metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-card border border-border rounded-2xl text-center shadow-xs">
                    <div className="text-2xl sm:text-3xl font-black text-primary">50,000+</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Active Property Listings</div>
                </div>
                <div className="p-5 bg-card border border-border rounded-2xl text-center shadow-xs">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600">100+</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Tier-1 & Tier-2 Indian Cities</div>
                </div>
                <div className="p-5 bg-card border border-border rounded-2xl text-center shadow-xs">
                    <div className="text-2xl sm:text-3xl font-black text-blue-600">98.4%</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Verified Owner Listings</div>
                </div>
                <div className="p-5 bg-card border border-border rounded-2xl text-center shadow-xs">
                    <div className="text-2xl sm:text-3xl font-black text-purple-600">2M+</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Monthly Active Seekers</div>
                </div>
            </section>

            {/* Section 3: Pillars */}
            <section id="strategic-pillars" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-xl font-bold text-foreground">3.0 Strategic Pillars</h2>

                <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <p>
                        <strong className="text-foreground">3.1 AI Listing Audits & Fraud Reduction:</strong> Automated computer vision audits cross-verify duplicate property photos and owner phone numbers to minimize scam risk.
                    </p>
                    <p>
                        <strong className="text-foreground">3.2 End-to-End Rental Infrastructure:</strong> Digital lease agreements, rent deposit tracking, and automated society maintenance workflows.
                    </p>
                    <p>
                        <strong className="text-foreground">3.3 Multi-City Expansion:</strong> Rapid adoption across Bengaluru, Mumbai, Delhi NCR, Pune, Hyderabad, and Chennai.
                    </p>
                </div>
            </section>

            {/* Section 4: Contact */}
            <section id="investor-contact" className="p-6 rounded-2xl bg-muted/40 border border-border text-center">
                <h3 className="font-bold text-foreground text-base mb-1">4.0 Investor Contact</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                    For institutional investor inquiries, governance filings, or audit reports:
                </p>
                <a 
                    href="mailto:investors@renters.com" 
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl gap-2"
                >
                    <Mail className="w-4 h-4" />
                    Contact Investor Relations (investors@renters.com)
                </a>
            </section>
        </LegalPageLayout>
    );
}
