import React from "react";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { Accessibility, Eye, Keyboard, Smartphone, MessageSquare, Scale } from "lucide-react";
import { Link } from "react-router-dom";

const TOC = [
    { id: "accessibility-features", label: "Accessible Real Estate Features" },
    { id: "nodal-officer", label: "Accessibility Nodal Officer" },
];

export default function AccessibilityStatement() {
    return (
        <LegalPageLayout
            title="Digital Accessibility Statement"
            subtitle="Committed to equal digital access under the Rights of Persons with Disabilities Act, 2016 (RPwD Act) & WCAG 2.1 AA Guidelines."
            seoTitle="Digital Accessibility Statement (RPwD Act 2016) - Renters"
            seoDescription="Digital accessibility commitment under the Rights of Persons with Disabilities Act 2016 and WCAG 2.1 AA standards for Renters."
            icon={Accessibility}
            toc={TOC}
        >
            {/* Section 1: Features */}
            <section id="accessibility-features" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Scale className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">1.0 Accessible Real Estate Features</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <Eye className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-foreground text-sm">Contrast & Visual Modes</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">High-contrast dark mode and custom text contrast ratios adhering to WCAG 2.1 AA standard.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <Keyboard className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-foreground text-sm">Full Keyboard Navigation</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Filter menus, modal dialogs, and image carousels are 100% accessible using Tab and Enter keys.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <Smartphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-foreground text-sm">Screen Reader Compatibility</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Configured with semantic HTML5 markup, ARIA tags, and descriptive alt-text on property images.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-foreground text-sm">Font Zooming Support</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Supports browser text zoom up to 200% without breaking mobile or desktop layouts.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Officer */}
            <section id="nodal-officer" className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                <h3 className="font-bold text-foreground text-base mb-1">2.0 Accessibility Nodal Officer</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                    If you encounter an accessibility barrier or need property information in an alternative format, email our Accessibility Officer at accessibility@renters.com.
                </p>
                <Link to="/contact" className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl">
                    Contact Accessibility Officer
                </Link>
            </section>
        </LegalPageLayout>
    );
}
