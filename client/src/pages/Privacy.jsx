import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>

                <p className="text-gray-700">
                    This page explains how we collect and use personal data. For demo
                    purposes, this is sample text. In production, replace with legal copy.
                </p>
            </main>

            <Footer />
        </div>
    );
}
