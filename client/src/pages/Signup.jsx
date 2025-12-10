import SignupForm from "../components/auth/signup-form";
import Navbar from './../components/Navbar';
import Footer from './../components/Footer';

export const metadata = {
    title: "Create Account | EstateHub",
    description: "Join EstateHub to list properties and save favorites.",
};

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex flex-col">
            {/* Top Header */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-xl">
                    {/* Card Wrapper */}
                    <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
                        {/* Title Block */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">
                                Create Your Account
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Join EstateHub to discover properties and connect with agents.
                            </p>
                        </div>

                        {/* Signup Form Component */}
                        <SignupForm />
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 text-center text-xs text-muted-foreground">
                        <p>🔒 Your information is secure and encrypted</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
