const stats = [
    { number: "50K+", label: "Active Listings" },
    { number: "100K+", label: "Verified Owners" },
    { number: "150+", label: "Cities Covered" },
    { number: "500K+", label: "Total Users" },
];

export default function StatsSection() {
    return (
        <section className="py-8 sm:py-12 md:py-16 px-4 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-10 md:mb-12 text-center text-balance">
                    By The Numbers
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary mb-1">
                                {stat.number}
                            </div>
                            <div className="text-sm sm:text-base md:text-lg text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
