
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { Link } from "react-router-dom";

export default function ComingSoon() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Coming Soon</h1>

                    <p className="text-gray-600 mb-6">
                        We're working on something great. Check back later or subscribe for
                        updates.
                    </p>

                    <Link to="/" className="text-blue-600">
                        Return Home
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
