export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-4xl mx-auto text-center py-20">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
                    About <span className="text-primary">Us</span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance leading-relaxed">
                    Connecting property owners and tenants with trust, transparency, and ease
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                        Find Your Home
                    </button>

                    <button className="px-8 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors">
                        Post Your Property
                    </button>
                </div>
            </div>
        </section>
    );
}
