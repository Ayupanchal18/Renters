import React, { useState } from "react";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { Copyright, FileCheck, Send, Scale } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";

const TOC = [
    { id: "ip-protection", label: "Intellectual Property Rights" },
    { id: "takedown-notice", label: "Statutory Takedown Requirements" },
    { id: "takedown-form", label: "Submit Copyright Takedown Notice" },
    { id: "nodal-officer", label: "Designated Copyright Nodal Officer" },
];

export default function DMCAPolicy() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [contentUrl, setContentUrl] = useState("");
    const [details, setDetails] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !contentUrl || !details) {
            toast.error("Please complete all required statutory fields.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/legal/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "dmca_takedown",
                    applicantName: name,
                    applicantEmail: email,
                    targetUrl: contentUrl,
                    details: details
                })
            });
            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
                toast.success("Copyright Takedown Notice logged under IT Rules 2021.");
            } else {
                toast.error(data.message || "Submission failed");
            }
        } catch (err) {
            console.error("DMCA request error:", err);
            toast.error("Network error submitting takedown notice");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LegalPageLayout
            title="Copyright & DMCA Takedown Policy"
            subtitle="Statutory Copyright Protection under the Indian Copyright Act, 1957 & Rule 3 of the IT Intermediary Guidelines Rules, 2021."
            seoTitle="DMCA & Copyright Infringement Policy (Copyright Act 1957) - Renters"
            seoDescription="Digital Millennium Copyright Act and Indian Copyright Act 1957 statutory takedown notice procedure for Renters real estate platform."
            icon={Copyright}
            toc={TOC}
        >
            {/* Section 1: IP Protection */}
            <section id="ip-protection" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Scale className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">1.0 Intellectual Property Rights & Ownership</h2>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    All photographs, 3D floor plans, drone footage, video walkthroughs, and promotional content uploaded onto Renters remain the intellectual property of their respective creators, licensed agents, or property owners. Unauthorised scraping or re-publishing is punishable under Section 63 of the Indian Copyright Act, 1957.
                </p>
            </section>

            {/* Section 2: Takedown Requirements */}
            <section id="takedown-notice" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
                <h2 className="text-xl font-bold text-foreground">2.0 Statutory Takedown Requirements & SLA</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    To request removal of infringing media, the copyright holder or authorized legal representative must submit a statutory notice containing:
                </p>
                <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1">
                    <li>Identification of the copyrighted photo, blueprint, or video claimed to be infringed.</li>
                    <li>Exact URL on Renters.com hosting the unauthorized material.</li>
                    <li>Full legal name, phone number, address, and email of the copyright owner.</li>
                    <li>A statement under penalty of perjury that the claimant is the lawful copyright owner.</li>
                </ul>
                <p className="text-xs sm:text-sm text-muted-foreground pt-2">
                    Pursuant to Rule 3(1)(d) of the IT (Intermediary Guidelines) Rules 2021, Renters will disable access to the infringing material within <strong>24 to 36 hours</strong> upon receipt of a valid notice.
                </p>
            </section>

            {/* Section 3: Form */}
            <section id="takedown-form" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-md">
                <h2 className="text-xl font-bold text-foreground mb-4">3.0 Submit Statutory Copyright Takedown Notice</h2>
                {submitted ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-semibold text-center">
                        Notice logged (Ref: DMCA-2026-N). Our Copyright Nodal Officer will verify the URL and disable access within 36 hours.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground mb-1 block">Full Legal Name / Copyright Owner *</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Legal Name" className="h-10 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground mb-1 block">Official Email Address *</label>
                                <Input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="legal@domain.com" className="h-10 text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Infringing Property Listing URL *</label>
                            <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} required placeholder="https://renters.com/rent/..." className="h-10 text-sm" />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Copyright Claim Details & Proof of Ownership *</label>
                            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} required placeholder="Specify original creation date, registration numbers, or image links..." rows={4} className="text-sm" />
                        </div>

                        <Button type="submit" className="h-10 px-6 text-sm font-semibold gap-2">
                            <Send className="w-4 h-4" />
                            Submit Statutory Takedown Notice
                        </Button>
                    </form>
                )}
            </section>

            {/* Section 4: Nodal Officer */}
            <section id="nodal-officer" className="p-4 bg-muted/40 border border-border rounded-xl text-center text-xs text-muted-foreground">
                <strong>4.0 Designated Copyright Nodal Officer:</strong> Renters Legal Team • Email: <a href="mailto:dmca@renters.com" className="text-primary font-bold underline">dmca@renters.com</a> • Address: Mumbai, India
            </section>
        </LegalPageLayout>
    );
}
