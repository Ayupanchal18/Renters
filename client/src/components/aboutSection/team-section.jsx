import { Code, Rocket } from "lucide-react";

export default function TeamSection() {
    return (
        <section className="py-8 sm:py-12 md:py-16 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-center text-foreground">
                    Meet The Founder
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto">
                    The vision behind Renters
                </p>

                <div className="flex justify-center">
                    <div className="text-center max-w-sm">
                        <div className="mb-4 sm:mb-5 mx-auto w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground">AP</span>
                            </div>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-foreground">Aayush Panchal</h3>
                        <p className="text-primary font-medium text-sm sm:text-base mb-3 sm:mb-4">Developer & Founder</p>
                        
                        <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full text-xs sm:text-sm text-primary">
                                <Code className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Full Stack</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full text-xs sm:text-sm text-primary">
                                <Rocket className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Entrepreneur</span>
                            </div>
                        </div>

                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                            Passionate about building products that solve real problems. 
                            Created Renters to simplify the rental experience for everyone.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
