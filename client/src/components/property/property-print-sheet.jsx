import React from "react";
import { 
    Building2, Bed, Bath, Maximize, MapPin, Phone, Mail, 
    Calendar, CheckCircle, ShieldCheck, Heart, Home, Key, Compass, Sofa, Layers, UserCheck
} from "lucide-react";

/**
 * PropertyPrintSheet Component
 * Rendered only during print (hidden print:block)
 * Provides a clean, 100% vector-sharp printable brochure with QR code, specs, photos, amenities & owner details.
 */
export default function PropertyPrintSheet({ property }) {
    if (!property) return null;

    const propertyUrl = typeof window !== "undefined" ? window.location.href : "";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(propertyUrl)}`;

    const isRent = property.listingType === "rent" || (property.monthlyRent !== undefined && property.monthlyRent > 0);
    
    const getFormattedPrice = () => {
        if (isRent) {
            const rentVal = property.monthlyRent || property.rent || property.price || 0;
            if (!rentVal) return "Price on Request";
            return `₹${new Intl.NumberFormat("en-IN").format(rentVal)} / mo`;
        }

        const saleVal = property.sellingPrice || property.price || property.expectedPrice || property.totalPrice || 0;
        if (!saleVal) return "Price on Request";

        if (saleVal >= 10000000) {
            return `₹${(saleVal / 10000000).toFixed(2)} Cr`;
        } else if (saleVal >= 100000) {
            return `₹${(saleVal / 100000).toFixed(2)} L`;
        }
        return `₹${new Intl.NumberFormat("en-IN").format(saleVal)}`;
    };

    const priceDisplay = getFormattedPrice();

    const photos = property.photos?.slice(0, 4) || [];
    
    // Normalize amenities
    const getNormalizedAmenities = (amenities) => {
        if (!amenities) return [];
        if (Array.isArray(amenities)) {
            return amenities
                .flatMap(item => typeof item === 'string' ? item.split(',') : item)
                .map(item => typeof item === 'string' ? item.trim() : item)
                .filter(Boolean);
        }
        if (typeof amenities === 'string') {
            return amenities.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
    };

    const amenitiesList = getNormalizedAmenities(property.amenities);

    const capitalize = (str) => {
        if (!str) return "N/A";
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            return new Date(dateStr).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="hidden print:block w-full text-slate-900 bg-white p-4 text-xs leading-relaxed font-sans select-none">
            {/* Header / Branding - Page 1 Top Block */}
            <div className="print-block flex items-center justify-between pb-3 border-b-2 border-slate-800 mb-4 break-inside-avoid">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base">
                            R
                        </div>
                        <span className="text-xl font-extrabold text-blue-900 tracking-tight">Renters</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Your Trusted Real Estate Platform • www.renters.com</p>
                </div>

                <div className="flex items-center gap-4 text-right">
                    <div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold text-[10px] border border-slate-300">
                            {isRent ? "FOR RENT" : "FOR SALE"}
                        </span>
                        {property.listingNumber && (
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {property.listingNumber}</p>
                        )}
                        {property.createdAt && (
                            <p className="text-[9px] text-slate-400">Listed {formatDate(property.createdAt)}</p>
                        )}
                    </div>

                    {/* QR Code & Clickable Link for PDF Readers */}
                    <a 
                        href={propertyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex flex-col items-center group cursor-pointer text-blue-600"
                        title="Click to open online listing"
                    >
                        <img 
                            src={qrCodeUrl} 
                            alt="Scan to view online" 
                            className="w-14 h-14 rounded border border-slate-300 p-0.5"
                        />
                        <span className="text-[8px] font-bold underline mt-0.5">Click to View Online ↗</span>
                    </a>
                </div>
            </div>

            {/* Title & Price Section */}
            <div className="print-block flex items-start justify-between gap-4 mb-3 pb-3 border-b border-slate-200 break-inside-avoid">
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900 leading-snug mb-1">
                        <a href={propertyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 underline decoration-slate-300">
                            {property.title || "Property Details"}
                        </a>
                    </h1>
                    <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span>
                            {[property.address, property.locality, property.city, property.state]
                                .filter(Boolean)
                                .join(", ")}
                        </span>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="text-xl font-black text-blue-700">{priceDisplay}</div>
                    {isRent ? (
                        property.securityDeposit ? (
                            <p className="text-[10px] text-slate-500">Deposit: ₹{new Intl.NumberFormat("en-IN").format(property.securityDeposit)}</p>
                        ) : null
                    ) : (
                        property.pricePerSqFt ? (
                            <p className="text-[10px] text-slate-500">₹{property.pricePerSqFt} / sq.ft</p>
                        ) : null
                    )}
                </div>
            </div>

            {/* Photos Grid (Top 4 photos) */}
            {photos.length > 0 && (
                <div className="print-block mb-4 break-inside-avoid">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Property Photos</h3>
                    <div className={`grid ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
                        {photos.map((url, index) => (
                            <div key={index} className="h-28 rounded-lg overflow-hidden border border-slate-300 bg-slate-100">
                                <img 
                                    src={url} 
                                    alt={`Property photo ${index + 1}`} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Key Specifications Grid */}
            <div className="print-block mb-4 break-inside-avoid">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Property Specifications</h3>
                <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                        <Bed className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-[9px] text-slate-500">Bedrooms</p>
                            <p className="font-semibold text-slate-900 text-xs">{property.bedrooms || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Bath className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-[9px] text-slate-500">Bathrooms</p>
                            <p className="font-semibold text-slate-900 text-xs">{property.bathrooms || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Home className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-[9px] text-slate-500">Property Type</p>
                            <p className="font-semibold text-slate-900 text-xs">{capitalize(property.category || property.propertyType)}</p>
                        </div>
                    </div>
                    {property.builtUpArea && (
                        <div className="flex items-center gap-2">
                            <Maximize className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-[9px] text-slate-500">Built-up Area</p>
                                <p className="font-semibold text-slate-900 text-xs">{property.builtUpArea} sq.ft</p>
                            </div>
                        </div>
                    )}
                    {property.carpetArea && (
                        <div className="flex items-center gap-2">
                            <Maximize className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-[9px] text-slate-500">Carpet Area</p>
                                <p className="font-semibold text-slate-900 text-xs">{property.carpetArea} sq.ft</p>
                            </div>
                        </div>
                    )}
                    {property.furnishing && (
                        <div className="flex items-center gap-2">
                            <Sofa className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-[9px] text-slate-500">Furnishing</p>
                                <p className="font-semibold text-slate-900 text-xs">{capitalize(property.furnishing)}</p>
                            </div>
                        </div>
                    )}
                    {property.facing && (
                        <div className="flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-[9px] text-slate-500">Facing</p>
                                <p className="font-semibold text-slate-900 text-xs">{capitalize(property.facing)}</p>
                            </div>
                        </div>
                    )}
                    {property.floorNo !== undefined && (
                        <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-[9px] text-slate-500">Floor</p>
                                <p className="font-semibold text-slate-900 text-xs">{property.floorNo} of {property.totalFloors || "N/A"}</p>
                            </div>
                        </div>
                    )}
                    {isRent && property.preferredTenants && (
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-[9px] text-slate-500">Preferred Tenants</p>
                                <p className="font-semibold text-slate-900 text-xs">{capitalize(property.preferredTenants)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            {property.description && (
                <div className="print-block mb-4 break-inside-avoid">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</h3>
                    <p className="text-slate-700 text-[11px] leading-snug whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-32 overflow-hidden">
                        {property.description}
                    </p>
                </div>
            )}

            {/* Amenities Grid */}
            {amenitiesList.length > 0 && (
                <div className="print-block mb-4 break-inside-avoid">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amenities & Features</h3>
                    <div className="grid grid-cols-4 gap-1.5">
                        {amenitiesList.slice(0, 12).map((amenity, idx) => (
                            <div key={idx} className="flex items-center gap-1 p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px] font-medium text-slate-800">
                                <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">{amenity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact & Owner Box */}
            <div className="print-block p-3 bg-blue-50/80 rounded-xl border border-blue-200 mb-4 break-inside-avoid flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-blue-900 text-xs">Listed by: {property.ownerName || "Property Owner"}</h4>
                    <p className="text-[10px] text-blue-700 mt-0.5">Verified Listing Partner</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold text-slate-800">
                        {property.ownerPhone && (
                            <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-blue-600" />
                                {property.ownerPhone}
                            </span>
                        )}
                        {property.ownerEmail && (
                            <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-blue-600" />
                                {property.ownerEmail}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <span className="px-2.5 py-1 bg-blue-600 text-white font-bold text-[10px] rounded-lg shadow-sm">
                        Verified Listing
                    </span>
                </div>
            </div>

            {/* Footer & Disclaimer */}
            <div className="print-block pt-2 border-t border-slate-200 text-center text-[9px] text-slate-500 flex items-center justify-between break-inside-avoid">
                <span>Renters Real Estate Services • Support: info@renters.com | +91 98765 43210</span>
                <a 
                    href={propertyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 font-bold underline hover:text-blue-800"
                >
                    Click to Open Live Listing on Web App ↗
                </a>
            </div>
        </div>
    );
}
