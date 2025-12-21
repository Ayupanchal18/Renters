import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DollarSign, IndianRupee } from 'lucide-react';

export default function StepPricing({ formData, setFormData, validationErrors }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <IndianRupee size={28} className="text-success" />
                Pricing Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Monthly Rent */}
                <div className="space-y-2">
                    <Label htmlFor="monthlyRent" className="text-foreground font-semibold">Monthly Rent *</Label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="monthlyRent"
                            type="number"
                            placeholder="0"
                            value={formData.monthlyRent}
                            onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                            className={`pl-8 ${validationErrors.monthlyRent ? "border-destructive" : ""}`}
                        />
                    </div>
                    {validationErrors.monthlyRent && (
                        <p className="text-destructive text-sm">{validationErrors.monthlyRent}</p>
                    )}
                </div>

                {/* Security Deposit */}
                <div className="space-y-2">
                    <Label htmlFor="securityDeposit" className="text-foreground font-semibold">Security Deposit</Label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="securityDeposit"
                            type="number"
                            placeholder="0"
                            value={formData.securityDeposit}
                            onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Maintenance Charge */}
                <div className="space-y-2">
                    <Label htmlFor="maintenanceCharge" className="text-foreground font-semibold">Maintenance Charge</Label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 text-muted-foreground font-semibold">₹</span>
                        <Input
                            id="maintenanceCharge"
                            type="number"
                            placeholder="0"
                            value={formData.maintenanceCharge}
                            onChange={(e) => setFormData({ ...formData, maintenanceCharge: e.target.value })}
                            className="pl-8"
                        />
                    </div>
                </div>

            </div>

            {/* Negotiable */}
            <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.negotiable}
                        onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
                        className="w-5 h-5 rounded border-input text-primary accent-primary"
                    />
                    <span className="text-foreground font-medium">Rent is negotiable</span>
                </label>
            </div>
        </div>
    );
}
