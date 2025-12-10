import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useLocation, Link } from "react-router-dom";
import { properties } from "../data/mock";
import { Card, CardContent } from "../components/ui/card";
import { MapPin } from "lucide-react";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function SearchResults() {
    const query = useQuery();
    const city = query.get("city") || "";

    const results = city
        ? properties.filter(
            (p) => p.city?.toLowerCase() === city.toLowerCase()
        )
        : properties;

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-bold mb-2">Search Results</h1>

                <p className="text-gray-600 mb-6">
                    {results.length} properties found
                    {city ? ` in${city}.` : "."}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {results.map((p) => (
                        <Card key={p.id}>
                            <div className="h-56 relative overflow-hidden">
                                <img
                                    src={p.images[0]}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <CardContent>
                                <h3 className="font-semibold">{p.title}</h3>

                                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                    <MapPin className="h-4 w-4" />
                                    {p.location}
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-blue-600 font-bold">
                                        {p.priceLabel}
                                    </div>

                                    <Link
                                        to={`/property/${p.id}`}
                                        className="text-sm text-blue-600"
                                    >
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
