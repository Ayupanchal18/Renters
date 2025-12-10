import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { faqs } from "../data/mock";

export default function FAQs() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>

                <div className="space-y-4">
                    {faqs.map((f, i) => (
                        <div key={i} className="border rounded p-4">
                            <h3 className="font-semibold">{f.q}</h3>
                            <p className="text-gray-600 mt-2">{f.a}</p>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
