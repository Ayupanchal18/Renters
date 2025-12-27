import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { IndianRupee } from 'lucide-react';
import { POSSESSION_STATUS, POSSESSION_STATUS_LABELS } from '@shared/propertyTypes';

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

            {/* Loan Available */}
            <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.loanAvailable}
                        onChange={(e) => setFormData({ ...formData, loanAvailable: e.target.checked })}
                        className="w-5 h-5 rounded border-input text-primary accent-primary"
                    />
                    <span className="text-foreground font-medium text-sm sm:text-base">Loan available for this property</span>
                </label>
            </div>
        </div>
    );
}
