const team = [
    {
        name: "Sarah Chen",
        role: "Co-Founder & CEO",
        image: "/professional-woman-diverse.png",
    },
    {
        name: "Marcus Johnson",
        role: "Co-Founder & CTO",
        image: "/professional-man.jpg",
    },
    {
        name: "Priya Patel",
        role: "Head of Operations",
        image: "/professional-woman-diverse.png",
    },
    {
        name: "James Wilson",
        role: "Head of Community",
        image: "/professional-man.jpg",
    },
];

export default function TeamSection() {
    return (
        <section className="py-20 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-balance">
                    Meet The Team
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {team.map((member, i) => (
                        <div key={i} className="text-center group">
                            <div className="mb-6 rounded-lg overflow-hidden border border-border group-hover:border-primary/50 transition-colors">
                                <img
                                    src={member.image || "/placeholder.svg"}
                                    alt={member.name}
                                    className="w-full aspect-square object-cover"
                                />
                            </div>

                            <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                            <p className="text-muted-foreground">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
