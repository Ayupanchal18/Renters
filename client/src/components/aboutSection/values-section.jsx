import { CheckCircle, Eye, Lock, Zap } from "lucide-react";

const values = [
    {
        icon: Eye,
        title: "Transparency",
        description:
            "Clear pricing, honest listings, and full visibility into every transaction",
    },
    {
        icon: Zap,
        title: "Simplicity",
        description:
            "Intuitive design that makes renting simple, not complicated",
    },
    {
        icon: Lock,
        title: "Security & Verification",
        description:
            "Verified users and secure communications protect all parties",
    },
    {
        icon: CheckCircle,
        title: "User-First Design",
        description:
            "Every feature built with your needs and feedback in mind",
    },
];

export default function ValuesSection() {
    return (
        <section className="py-8 sm:py-12 md:py-16 px-4 bg-card">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-10 md:mb-12 text-center text-balance">
                    Our Core Values
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {values.map((value, i) => {
                        const Icon = value.icon;
                        return (
                            <div
                                key={i}
                                className="p-4 sm:p-6 bg-background rounded-lg border border-border"
                            >
                                <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary" />
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{value.title}</h3>
                                </div>
                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
