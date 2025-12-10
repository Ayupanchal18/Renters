import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { properties } from "../data/mock";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "react-router-dom";

export default function Wishlist() {
    const wishlist = properties.slice(0, 2);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-bold mb-4">Wishlist</h1>

                <p className="text-gray-600 mb-6">
                    Properties you've saved to view later
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlist.map((p) => (
                        <Card key={p.id}>
                            <div className="h-48 overflow-hidden">
                                <img
                                    src={p.images[0]}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <CardContent>
                                <h3 className="font-semibold">{p.title}</h3>

                                <div className="text-gray-600 mt-2">{p.location}</div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-blue-600 font-bold">
                                        {p.priceLabel}
                                    </div>

                                    <Link to={`/property/${p.id}`} className="text-blue-600">
                                        View
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
