import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function Refund() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-bold mb-4">Refund & Cancellation Policy</h1>

                <p className="text-gray-700">
                    Details about refunds and cancellations. For demo use this placeholder
                    copy.
                </p>
            </main>

            <Footer />
        </div>
    );
}
