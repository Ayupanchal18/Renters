import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function Terms() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-bold mb-4">Terms & Conditions</h1>

                <p className="text-gray-700">
                    Standard terms and conditions. Replace with your legal text when
                    launching.
                </p>
            </main>

            <Footer />
        </div>
    );
}
