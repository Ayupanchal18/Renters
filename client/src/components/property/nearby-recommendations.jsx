'use client'

import { MapPin, Landmark, ShoppingBag, Building2, Bike, Stethoscope } from 'lucide-react'

export default function NearbyRecommendations({ location }) {
    const recommendations = [
        { name: 'Riverside Park', type: 'Park', distance: '0.5 km', icon: Landmark, color: 'from-green-100 to-emerald-100', iconColor: 'text-green-700' },
        { name: 'Central Library', type: 'Library', distance: '0.8 km', icon: Building2, color: 'from-purple-100 to-indigo-100', iconColor: 'text-purple-700' },
        { name: 'Downtown Mall', type: 'Shopping', distance: '1.2 km', icon: ShoppingBag, color: 'from-pink-100 to-rose-100', iconColor: 'text-pink-700' },
        { name: 'City Hospital', type: 'Hospital', distance: '0.9 km', icon: Stethoscope, color: 'from-red-100 to-orange-100', iconColor: 'text-red-700' },
        { name: 'Elementary School', type: 'School', distance: '1.1 km', icon: Building2, color: 'from-yellow-100 to-amber-100', iconColor: 'text-yellow-700' },
        { name: 'Public Transit', type: 'Transit', distance: '0.3 km', icon: Bike, color: 'from-blue-100 to-cyan-100', iconColor: 'text-blue-700' },
    ]

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-900">{location}</h3>
                <p className="text-xs font-medium text-slate-600 mt-1">Nearby Recommendations</p>
            </div>

            <div className="p-4 space-y-2.5">
                {recommendations.map((item, idx) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br${item.color} border border-slate-200/50 hover:border-slate-300 hover:shadow-sm transition-all group cursor-pointer`}
                        >
                            <div className="mt-0.5 p-2 rounded-lg bg-white/70 group-hover:bg-white transition-colors flex-shrink-0">
                                <Icon className={`w-4 h-4${item.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                <p className="text-xs font-medium text-slate-600">
                                    {item.type} • {item.distance}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
