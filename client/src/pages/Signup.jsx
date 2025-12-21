import SignupForm from "../components/auth/signup-form";
import Navbar from './../components/Navbar';
import Footer from './../components/Footer';

export const metadata = {
    title: "Create Account | EstateHub",
    description: "Join EstateHub to list properties and save favorites.",
};

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <SignupForm />
            </main>
            <Footer />
        </div>
    );
}
