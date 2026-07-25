import React from "react";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { ShieldAlert, AlertOctagon, CheckCircle2, PhoneCall, ShieldCheck, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const TOC = [
    { id: "cyber-helpline", label: "National Cyber Helpline 1930" },
    { id: "golden-rules", label: "5 Mandatory Cyber Safety Rules" },
    { id: "report-fraud", label: "Report Fraudulent Listing" },
];

export default function AvoidScams() {
    return (
        <LegalPageLayout
            title="Avoid Rental Scams & Cyber Fraud Safety Guide"
            subtitle="Cyber Security & Consumer Fraud Prevention in alignment with the Indian Cyber Crime Coordination Centre (I4C)."
            seoTitle="Avoid Rental Scams & Cyber Fraud Safety Guide - Renters"
            seoDescription="Cyber fraud safety, advance token money scam warnings, and National Cyber Crime Helpline 1930 reporting for Renters real estate platform."
            icon={ShieldAlert}
            toc={TOC}
        >
            {/* Section 1: Cyber Helpline Bar */}
            <section id="cyber-helpline" className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <PhoneCall className="w-5 h-5 text-destructive flex-shrink-0" />
                    <div>
                        <div className="text-xs font-bold text-foreground">1.0 National Cyber Crime Helpline (Govt of India)</div>
                        <div className="text-xs text-muted-foreground">Dial <strong className="text-destructive">1930</strong> immediately if you have transferred money to a scammer.</div>
                    </div>
                </div>
                <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-lg flex items-center gap-1 hover:opacity-90 transition-opacity flex-shrink-0"
                >
                    Report at CyberCrime.gov.in
                    <ExternalLink className="w-3 h-3" />
                </a>
            </section>

            {/* Section 2: Rules */}
            <section id="golden-rules" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    2.0 5 Mandatory Cyber Safety Rules for Home Seekers
                </h2>

                <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <AlertOctagon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-foreground">2.1 Never Scan QR Codes to Receive Money</h3>
                            <p className="mt-0.5">Scanning a QR code on Google Pay, PhonePe, or Paytm enters PIN to SEND money, never to receive money. Beware of scammers asking to scan QR codes for "token fees".</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-foreground">2.2 Beware of "Army / Defense Officer" Impersonators</h3>
                            <p className="mt-0.5">Scammers frequently post stolen photos of military ID cards claiming to be transferred Army officers unable to show property in person. Never pay advance rent without in-person inspection.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-foreground">2.3 No "Gate Pass" or "Visiting Token" Charges</h3>
                            <p className="mt-0.5">Legitimate landlords and registered brokers on Renters NEVER charge money to schedule a physical flat visit or issue a gate pass.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-foreground">2.4 Verify Property Ownership</h3>
                            <p className="mt-0.5">Request maintenance bill copies, electricity meter receipts, or society possession letters to verify that the person listing is the genuine owner.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-foreground">2.5 Execute Written Rent Agreements</h3>
                            <p className="mt-0.5">Ensure all security deposits and monthly rent payments are documented in a legal rent agreement with PAN / Aadhaar details of the landlord.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Report Fraud */}
            <section id="report-fraud" className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center">
                <h3 className="font-bold text-foreground text-base mb-1">3.0 Encountered a Fraudulent Listing or Scammer?</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                    Report the listing link immediately to our Trust & Safety Response Team for 24-hour removal.
                </p>
                <Link to="/contact" className="inline-flex items-center justify-center px-6 py-2.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-xl gap-2">
                    <PhoneCall className="w-4 h-4" />
                    Report Suspicious Listing
                </Link>
            </section>
        </LegalPageLayout>
    );
}
