
import { Heart, MapPin, Bed, Bath, Square, Phone, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function PropertyCard({ property, viewMode }) {

    const navigate = useNavigate()

    const [isSaved, setIsSaved] = useState(false);

    const handleclick = (slug) => {
        navigate(`/properties/${slug}`)
    }

    /* ------------------------- LIST VIEW ------------------------- */
    if (viewMode === "list") {
        return (
            <div className="flex gap-5 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300">

                {/* Image */}
                <div className="w-64 h-40 flex-shrink-0 relative overflow-hidden bg-gray-100">
                    <img
                        // src={`http://localhost:8080/${property.photos[0]}`}
                        src={`http://localhost:8080${property.photos[0]}`}

                        alt={property.title}
                        className="w-full h-full object-cover"
                    />

                    {property.featured && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                            Featured
                        </div>
                    )}

                    {property.verified && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                            Verified
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 p-5 flex flex-col justify-between"  >
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2" onClick={() => handleclick(property.slug)}>{property.title}</h3>

                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            {property.address}
                        </div>

                        <div className="flex gap-6 text-sm text-gray-700">
                            <span className="flex items-center gap-1.5 font-medium">
                                <Bed className="w-4 h-4 text-indigo-500" /> {property.bedrooms} Beds
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                                <Bath className="w-4 h-4 text-indigo-500" /> {property.bathrooms} Baths
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                                <Square className="w-4 h-4 text-indigo-500" /> {property.builtUpArea} sqft
                            </span>
                        </div>

                        {property.amenities?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {property.amenities.map((amenity) => (
                                    <span
                                        key={amenity}
                                        className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium"
                                    >
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-3">
                        <div className="text-3xl font-bold text-indigo-600">
                            ${property.monthlyRent}
                            <span className="text-sm text-gray-500 font-normal">/mo</span>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSaved(!isSaved)}
                                className={isSaved ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100" : "border-gray-300 hover:bg-gray-50"}
                            >
                                <Heart className={`w-4 h-4${isSaved ? "fill-current" : ""}`} />
                            </Button>

                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Contact
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ------------------------- GRID VIEW ------------------------- */
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 group" onClick={() => handleclick(property.slug)}>

            {/* Image */}
            <div className="relative overflow-hidden bg-gray-100 h-48">
                <img
                    src={`http://localhost:8080${property.photos[0]}`}

                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between">
                    {/* {property.featured && (
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                            Featured
                        </div>
                    )} */}

                    {property.verified && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                            Verified
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 hover:bg-white flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                >
                    <Heart
                        className={`w-5 h-5${isSaved ? "fill-rose-500 text-rose-500" : "text-gray-700"
                            }`}
                    />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-1" >
                <div>
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-2" >
                        {property.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        {property.address}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-3 py-2 border-y border-gray-200 text-sm text-gray-700">
                    <div className="flex items-center gap-1.5 font-medium">
                        <Bed className="w-4 h-4 text-indigo-500" /> {property.bedrooms}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                        <Bath className="w-4 h-4 text-indigo-500" /> {property.bathrooms}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                        <Square className="w-4 h-4 text-indigo-500" /> {property.builtUpArea}
                    </div>
                </div>

                {/* Owner */}
                {property.owner && (
                    <div className="flex items-center gap-3 py-1 ">
                        <img
                            src={"https://dummyimage.com/40x30/edeef0/555"}
                            alt={property.ownerName}
                            className="w-9 h-9 rounded-full ring-2 ring-gray-100"
                        />
                        <span className="text-sm font-semibold text-gray-800 flex-1">
                            {property.ownerName}
                        </span>
                    </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-indigo-600">
                            ${property.monthlyRent}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">per month</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ">
                    <Button variant="outline" size="sm" className="flex-1 text-xs border-gray-300 hover:bg-gray-50">
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        Call
                    </Button>

                    <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                        <Mail className="w-3.5 h-3.5 mr-1.5" />
                        Message
                    </Button>
                </div>
            </div>
        </div>
    );
}