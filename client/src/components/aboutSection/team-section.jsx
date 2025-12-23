import { Code, Rocket } from "lucide-react";

export default function TeamSection() {
    return (
        <section className="py-20 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-foreground">
                    Meet The Founder
                </h2>
                <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                    The vision behind Renters
                </p>

                <div className="flex justify-center">
                    <div className="text-center max-w-sm">
                        <div className="mb-6 mx-auto w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                                <span className="text-4xl font-bold text-primary-foreground">AP</span>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold mb-2 text-foreground">Aayush Panchal</h3>
                        <p className="text-primary font-medium mb-4">Developer & Founder</p>
                        
                        <div className="flex justify-center gap-3 mb-6">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-sm text-primary">
                                <Code className="w-4 h-4" />
                                <span>Full Stack</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-sm text-primary">
                                <Rocket className="w-4 h-4" />
                                <span>Entrepreneur</span>
                            </div>
                        </div>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Passionate about building products that solve real problems. 
                            Created Renters to simplify the rental experience for everyone.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
