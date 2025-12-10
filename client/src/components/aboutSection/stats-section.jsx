const stats = [
    { number: "50K+", label: "Active Listings" },
    { number: "100K+", label: "Verified Owners" },
    { number: "150+", label: "Cities Covered" },
    { number: "500K+", label: "Total Users" },
];

export default function StatsSection() {
    return (
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-balance">
                    By The Numbers
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                                {stat.number}
                            </div>
                            <div className="text-lg text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
