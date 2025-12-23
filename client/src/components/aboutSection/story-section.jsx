export default function StorySection() {
    return (
        <section className="py-20 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-12 text-foreground">
                    Our Story
                </h2>

                <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
                    <p>
                        Founded in 2024, Renters emerged from a simple observation: the
                        rental market was broken. Complex processes, hidden fees, and lack of
                        trust made finding a home or tenant unnecessarily difficult.
                    </p>

                    <p>
                        We set out to reimagine how people rent. By leveraging technology and
                        community verification, we created a marketplace where:
                    </p>

                    <ul className="space-y-3 ml-6">
                        <li className="flex items-start gap-3">
                            <span className="text-primary font-bold">✓</span>
                            <span>
                                Property owners can list their spaces in minutes, not days
                            </span>
                        </li>

                        <li className="flex items-start gap-3">
                            <span className="text-primary font-bold">✓</span>
                            <span>
                                Tenants can find verified properties and connect directly with
                                owners
                            </span>
                        </li>

                        <li className="flex items-start gap-3">
                            <span className="text-primary font-bold">✓</span>
                            <span>
                                Verification systems build confidence and reduce friction
                            </span>
                        </li>

                        <li className="flex items-start gap-3">
                            <span className="text-primary font-bold">✓</span>
                            <span>No middlemen means fair pricing and transparent terms</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
