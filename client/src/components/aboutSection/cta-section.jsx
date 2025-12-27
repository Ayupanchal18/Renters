export default function CTASection() {
    return (
        <section className="py-8 sm:py-10 md:py-14 px-4 bg-primary/5 dark:bg-primary/10">
            <div className="max-w-4xl mx-auto text-center">

                <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
                    Ready to Get Started?
                </h2>

                <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-5 sm:mb-6 md:mb-8 leading-relaxed max-w-2xl mx-auto">
                    Join thousands of property owners and tenants already using our platform
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <a href="/post-property" className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm sm:text-base hover:bg-primary/90 transition-colors">
                        Post Your Property
                    </a>

                    <a href="/listings" className="px-6 sm:px-8 py-2.5 sm:py-3 border border-primary text-primary rounded-lg font-semibold text-sm sm:text-base hover:bg-primary/10 transition-colors">
                        Find Your Perfect Home
                    </a>
                </div>

            </div>
        </section>
    );
}
