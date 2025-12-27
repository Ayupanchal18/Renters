export default function HeroSection() {
    return (
        <section className="relative min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background px-4 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary/5 rounded-full blur-3xl"></div>

            <div className="max-w-4xl mx-auto text-center py-8 sm:py-12 md:py-16 relative z-10">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 text-foreground">
                    About <span className="text-primary">Renters</span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-5 sm:mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
                    Connecting property owners and tenants with trust, transparency, and ease
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <a href="/listings" className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm sm:text-base hover:bg-primary/90 transition-colors">
                        Find Your Home
                    </a>

                    <a href="/post-property" className="px-6 sm:px-8 py-2.5 sm:py-3 border border-primary text-primary rounded-lg font-semibold text-sm sm:text-base hover:bg-primary/10 transition-colors">
                        Post Your Property
                    </a>
                </div>
            </div>
        </section>
    );
}
