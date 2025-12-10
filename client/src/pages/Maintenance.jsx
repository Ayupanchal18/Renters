
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function Maintenance() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">We'll be back soon</h1>
                    <p className="text-gray-600 mb-6">
                        We're performing scheduled maintenance. Thanks for your patience.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
