import SignupForm from "../components/auth/signup-form";
import Navbar from './../components/Navbar';
import Footer from './../components/Footer';

export const metadata = {
    title: "Create Account | Renters",
    description: "Join Renters to list properties and save favorites.",
};

export default function SignupPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <Navbar />
            
            {/* Background Pattern */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            </div>
            
            <main className="flex-1 flex items-center justify-center relative z-10 overflow-y-auto py-4 md:py-6">
                <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto md:rounded-3xl shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl border border-border/50">
                    
                    {/* Left Column: Brand/Marketing (Hidden on Mobile) */}
                    <div className="hidden md:flex flex-1 bg-gradient-to-br from-secondary via-secondary/90 to-primary/80 p-6 text-white flex-col justify-between relative overflow-hidden">
                        {/* Abstract shapes for background */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-20 -mt-20 blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mb-32 blur-3xl" />
                        
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                    <img src="/Logo2.png" alt="Renters" className="w-8 h-8 object-contain brightness-0 invert" />
                                </div>
                                <span className="text-2xl font-bold tracking-tight">Renters</span>
                            </div>
                            
                            <h2 className="text-3xl font-extrabold mb-4 leading-tight tracking-tight">
                                Join the <br />
                                <span className="text-white/80">community.</span>
                            </h2>
                            <p className="text-lg text-white/70 max-w-md leading-relaxed">
                                Create an account to save your favorite properties, get instant alerts, and chat directly with verified agents.
                            </p>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-xl">🏠</span>
                                </div>
                                <div>
                                    <p className="font-semibold">Save Properties</p>
                                    <p className="text-sm text-white/60">Keep track of places you love</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-xl">🔔</span>
                                </div>
                                <div>
                                    <p className="font-semibold">Instant Alerts</p>
                                    <p className="text-sm text-white/60">Be the first to know about new deals</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Signup Form */}
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[85vh]">
                        <div className="w-full max-w-xl mx-auto">
                            <SignupForm />
                        </div>
                    </div>
                </div>
            </main>

            <div className="py-4 text-center text-xs text-muted-foreground opacity-50">
                © {new Date().getFullYear()} Renters. All rights reserved.
            </div>
        </div>
    );
}
