import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { IndianRupee } from "lucide-react";
import {
    PREFERRED_TENANTS,
    PREFERRED_TENANTS_LABELS,
    LOCK_IN_PERIODS,
    LOCK_IN_PERIOD_LABELS,
    LISTING_TYPES
} from "@shared/propertyTypes";

export default function PricingStep({ formData, setFormData, validationErrors }) {
    const isRent = formData.listingType === LISTING_TYPES.RENT || formData.listingType === "rent";

    const updateData = (updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    if (isRent) {
        return (
            <div className="space-y-5 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                    <IndianRupee size={22} className="text-success" />
                    Rent Pricing & Terms
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Monthly Rent */}
                    <div className="space-y-2">
                        <Label htmlFor="monthlyRent" className="text-foreground font-semibold text-xs sm:text-sm">Monthly Rent *</Label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-semibold">₹</span>
                            <Input
                                id="monthlyRent"
                                type="number"
                                placeholder="0"
                                value={formData.monthlyRent || ""}
                                onChange={(e) => updateData({ monthlyRent: e.target.value })}
                                className={`pl-7 h-10 rounded-xl text-xs sm:text-sm ${validationErrors.monthlyRent ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                        </div>
                        {validationErrors.monthlyRent && (
                            <p className="text-destructive text-[10px]">{validationErrors.monthlyRent}</p>
                        )}
                    </div>

                    {/* Security Deposit */}
                    <div className="space-y-2">
                        <Label htmlFor="securityDeposit" className="text-foreground font-semibold text-xs sm:text-sm">Security Deposit</Label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-semibold">₹</span>
                            <Input
                                id="securityDeposit"
                                type="number"
                                placeholder="0"
                                value={formData.securityDeposit || ""}
                                onChange={(e) => updateData({ securityDeposit: e.target.value })}
                                className={`pl-7 h-10 rounded-xl text-xs sm:text-sm ${validationErrors.securityDeposit ? "border-destructive" : ""}`}
                            />
                        </div>
                        {validationErrors.securityDeposit && (
                            <p className="text-destructive text-[10px]">{validationErrors.securityDeposit}</p>
                        )}
                    </div>

                    {/* Maintenance Charge */}
                    <div className="space-y-2">
                        <Label htmlFor="maintenanceCharge" className="text-foreground font-semibold text-xs sm:text-sm">Maintenance Charge</Label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-semibold">₹</span>
                            <Input
                                id="maintenanceCharge"
                                type="number"
                                placeholder="0"
                                value={formData.maintenanceCharge || ""}
                                onChange={(e) => updateData({ maintenanceCharge: e.target.value })}
                                className="pl-7 h-10 rounded-xl text-xs sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Preferred Tenants */}
                    <div className="space-y-2">
                        <Label htmlFor="preferredTenants" className="text-foreground font-semibold text-xs sm:text-sm">Preferred Tenants</Label>
                        <select
                            id="preferredTenants"
                            value={formData.preferredTenants || "any"}
                            onChange={(e) => updateData({ preferredTenants: e.target.value })}
                            className="w-full px-3.5 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                        >
                            {PREFERRED_TENANTS.map((tenant) => (
                                <option key={tenant} value={tenant}>
                                    {PREFERRED_TENANTS_LABELS[tenant]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Lease Duration */}
                    <div className="space-y-2">
                        <Label htmlFor="leaseDuration" className="text-foreground font-semibold text-xs sm:text-sm">Lease Duration</Label>
                        <Input
                            id="leaseDuration"
                            type="text"
                            placeholder="e.g., 11 months"
                            value={formData.leaseDuration || ""}
                            onChange={(e) => updateData({ leaseDuration: e.target.value })}
                            className="h-10 rounded-xl text-xs sm:text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Lock-in Period */}
                    <div className="space-y-2">
                        <Label htmlFor="lockInPeriod" className="text-foreground font-semibold text-xs sm:text-sm">Lock-in Period</Label>
                        <select
                            id="lockInPeriod"
                            value={formData.lockInPeriod || 0}
                            onChange={(e) => updateData({ lockInPeriod: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                        >
                            {LOCK_IN_PERIODS.map((period) => (
                                <option key={period} value={period}>
                                    {LOCK_IN_PERIOD_LABELS[period]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Brokerage */}
                    <div className="space-y-2">
                        <Label htmlFor="brokerage" className="text-foreground font-semibold text-xs sm:text-sm">Brokerage</Label>
                        <Input
                            id="brokerage"
                            type="text"
                            placeholder="e.g., 1 month rent, No brokerage"
                            value={formData.brokerage || ""}
                            onChange={(e) => updateData({ brokerage: e.target.value })}
                            className="h-10 rounded-xl text-xs sm:text-sm"
                        />
                    </div>
                </div>

                {/* Rent Negotiable */}
                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.rentNegotiable || false}
                        onChange={(e) => updateData({ rentNegotiable: e.target.checked })}
                        className="w-4 h-4 rounded border-input accent-primary"
                    />
                    <span className="text-foreground font-semibold text-xs sm:text-sm">Rent is Negotiable</span>
                </label>
            </div>
        );
    }

    // Sell Pricing Screen
    return (
        <div className="space-y-5 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <IndianRupee size={22} className="text-success" />
                Sale Pricing & Terms
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selling Price */}
                <div className="space-y-2">
                    <Label htmlFor="sellingPrice" className="text-foreground font-semibold text-xs sm:text-sm">Selling Price *</Label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-semibold">₹</span>
                        <Input
                            id="sellingPrice"
                            type="number"
                            placeholder="0"
                            value={formData.sellingPrice || ""}
                            onChange={(e) => updateData({ sellingPrice: e.target.value })}
                            className={`pl-7 h-10 rounded-xl text-xs sm:text-sm ${validationErrors.sellingPrice ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                    </div>
                    {validationErrors.sellingPrice && (
                        <p className="text-destructive text-[10px]">{validationErrors.sellingPrice}</p>
                    )}
                </div>

                {/* Price Per Sqft */}
                <div className="space-y-2">
                    <Label htmlFor="pricePerSqft" className="text-foreground font-semibold text-xs sm:text-sm">Price Per Sq Ft</Label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-semibold">₹</span>
                        <Input
                            id="pricePerSqft"
                            type="number"
                            placeholder="0"
                            value={formData.pricePerSqft || ""}
                            onChange={(e) => updateData({ pricePerSqft: e.target.value })}
                            className="pl-7 h-10 rounded-xl text-xs sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Possession Status */}
                <div className="space-y-2">
                    <Label htmlFor="possessionStatus" className="text-foreground font-semibold text-xs sm:text-sm">Possession Status</Label>
                    <select
                        id="possessionStatus"
                        value={formData.possessionStatus || "ready"}
                        onChange={(e) => updateData({ possessionStatus: e.target.value })}
                        className="w-full px-3.5 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                    >
                        <option value="ready">Ready to Move</option>
                        <option value="under_construction">Under Construction</option>
                        <option value="resale">Resale</option>
                    </select>
                </div>

                {/* Booking Amount */}
                <div className="space-y-2">
                    <Label htmlFor="bookingAmount" className="text-foreground font-semibold text-xs sm:text-sm">Booking Amount</Label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-semibold">₹</span>
                        <Input
                            id="bookingAmount"
                            type="number"
                            placeholder="0"
                            value={formData.bookingAmount || ""}
                            onChange={(e) => updateData({ bookingAmount: e.target.value })}
                            className="pl-7 h-10 rounded-xl text-xs sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ownership Type */}
                <div className="space-y-2">
                    <Label htmlFor="ownershipType" className="text-foreground font-semibold text-xs sm:text-sm">Ownership Type</Label>
                    <select
                        id="ownershipType"
                        value={formData.ownershipType || ""}
                        onChange={(e) => updateData({ ownershipType: e.target.value })}
                        className="w-full px-3.5 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                    >
                        <option value="">Select ownership</option>
                        <option value="freehold">Freehold</option>
                        <option value="leasehold">Leasehold</option>
                        <option value="cooperative">Co-operative Society</option>
                        <option value="power_of_attorney">Power of Attorney</option>
                    </select>
                </div>

                {/* RERA Number */}
                <div className="space-y-2">
                    <Label htmlFor="reraNumber" className="text-foreground font-semibold text-xs sm:text-sm">RERA Number</Label>
                    <Input
                        id="reraNumber"
                        placeholder="e.g., PRM/KA/RERA/..."
                        value={formData.reraNumber || ""}
                        onChange={(e) => updateData({ reraNumber: e.target.value })}
                        className="h-10 rounded-xl text-xs sm:text-sm"
                    />
                </div>
            </div>

            {/* Price Negotiable and Loan Available checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.priceNegotiable || false}
                        onChange={(e) => updateData({ priceNegotiable: e.target.checked })}
                        className="w-4 h-4 rounded border-input accent-primary"
                    />
                    <span className="text-foreground font-semibold text-xs sm:text-sm">Price is Negotiable</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.loanAvailable || false}
                        onChange={(e) => updateData({ loanAvailable: e.target.checked })}
                        className="w-4 h-4 rounded border-input accent-primary"
                    />
                    <span className="text-foreground font-semibold text-xs sm:text-sm">Bank Loan Available</span>
                </label>
            </div>
        </div>
    );
}
