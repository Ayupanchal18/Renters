import { Eye, MapPin, Edit2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function PropertiesSection({ properties }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Your Properties</h3>

            {properties && properties.length > 0 ? (
                <div className="space-y-3">
                    {properties.map((prop) => (
                        <div
                            key={prop._id}
                            className="group border border-gray-200 hover:border-primary rounded-lg p-4 flex items-center justify-between transition-all hover:shadow-md"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                {prop.image && (
                                    <img
                                        src={prop.image || "/placeholder.svg"}
                                        alt={prop.title}
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                )}

                                <div>
                                    <h4 className="font-semibold text-gray-900 text-balance">
                                        {prop.title}
                                    </h4>

                                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                                        <MapPin size={14} />
                                        <span>{prop.address?.city || "Unknown"}</span>

                                        <span className="text-gray-400">•</span>

                                        <Eye size={14} />
                                        <span>{prop.views} views</span>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to={`/properties/${prop._id}`}
                                className="flex items-center gap-2 text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors font-semibold text-sm"
                            >
                                <Edit2 size={16} />
                                View
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">No properties yet</p>
                    <Link to="/post-property" className="text-primary font-semibold hover:underline">
                        Post your first property →
                    </Link>
                </div>
            )}
        </div>
    );
}
