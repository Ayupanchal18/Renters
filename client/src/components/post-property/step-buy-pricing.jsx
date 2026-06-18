import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { IndianRupee } from 'lucide-react';
import { POSSESSION_STATUS, POSSESSION_STATUS_LABELS, OWNERSHIP_TYPES, OWNERSHIP_TYPE_LABELS } from '@shared/propertyTypes';

export default function StepBuyPricing({ formData, setFormData, validationErrors }) {
    return (
        <div className="space-y-5 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <IndianRupee size={24} className="text-success" />
                Sale Pricing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Selling Price */}
                <div className="space-y-2">
                    <Label htmlFor="sellingPrice" className="text-foreground font-semibold text-sm sm:text-base">Selling Price *</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="sellingPrice"
                            type="number"
                            placeholder="0"
                            value={formData.sellingPrice}
                            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                            className={`pl-8 text-sm sm:text-base ${validationErrors.sellingPrice ? "border-destructive" : ""}`}
                        />
                    </div>
                    {validationErrors.sellingPrice && (
                        <p className="text-destructive text-xs sm:text-sm">{validationErrors.sellingPrice}</p>
                    )}
                </div>

                {/* Price Per Sqft */}
                <div className="space-y-2">
                    <Label htmlFor="pricePerSqft" className="text-foreground font-semibold text-sm sm:text-base">Price Per Sqft</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="pricePerSqft"
                            type="number"
                            placeholder="0"
                            value={formData.pricePerSqft}
                            onChange={(e) => setFormData({ ...formData, pricePerSqft: e.target.value })}
                            className="pl-8 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Possession Status */}
                <div className="space-y-2">
                    <Label htmlFor="possessionStatus" className="text-foreground font-semibold text-sm sm:text-base">Possession Status</Label>
                    <select
                        id="possessionStatus"
                        value={formData.possessionStatus}
                        onChange={(e) => setFormData({ ...formData, possessionStatus: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm sm:text-base"
                    >
                        {POSSESSION_STATUS.map((status) => (
                            <option key={status} value={status}>
                                {POSSESSION_STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Booking Amount */}
                <div className="space-y-2">
                    <Label htmlFor="bookingAmount" className="text-foreground font-semibold text-sm sm:text-base">Booking Amount</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="bookingAmount"
                            type="number"
                            placeholder="0"
                            value={formData.bookingAmount}
                            onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                            className="pl-8 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Ownership Type */}
            <div className="space-y-3">
                <Label className="text-foreground font-semibold text-sm sm:text-base">Ownership Type</Label>
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
                    {OWNERSHIP_TYPES.map((type) => (
                        <label
                            key={type}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.ownershipType === type
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                            }`}
                        >
                            <input
                                type="radio"
                                name="ownershipType"
                                value={type}
                                checked={formData.ownershipType === type}
                                onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                                className="w-4 h-4 text-primary accent-primary"
                            />
                            <span className="text-foreground text-sm sm:text-base">
                                {OWNERSHIP_TYPE_LABELS[type]}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* RERA Registration Number — shown for under-construction */}
            {formData.possessionStatus === 'under_construction' && (
                <div className="space-y-2">
                    <Label htmlFor="reraNumber" className="text-foreground font-semibold text-sm sm:text-base">
                        RERA Registration Number
                    </Label>
                    <Input
                        id="reraNumber"
                        placeholder="e.g., P52100003060"
                        value={formData.reraNumber || ''}
                        onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                        className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                        RERA number is required by law for under-construction properties in India.
                    </p>
                </div>
            )}

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.loanAvailable}
                        onChange={(e) => setFormData({ ...formData, loanAvailable: e.target.checked })}
                        className="w-5 h-5 rounded border-input text-primary accent-primary"
                    />
                    <span className="text-foreground font-medium text-sm sm:text-base">Loan available for this property</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.priceNegotiable || false}
                        onChange={(e) => setFormData({ ...formData, priceNegotiable: e.target.checked })}
                        className="w-5 h-5 rounded border-input text-primary accent-primary"
                    />
                    <span className="text-foreground font-medium text-sm sm:text-base">Price is negotiable</span>
                </label>
            </div>
        </div>
    );
}
