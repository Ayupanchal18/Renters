'use client'

import { MapPin } from 'lucide-react'

export default function PropertyLocation({ property }) {

    const mapLocation = property?.mapLocation; // "23.0260736, 72.5352448"
    const [lat, lng] = mapLocation?.split(",") || [];


    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-900">Location Information</h3>
            </div>

            <div className="p-4 space-y-4">
                {/* Address */}
                <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Full Address
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                        {property.address}
                    </p>
                </div>

                {/* Nearby Landmark */}
                <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Nearby Landmark
                    </p>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {property.landmark}
                    </p>
                </div>

                {/* Map Info Box */}
                {/* <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-4 border-2 border-blue-300">
                    <div className="text-center">
                        <div className="bg-white/80 rounded-full p-3 w-fit mx-auto mb-2">
                            <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-blue-900">Map View</p>

                        <p className="text-xs text-blue-700 mt-1">
                            Lat: {lat ?? "N/A"}
                        </p>
                        <p className="text-xs text-blue-700">
                            Lng: {lng ?? "N/A"}
                        </p>
                    </div>
                </div> */}

                {/* Google Map */}
                <div className="rounded-lg overflow-hidden h-64">
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                    ></iframe>
                </div>
            </div>
        </div>
    );
}
