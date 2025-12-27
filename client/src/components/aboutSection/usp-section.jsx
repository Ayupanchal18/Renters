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
        <section className="py-8 sm:py-12 md:py-16 px-4 bg-card">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-8 md:mb-10 text-balance">
                    Why Choose Us?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                    {usp.map((point, i) => (
                        <div key={i} className="flex items-start gap-2 sm:gap-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                                {point}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
