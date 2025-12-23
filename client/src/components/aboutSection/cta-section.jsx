export default function CTASection() {
    return (
        <section className="py-20 px-4 bg-primary/5 dark:bg-primary/10">
            <div className="max-w-4xl mx-auto text-center">

                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                    Ready to Get Started?
                </h2>

                <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                    Join thousands of property owners and tenants already using our platform
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/post-property" className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                        Post Your Property
                    </a>

                    <a href="/listings" className="px-8 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors">
                        Find Your Perfect Home
                    </a>
                </div>

            </div>
        </section>
    );
}
