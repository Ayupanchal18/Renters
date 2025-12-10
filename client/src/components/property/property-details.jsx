'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function PropertyDetails({ property }) {
    const [expandedSections, setExpandedSections] = useState({
        overview: true,
        amenities: true,
        financial: true,
    })

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }))
    }


    function formatDate(timestamp) {
        const date = new Date(timestamp);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    function capitalizeFirstLetter(text) {
        if (!text) return "";
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    return (
        <div className="space-y-3">
            {/* Overview Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <button
                    onClick={() => toggleSection('overview')}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <span className="font-bold text-slate-900">Overview</span>
                    <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform${expandedSections.overview ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {expandedSections.overview && (
                    <div className="px-4 py-4 border-t border-slate-200 space-y-4">
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {property.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Property Type
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {capitalizeFirstLetter(property.propertyType)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Category
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {capitalizeFirstLetter(property.category)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Furnishing
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {capitalizeFirstLetter(property.furnishing)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Built-up Area
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {property.builtUpArea} sqft
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Financial Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <button
                    onClick={() => toggleSection('financial')}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <span className="font-bold text-slate-900">Financial Details</span>
                    <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform${expandedSections.financial ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {expandedSections.financial && (
                    <div className="px-4 py-4 border-t border-slate-200 space-y-3">
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                                Monthly Rent
                            </p>
                            <p className="text-2xl font-bold text-amber-900">
                                ${property.monthlyRent}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                                    Security
                                </p>
                                <p className="text-lg font-bold text-blue-900">
                                    ${property.securityDeposit}
                                </p>
                            </div>

                            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">
                                    Maintenance
                                </p>
                                <p className="text-lg font-bold text-emerald-900">
                                    ${property.maintenanceCharge}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-900/5 border border-slate-300 rounded-lg p-3">
                            <p className="text-sm text-slate-900">
                                <span className="font-bold">Total Monthly: </span>
                                <span className="font-bold text-amber-700">
                                    ${(property.monthlyRent + property.maintenanceCharge).toLocaleString()}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Amenities Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <button
                    onClick={() => toggleSection('amenities')}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <span className="font-bold text-slate-900">Property Features</span>
                    <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform${expandedSections.amenities ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {expandedSections.amenities && (
                    <div className="px-4 py-4 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                'Air Conditioning',
                                'Parking',
                                'Security System',
                                'Gym',
                                'Swimming Pool',
                                'Garden',
                            ].map((amenity) => (
                                <div
                                    key={amenity}
                                    className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group"
                                >
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 group-hover:scale-150 transition-transform" />
                                    <span className="text-sm font-medium text-slate-900">
                                        {amenity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
