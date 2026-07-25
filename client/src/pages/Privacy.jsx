import React from "react";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import { Shield, Eye, Lock, Database, Scale } from "lucide-react";
import { Link } from "react-router-dom";

const TOC = [
    { id: "dpdp-statutory-notice", label: "DPDP Act 2023 Statutory Notice" },
    { id: "information-collection", label: "Itemized Data Collection" },
    { id: "information-use", label: "Purpose of Processing Data" },
    { id: "data-security", label: "Data Security Standards" },
    { id: "dpo-contact", label: "DPO & Grievance SLA" },
];

const sections = [
    {
        id: "dpdp-statutory-notice",
        icon: Scale,
        title: "1.0 Statutory Notice under Digital Personal Data Protection Act, 2023",
        content: [
            {
                subtitle: "Data Fiduciary Disclosure (Section 5)",
                text: "Renters Real Estate Services Private Limited acts as a Data Fiduciary under the DPDP Act 2023. We collect personal data solely for specified, lawful purposes related to real estate discovery, landlord-tenant communication, and digital lease creation. We do not sell or trade your personal data."
            },
            {
                subtitle: "Data Principal Rights (Sections 11 - 14)",
                text: "As a Data Principal, you hold statutory rights including: (1) Right to Access summary of personal data processed, (2) Right to Correction & Erasure of inaccurate or obsolete data, (3) Right of Grievance Redressal, and (4) Right to Nominate a representative in case of death or incapacity."
            }
        ]
    },
    {
        id: "information-collection",
        icon: Database,
        title: "2.0 Itemized Personal Data We Collect",
        content: [
            {
                subtitle: "Account & Profile Information",
                text: "Name, email address, phone number, profile image, and authentication credentials necessary to verify user identity."
            },
            {
                subtitle: "Property Listing & Document Data",
                text: "Property addresses, pricing, photographs, floor plans, electricity bill verification receipts, and lease agreement terms."
            },
            {
                subtitle: "Technical & Device Logs",
                text: "IP address, browser type, device identifiers, search filters, and page interaction timestamps collected for fraud prevention and performance optimization."
            }
        ]
    },
    {
        id: "information-use",
        icon: Eye,
        title: "3.0 Purpose of Processing Data",
        content: [
            {
                subtitle: "Real Estate Service Delivery",
                text: "Connecting prospective tenants with property owners, sending WhatsApp inquiry alerts, and generating downloadable property PDF brochures."
            },
            {
                subtitle: "Safety, Security & Verification",
                text: "Detecting fraudulent listings, enforcing fair housing policies, and verifying owner authenticity."
            }
        ]
    },
    {
        id: "data-security",
        icon: Lock,
        title: "4.0 Data Security & Storage Standards",
        content: [
            {
                subtitle: "AES-256 Encryption & TLS 1.3",
                text: "All data in transit is protected using TLS 1.3 encryption. Stored databases employ AES-256 encryption at rest on secure cloud servers located within India."
            }
        ]
    }
];

export default function Privacy() {
    return (
        <LegalPageLayout
            title="Privacy Policy & Data Protection Notice"
            subtitle="Official Privacy Policy of Renters Real Estate Services Pvt. Ltd. under the Digital Personal Data Protection Act, 2023 and Information Technology Act, 2000."
            seoTitle="Privacy Policy & DPDP Act 2023 Notice - Renters"
            seoDescription="Official Privacy Policy of Renters Real Estate Services Pvt. Ltd. under the Digital Personal Data Protection Act, 2023 and Information Technology Act, 2000."
            icon={Shield}
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

                            <div className="space-y-4">
                                {section.content.map((item, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <h3 className="text-sm font-semibold text-foreground">{item.subtitle}</h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}

                {/* DPO Contact */}
                <section id="dpo-contact" className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3 text-xs text-muted-foreground text-center">
                    <h3 className="text-sm font-bold text-foreground">5.0 Designated Data Protection Officer (DPO) & Grievance Officer</h3>
                    <p>Renters Real Estate Services Pvt. Ltd. • Corporate Office: Mumbai, Maharashtra, India</p>
                    <p>Email: <a href="mailto:dpo@renters.com" className="text-primary font-bold underline">dpo@renters.com</a> | Helpline: +91 98765 43210</p>
                    <p className="text-[11px]">Statutory SLA: Acknowledgment within 48 hours • Resolution within 7 to 15 business days.</p>
                    <div className="pt-2">
                        <Link to="/do-not-sell-my-info" className="inline-flex items-center font-bold text-primary hover:underline">
                            Submit DPDP Data Principal Opt-Out / Erasure Request →
                        </Link>
                    </div>
                </section>
            </div>
        </LegalPageLayout>
    );
}
