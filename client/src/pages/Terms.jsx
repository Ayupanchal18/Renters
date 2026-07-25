import React from "react";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import { FileText, Home, Scale, Ban, ShieldCheck } from "lucide-react";

const TOC = [
    { id: "rera-disclaimer", label: "Statutory RERA Intermediary Disclaimer" },
    { id: "it-act-safe-harbor", label: "IT Act Sec 79 Safe Harbor" },
    { id: "listing-obligations", label: "Owner & Agent Obligations" },
    { id: "user-conduct", label: "Prohibited Platform Conduct" },
    { id: "legal-officer", label: "Legal Officer & Jurisdiction" },
];

const sections = [
    {
        id: "rera-disclaimer",
        icon: Scale,
        title: "1.0 Statutory RERA Intermediary Disclaimer (RERA Act, 2016)",
        content: `Renters Real Estate Services Private Limited operates exclusively as a digital advertising platform and IT Intermediary as defined under Section 2(zm) of the Real Estate (Regulation and Development) Act, 2016 (RERA). 

Renters is NOT a Real Estate Developer, Builder, or Promoter. All property listing details, pricing, floor plans, RERA Registration numbers, and possession dates are provided directly by third-party developers, owners, or registered real estate agents.

Home seekers and buyers are strongly advised to independently verify all project details and RERA Registration Numbers directly on the official State RERA Portal (e.g. MahaRERA, HRERA, UP-RERA, Karnataka RERA) before executing any financial transactions or booking payments.`
    },
    {
        id: "it-act-safe-harbor",
        icon: ShieldCheck,
        title: "2.0 IT Act Section 79 Safe Harbor & Due Diligence",
        content: `Pursuant to Section 79 of the Information Technology Act, 2000 and Rule 3 of the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, Renters exercises safe harbor protection as an intermediary. 

Renters does not initiate information transmission, select receivers, or modify third-party listing copy. Upon receiving actual knowledge or statutory notice of unlawful content, Renters will disable access to such listing material within 24 to 36 hours.`
    },
    {
        id: "listing-obligations",
        icon: Home,
        title: "3.0 Property Owner & Agent Listing Obligations",
        content: `By publishing a property listing on Renters, owners and agents warrant that:
• They hold valid legal title, ownership, or written authorization to lease or sell the property.
• All published information, pricing, and photographs are truthful and compliant with local municipal bylaws.
• Promoters must disclose valid State RERA Registration Numbers for all under-construction projects.
• Failure to adhere will result in immediate listing deletion and permanent account termination.`
    },
    {
        id: "user-conduct",
        icon: Ban,
        title: "4.0 Prohibited Platform Conduct",
        content: `Users are strictly prohibited from:
• Posting false, deceptive, or scam listings demanding advance token/gate-pass money.
• Engaging in discriminatory rental practices based on religion, gender, caste, or marital status.
• Scraping, crawling, or copying property data without prior written permission.`
    }
];

export default function Terms() {
    return (
        <LegalPageLayout
            title="Terms of Use & Statutory RERA Disclaimer"
            subtitle="Official Terms of Service for Renters Real Estate Services Pvt. Ltd. Statutory RERA Disclaimer & IT Act 2000 Intermediary rules."
            seoTitle="Terms of Use & RERA Intermediary Disclaimer - Renters"
            seoDescription="Official Terms of Service for Renters Real Estate Services Pvt. Ltd. Statutory RERA Disclaimer & IT Act 2000 Intermediary rules."
            icon={FileText}
            toc={TOC}
        >
            <div className="space-y-6">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <section id={section.id} key={section.id} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {section.content}
                            </p>
                        </section>
                    );
                })}

                {/* Legal Officer */}
                <section id="legal-officer" className="p-6 rounded-2xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
                    <p className="font-bold text-foreground text-sm mb-1">5.0 Renters Legal & Compliance Officer</p>
                    <p>Renters Real Estate Services Pvt. Ltd. • Corporate Office: Mumbai, Maharashtra, India</p>
                    <p className="mt-1">Legal Queries: <a href="mailto:legal@renters.com" className="text-primary font-bold underline">legal@renters.com</a> | Phone: +91 98765 43210</p>
                </section>
            </div>
        </LegalPageLayout>
    );
}
