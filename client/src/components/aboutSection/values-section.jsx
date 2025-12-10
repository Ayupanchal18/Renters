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
        <section className="py-20 px-4 bg-card">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-balance">
                    Our Core Values
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                    {values.map((value, i) => {
                        const Icon = value.icon;
                        return (
                            <div
                                key={i}
                                className="p-8 bg-background rounded-lg border border-border"
                            >
                                <div className="mb-4 flex items-center gap-3">
                                    <Icon className="w-10 h-10 text-primary" />
                                    <h3 className="text-2xl font-bold">{value.title}</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
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
