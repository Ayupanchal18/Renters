import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MapPin, CheckCircle, XCircle, Clock, Activity } from "lucide-react";
import { propertiesAPI } from "../lib/api";

export default function Admin() {
    const navigate = useNavigate();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");

    useEffect(() => {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            navigate("/login");
            return;
        }

        loadProperties();
    }, []);

    const loadProperties = async () => {
        try {
            setLoading(true);
            const data = await propertiesAPI.list({ limit: 100 });
            setProperties(data.items || []);
        } catch (err) {
            console.error("Failed to load properties:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await propertiesAPI.update(id, { status: "active" });
            setProperties((prev) =>
                prev.map((p) =>
                    p._id === id ? { ...p, status: "active" } : p
                )
            );
        } catch (err) {
            console.error("Failed to approve property:", err);
        }
    };

    const handleReject = async (id) => {
        try {
            await propertiesAPI.update(id, { status: "rejected" });
            setProperties((prev) =>
                prev.map((p) =>
                    p._id === id ? { ...p, status: "rejected" } : p
                )
            );
        } catch (err) {
            console.error("Failed to reject property:", err);
        }
    };

    const filteredProperties = properties.filter((p) => {
        if (filter === "pending") return p.status === "pending";
        if (filter === "approved") return p.status === "active";
        if (filter === "rejected") return p.status === "rejected";
        return true;
    });

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                            <p className="text-gray-600">Manage and verify property listings</p>
                        </div>
                        <Button
                            onClick={() => navigate("/admin/monitoring")}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Activity className="h-4 w-4 mr-2" />
                            OTP Monitoring
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-3">
                    <Button
                        onClick={() => setFilter("pending")}
                        className={filter === "pending" ? "bg-blue-600" : "bg-gray-300"}
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Pending ({properties.filter((p) => p.status === "pending").length})
                    </Button>

                    <Button
                        onClick={() => setFilter("approved")}
                        className={filter === "approved" ? "bg-green-600" : "bg-gray-300"}
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approved ({properties.filter((p) => p.status === "active").length})
                    </Button>

                    <Button
                        onClick={() => setFilter("rejected")}
                        className={filter === "rejected" ? "bg-red-600" : "bg-gray-300"}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejected ({properties.filter((p) => p.status === "rejected").length})
                    </Button>

                    <Button
                        onClick={() => setFilter("all")}
                        className={filter === "all" ? "bg-gray-600" : "bg-gray-300"}
                    >
                        All Properties ({properties.length})
                    </Button>
                </div>

                {/* Loading / Empty / List */}
                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                        No properties found in this category.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredProperties.map((property) => (
                            <Card key={property._id} className="overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex gap-6">
                                        {/* Image */}
                                        {property.images?.length > 0 && (
                                            <img
                                                src={property.images[0]}
                                                alt={property.title}
                                                className="h-32 w-40 object-cover rounded"
                                            />
                                        )}

                                        <div className="flex-1">
                                            {/* Title + Info */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-semibold">
                                                        {property.title}
                                                    </h3>

                                                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {property.address?.line}, {property.address?.city}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div
                                                        className={`text-sm font-semibold px-3 py-1 rounded inline-block${property.status === "active"
                                                            ? "bg-green-100 text-green-800"
                                                            : property.status === "rejected"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                    >
                                                        {property.status === "active"
                                                            ? "Approved"
                                                            : property.status === "rejected"
                                                                ? "Rejected"
                                                                : "Pending"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-gray-700 mt-2">
                                                {property.description}
                                            </p>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Type:</span>
                                                    <p className="font-semibold">{property.type}</p>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600">Price:</span>
                                                    <p className="font-semibold">
                                                       ₹{property.price?.toLocaleString('en-IN')}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600">Beds/Baths:</span>
                                                    <p className="font-semibold">
                                                        {property.beds || 0} / {property.baths || 0}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600">Sqft:</span>
                                                    <p className="font-semibold">
                                                        {property.sqft?.toLocaleString() || "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Approve / Reject Buttons */}
                                            {property.status === "pending" && (
                                                <div className="flex gap-3 mt-4">
                                                    <Button
                                                        onClick={() => handleApprove(property._id)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Approve
                                                    </Button>

                                                    <Button
                                                        onClick={() => handleReject(property._id)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
