import { Home, ShoppingBag } from 'lucide-react';
import { LISTING_TYPES, LISTING_TYPE_LABELS } from '@shared/propertyTypes';

const LISTING_OPTIONS = [
    {
        id: LISTING_TYPES.RENT,
        label: 'Rent Property',
        description: 'List your property for monthly rent',
        icon: Home,
        features: ['Monthly rent pricing', 'Security deposit', 'Tenant preferences']
    },
    {
        id: LISTING_TYPES.BUY,
        label: 'Sell Property',
        description: 'List your property for sale',
        icon: ShoppingBag,
        features: ['Selling price', 'Price per sqft', 'Possession status']
    }
];

export default function StepListingType({ formData, setFormData, validationErrors }) {
    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">What would you like to do?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Choose whether you want to rent or sell your property</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {LISTING_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.listingType === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => setFormData({ ...formData, listingType: option.id })}
                            className={`p-5 sm:p-8 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] text-left ${
                                isSelected
                                    ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
                                    : "border-border bg-card hover:border-primary/50"
                            }`}
                        >
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className={`p-2.5 sm:p-3 rounded-lg ${
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                    <Icon size={24} className="sm:w-7 sm:h-7" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-semibold text-lg sm:text-xl mb-1 ${
                                        isSelected ? "text-primary" : "text-foreground"
                                    }`}>
                                        {option.label}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{option.description}</p>
                                    <ul className="space-y-1">
                                        {option.features.map((feature, idx) => (
                                            <li key={idx} className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                    isSelected ? "bg-primary" : "bg-muted-foreground"
                                                }`} />
                                                <span className="truncate">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {isSelected && (
                                <div className="mt-4 pt-4 border-t border-primary/20">
                                    <span className="text-sm font-medium text-primary">✓ Selected</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {validationErrors.listingType && (
                <p className="text-destructive text-xs sm:text-sm mt-4">{validationErrors.listingType}</p>
            )}
        </div>
    );
}
