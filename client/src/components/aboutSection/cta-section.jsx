export default function CTASection() {
    return (
        <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="max-w-4xl mx-auto text-center">

                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white text-balance">
                    Ready to Get Started?
                </h2>

                <p className="text-xl text-slate-300 mb-12 leading-relaxed">
                    Join thousands of property owners and tenants already using our platform
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg">
                        Post Your Property
                    </button>

                    <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors text-lg">
                        Find Your Perfect Home
                    </button>
                </div>

            </div>
        </section>
    );
}
