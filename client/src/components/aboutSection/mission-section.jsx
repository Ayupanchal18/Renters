export default function MissionSection() {
    return (
        <section className="py-20 px-4 bg-background">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-12 text-balance">
                    Our Mission
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-semibold text-primary">
                            Connecting Communities
                        </h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We bridge the gap between property owners and tenants, making the
                            rental process seamless and secure. Our platform eliminates
                            middlemen and empowers direct connections built on trust.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-2xl font-semibold text-primary">
                            Built on Values
                        </h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Every interaction on our platform is guided by principles of
                            transparency, security, and user empowerment. We believe fair
                            rental markets create thriving communities.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
