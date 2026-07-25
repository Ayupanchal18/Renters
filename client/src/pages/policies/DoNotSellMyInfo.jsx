import React, { useState } from "react";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { Shield, Lock, EyeOff, CheckCircle2, Send, FileText, Scale } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

const TOC = [
    { id: "statutory-scope", label: "Statutory Scope & Legal Principles" },
    { id: "data-principal-rights", label: "Data Principal Rights (DPDP 2023)" },
    { id: "opt-out-form", label: "Submit Data Privacy Request Form" },
    { id: "dpo-contact", label: "Data Protection Officer Contact & SLA" },
];

export default function DoNotSellMyInfo() {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [requestType, setRequestType] = useState("opt-out");
    const [submitted, setSubmitted] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !name) {
            toast.error("Please fill in your name and email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/legal/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: requestType === "deletion" ? "dpdp_erasure" : requestType === "export" ? "dpdp_access" : requestType === "correction" ? "dpdp_correction" : requestType === "nomination" ? "dpdp_nomination" : "dpdp_opt_out",
                    applicantName: name,
                    applicantEmail: email,
                    applicantPhone: phone,
                    details: `Statutory DPDP Act 2023 Request: ${requestType}`
                })
            });
            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
                toast.success("Statutory Data Principal Request submitted successfully!");
            } else {
                toast.error(data.message || "Submission failed");
            }
        } catch (err) {
            console.error("Legal request error:", err);
            toast.error("Network error submitting request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LegalPageLayout
            title="Do Not Sell or Share My Personal Data"
            subtitle="Statutory Data Privacy Rights & Opt-Out Portal under the Digital Personal Data Protection Act, 2023 (DPDP Act) & IT Act, 2000."
            seoTitle="Do Not Sell My Info (DPDP Act 2023) - Renters"
            seoDescription="Exercise your statutory Data Principal rights under the Digital Personal Data Protection Act, 2023. Submit data opt-out, access, or erasure requests to Renters Real Estate Services Pvt. Ltd."
            icon={EyeOff}
            toc={TOC}
        >
            {/* Section 1: Statutory Scope */}
            <section id="statutory-scope" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Shield className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">1.0 Statutory Scope & Legal Principles</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/40 border border-border">
                        <h3 className="font-bold text-foreground text-sm mb-1">Zero Commercial Data Sale</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Renters Real Estate Services Pvt. Ltd. operates as a Data Fiduciary and does not sell, rent, or trade your personal phone numbers, KYC proofs, or location logs to third-party data brokers.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/40 border border-border">
                        <h3 className="font-bold text-foreground text-sm mb-1">Consent Withdrawal (Sec 6(4))</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Under Section 6(4) of the DPDP Act 2023, you have the statutory right to withdraw your consent for promotional SMS, WhatsApp property alerts, or marketing partners at any time.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/40 border border-border">
                        <h3 className="font-bold text-foreground text-sm mb-1">Right to Erasure (Sec 12)</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Section 12 grants Data Principals the right to request complete erasure of account data, search history, saved listings, and uploaded identity proofs from our production databases.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 2: Data Principal Rights */}
            <section id="data-principal-rights" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Scale className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">2.0 Data Principal Rights under Indian DPDP Act 2023</h2>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <p>
                        <strong className="text-foreground">1. Purpose Specified Processing:</strong> Personal data collected (Name, Email, Mobile, Location, Property Details) is strictly processed for providing real estate search, owner-buyer contact facilitation, and lease agreement creation.
                    </p>
                    <p>
                        <strong className="text-foreground">2. Response SLA:</strong> As mandated by DPDP Rules, all Data Principal requests will be acknowledged within 48 hours and resolved within 7 to 15 business days.
                    </p>
                    <p>
                        <strong className="text-foreground">3. Appeal to Data Protection Board of India:</strong> If your grievance is not resolved to your satisfaction by our Data Protection Officer, you have the right to file an appeal before the <em>Data Protection Board of India</em>.
                    </p>
                </div>
            </section>

            {/* Section 3: Form */}
            <section id="opt-out-form" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">3.0 Submit Data Principal Request</h2>
                </div>

                {submitted ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Request Registered (Ref: DPDP-2026-REG)</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                            We have logged your request. Our Data Protection Officer will process your application within 7 business days and notify <span className="font-semibold text-foreground">{email}</span>.
                        </p>
                        <Button onClick={() => setSubmitted(false)} variant="outline">
                            Submit Another Statutory Request
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground mb-1 block">Full Legal Name *</label>
                                <Input
                                    type="text"
                                    required
                                    placeholder="Enter your full legal name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-10 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground mb-1 block">Registered Email Address *</label>
                                <Input
                                    type="email"
                                    required
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-10 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground mb-1 block">Registered Mobile (+91) *</label>
                                <Input
                                    type="tel"
                                    required
                                    placeholder="+91 98765 43210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-10 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground mb-1 block">Statutory Right to Exercise</label>
                                <select
                                    value={requestType}
                                    onChange={(e) => setRequestType(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="opt-out">Withdraw Consent for Data Sharing & Marketing (Sec 6)</option>
                                    <option value="deletion">Right to Erasure & Account Deletion (Sec 12)</option>
                                    <option value="export">Right to Access & Summary of Personal Data (Sec 11)</option>
                                    <option value="correction">Right to Correction of Inaccurate Data (Sec 12)</option>
                                    <option value="nomination">Nominate Representative in Case of Incapacity (Sec 14)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full sm:w-auto h-11 px-8 text-sm font-semibold gap-2">
                                <Send className="w-4 h-4" />
                                Submit Data Principal Request
                            </Button>
                        </div>
                    </form>
                )}
            </section>

            {/* Section 4: DPO Contact */}
            <section id="dpo-contact" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs text-center text-xs text-muted-foreground space-y-2">
                <h3 className="font-bold text-foreground text-sm">4.0 Designated Data Protection Officer (DPO)</h3>
                <p className="text-foreground font-medium">Renters Real Estate Services Pvt. Ltd. • Corporate Office: Mumbai, Maharashtra, India</p>
                <p>DPO Email: <a href="mailto:dpo@renters.com" className="text-primary font-bold underline">dpo@renters.com</a> | Grievance Hotline: +91 98765 43210</p>
                <p className="text-[11px]">Statutory SLA: Acknowledgment within 48 hours • Resolution within 7-15 business days.</p>
            </section>
        </LegalPageLayout>
    );
}
