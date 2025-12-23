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
            
            <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
                <SignupForm />
            </main>
            <Footer />
        </div>
    );
}
