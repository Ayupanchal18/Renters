import { useState, useEffect } from 'react';
import { Building2, Home, ShoppingCart, Users, Hotel, Loader2 } from 'lucide-react';

// Icon mapping for categories
const ICON_MAP = {
    Home: Home,
    Building2: Building2,
    Users: Users,
    Hotel: Hotel,
    ShoppingCart: ShoppingCart
};

// Fallback categories if API fails
const FALLBACK_CATEGORIES = [
    { id: "room", label: "Room", description: "Single or shared rooms", icon: Home },
    { id: "flat", label: "Flat / Apartment", description: "1BHK, 2BHK, 3BHK flats", icon: Building2 },
    { id: "house", label: "House", description: "Independent house or villa", icon: Home },
    { id: "pg", label: "PG (Paying Guest)", description: "Paying guest accommodation", icon: Users },
    { id: "hostel", label: "Hostel", description: "Hostel rooms and beds", icon: Hotel },
    { id: "commercial", label: "Commercial", description: "Shop, Office, Warehouse", icon: ShoppingCart },
];

export default function StepCategory({ formData, setFormData, validationErrors }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    const mapped = data.data.map(cat => ({
                        id: cat.slug,
                        label: cat.name,
                        description: cat.description || '',
                        icon: ICON_MAP[cat.icon] || Home
                    }));
                    setCategories(mapped);
                } else {
                    setCategories(FALLBACK_CATEGORIES);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories(FALLBACK_CATEGORIES);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">What are you listing?</h2>
            <p className="text-muted-foreground mb-8">Select the property type that best describes your listing</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = formData.category === category.id;

                    return (
                        <button
                            key={category.id}
                            onClick={() => setFormData({ ...formData, category: category.id })}
                            className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 text-left ${isSelected
                                    ? "border-primary bg-primary/10 shadow-lg"
                                    : "border-border bg-card hover:border-primary/50"
                                }`}
                        >
                            <Icon
                                size={32}
                                className={isSelected ? "text-primary mb-3" : "text-muted-foreground mb-3"}
                            />
                            <h3 className={`font-semibold text-lg ${isSelected ? "text-primary" : "text-foreground"}`}>
                                {category.label}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        </button>
                    );
                })}
            </div>

            {validationErrors.category && (
                <p className="text-destructive text-sm mt-4">{validationErrors.category}</p>
            )}
        </div>
    );
}
