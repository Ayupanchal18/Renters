import { CheckCircle } from "lucide-react";

const usp = [
    "Verified owners & properties for peace of mind",
    "Lightning-fast property posting process",
    "Direct owner-tenant connection without middlemen",
    "Secure encrypted communication channels",
    "Transparent pricing with no hidden fees",
    "Community-driven trust system",
];

export default function USPSection() {
    return (
        <section className="py-20 px-4 bg-card">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-12 text-balance">
                    Why Choose Us?
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    {usp.map((point, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {point}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
