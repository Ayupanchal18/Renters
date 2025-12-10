import { Building2, Home, ShoppingCart } from 'lucide-react';
import { Card } from "../ui/card";

const CATEGORIES = [
    {
        id: "room",
        label: "Room / PG / Hostel",
        description: "Single or shared rooms",
        icon: Home,
    },
    {
        id: "apartment",
        label: "Apartment / Flat / House",
        description: "Multi-bedroom residential",
        icon: Building2,
    },
    {
        id: "commercial",
        label: "Commercial",
        description: "Shop, Office, Hall",
        icon: ShoppingCart,
    },
];

export default function StepCategory({ formData, setFormData, validationErrors }) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">What are you listing?</h2>
            <p className="text-slate-600 mb-8">Select the property type that best describes your listing</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isSelected = formData.category === category.id;

                    return (
                        <button
                            key={category.id}
                            onClick={() => setFormData({ ...formData, category: category.id })}
                            className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 text-left${isSelected
                                    ? "border-blue-600 bg-blue-50 shadow-lg"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                        >
                            <Icon
                                size={32}
                                className={isSelected ? "text-blue-600 mb-3" : "text-slate-400 mb-3"}
                            />
                            <h3 className={`font-semibold text-lg${isSelected ? "text-blue-600" : "text-slate-900"}`}>
                                {category.label}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                        </button>
                    );
                })}
            </div>

            {validationErrors.category && (
                <p className="text-red-600 text-sm mt-4">{validationErrors.category}</p>
            )}
        </div>
    );
}
