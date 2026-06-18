import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { IndianRupee } from 'lucide-react';
import { PREFERRED_TENANTS, PREFERRED_TENANTS_LABELS, LOCK_IN_PERIODS, LOCK_IN_PERIOD_LABELS } from '@shared/propertyTypes';

export default function StepRentPricing({ formData, setFormData, validationErrors }) {
    return (
        <div className="space-y-5 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <IndianRupee size={24} className="text-success" />
                Rent Pricing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Monthly Rent */}
                <div className="space-y-2">
                    <Label htmlFor="monthlyRent" className="text-foreground font-semibold text-sm sm:text-base">Monthly Rent *</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="monthlyRent"
                            type="number"
                            placeholder="0"
                            value={formData.monthlyRent}
                            onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                            className={`pl-8 text-sm sm:text-base ${validationErrors.monthlyRent ? "border-destructive" : ""}`}
                        />
                    </div>
                    {validationErrors.monthlyRent && (
                        <p className="text-destructive text-xs sm:text-sm">{validationErrors.monthlyRent}</p>
                    )}
                </div>

                {/* Security Deposit */}
                <div className="space-y-2">
                    <Label htmlFor="securityDeposit" className="text-foreground font-semibold text-sm sm:text-base">Security Deposit</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="securityDeposit"
                            type="number"
                            placeholder="0"
                            value={formData.securityDeposit}
                            onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                            className={`pl-8 text-sm sm:text-base ${validationErrors.securityDeposit ? "border-destructive" : ""}`}
                        />
                    </div>
                    {validationErrors.securityDeposit && (
                        <p className="text-destructive text-xs sm:text-sm">{validationErrors.securityDeposit}</p>
                    )}
                </div>

                {/* Maintenance Charge */}
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="maintenanceCharge" className="text-foreground font-semibold text-sm sm:text-base">Maintenance</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="maintenanceCharge"
                            type="number"
                            placeholder="0"
                            value={formData.maintenanceCharge}
                            onChange={(e) => setFormData({ ...formData, maintenanceCharge: e.target.value })}
                            className="pl-8 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Preferred Tenants */}
                <div className="space-y-2">
                    <Label htmlFor="preferredTenants" className="text-foreground font-semibold text-sm sm:text-base">Preferred Tenants</Label>
                    <select
                        id="preferredTenants"
                        value={formData.preferredTenants}
                        onChange={(e) => setFormData({ ...formData, preferredTenants: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm sm:text-base"
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
                    <Label htmlFor="leaseDuration" className="text-foreground font-semibold text-sm sm:text-base">Lease Duration</Label>
                    <Input
                        id="leaseDuration"
                        type="text"
                        placeholder="e.g., 11 months"
                        value={formData.leaseDuration}
                        onChange={(e) => setFormData({ ...formData, leaseDuration: e.target.value })}
                        className="text-sm sm:text-base"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Lock-in Period */}
                <div className="space-y-2">
                    <Label htmlFor="lockInPeriod" className="text-foreground font-semibold text-sm sm:text-base">Lock-in Period</Label>
                    <select
                        id="lockInPeriod"
                        value={formData.lockInPeriod || 0}
                        onChange={(e) => setFormData({ ...formData, lockInPeriod: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm sm:text-base"
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
                    <Label htmlFor="brokerage" className="text-foreground font-semibold text-sm sm:text-base">
                        Brokerage <span className="text-muted-foreground font-normal">(if applicable)</span>
                    </Label>
                    <Input
                        id="brokerage"
                        type="text"
                        placeholder="e.g., 1 month rent, No brokerage"
                        value={formData.brokerage || ''}
                        onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
                        className="text-sm sm:text-base"
                    />
                </div>
            </div>

            {/* Rent Negotiable */}
            <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.rentNegotiable}
                        onChange={(e) => setFormData({ ...formData, rentNegotiable: e.target.checked })}
                        className="w-5 h-5 rounded border-input text-primary accent-primary"
                    />
                    <span className="text-foreground font-medium text-sm sm:text-base">Rent is negotiable</span>
                </label>
            </div>
        </div>
    );
}
