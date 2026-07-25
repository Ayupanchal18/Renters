import React from "react";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { Scale, HeartHandshake, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const TOC = [
    { id: "constitutional-commitment", label: "Constitutional & Ethical Commitment" },
    { id: "protected-grounds", label: "Protected Anti-Discrimination Grounds" },
    { id: "landlord-code", label: "Mandatory Code of Conduct for Landlords" },
    { id: "reporting-violations", label: "Report Discriminatory Violations" },
];

export default function FairHousingPolicy() {
    return (
        <LegalPageLayout
            title="Fair Housing & Non-Discrimination Policy"
            subtitle="Rooted in the constitutional principles of equality (Articles 14 & 15 of the Constitution of India), Renters mandates equal housing access for all."
            seoTitle="Fair Housing & Non-Discrimination Policy - Renters"
            seoDescription="Our commitment to equal opportunity housing and constitutional non-discrimination for property rentals and sales across India."
            icon={Scale}
            toc={TOC}
        >
            {/* Section 1: Constitutional Commitment */}
            <section id="constitutional-commitment" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                        <HeartHandshake className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-1">1.0 Constitutional & Ethical Commitment</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Every citizen and resident searching for a home, PG accommodation, flat, or commercial space on Renters has the right to search, inspect, and lease property without encountering arbitrary discrimination, communal bias, or unlawful exclusion.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 2: Protected Grounds */}
            <section id="protected-grounds" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
                <h2 className="text-xl font-bold text-foreground mb-4">2.0 Protected Grounds Under Renters Policy</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        "Religion, Faith, & Community Beliefs (Art. 15)",
                        "Gender, Gender Identity, & Sexual Orientation",
                        "Caste, Tribe, & Regional Identity (Art. 15)",
                        "Marital Status (Bachelors, Singles, Working Women, Families)",
                        "Dietary & Food Preferences (Vegetarian / Non-Vegetarian)",
                        "Profession, Corporate Role, or Employment Category",
                        "Physical Disability & Accessibility Needs (RPwD Act 2016)",
                        "Senior Citizens & Student Status"
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground bg-muted/40 p-3 rounded-xl border border-border">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 3: Landlord Code */}
            <section id="landlord-code" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    3.0 Mandatory Code of Conduct for Landlords & Brokers
                </h2>

                <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <p>
                        <strong className="text-foreground">3.1 Zero Discriminatory Copy:</strong> Property listings containing exclusionary phrases (e.g. "Only specific religion allowed" or derogatory restrictions) will be auto-flagged by AI content filters and purged immediately.
                    </p>
                    <p>
                        <strong className="text-foreground">3.2 Objective Tenant Evaluation:</strong> Evaluation must be limited strictly to financial solvency, rent payment capability, and valid KYC identification proof.
                    </p>
                    <p>
                        <strong className="text-foreground">3.3 Prohibition of Discriminatory Rent Surcharges:</strong> Quoting higher monthly rent or demanding inflated security deposits based on a tenant's religion, gender, or bachelor status is strictly prohibited.
                    </p>
                </div>
            </section>

            {/* Section 4: Reporting Violations */}
            <section id="reporting-violations" className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-bold text-sm mb-1">4.0 Report Discriminatory Listings</h3>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                        Renters maintains a zero-tolerance policy against housing discrimination. If you encounter discriminatory behavior or listing descriptions, report it to our Compliance Officer. Account penalties include warning notices, listing removal, and permanent platform debarment.
                    </p>
                    <Link to="/contact" className="inline-flex items-center text-xs font-bold text-primary hover:underline">
                        Report Fair Housing Violation →
                    </Link>
                </div>
            </section>
        </LegalPageLayout>
    );
}
