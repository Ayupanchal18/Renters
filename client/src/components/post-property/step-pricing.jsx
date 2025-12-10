import { Input } from "../ui/input";
import { DollarSign } from 'lucide-react';

export default function StepPricing({ formData, setFormData, validationErrors }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <DollarSign size={28} className="text-emerald-600" />
                Pricing Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Monthly Rent */}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Monthly Rent *</label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 text-slate-500 font-semibold">$</span>
                        <Input
                            type="number"
                            placeholder="0"
                            value={formData.monthlyRent}
                            onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                            className={`pl-8${validationErrors.monthlyRent ? "border-red-500" : ""}`}
                        />
                    </div>
                    {validationErrors.monthlyRent && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.monthlyRent}</p>
                    )}
                </div>

                {/* Security Deposit */}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Security Deposit</label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 text-slate-500 font-semibold">$</span>
                        <Input
                            type="number"
                            placeholder="0"
                            value={formData.securityDeposit}
                            onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Maintenance Charge */}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Maintenance Charge</label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 text-slate-500 font-semibold">$</span>
                        <Input
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
            <div>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.negotiable}
                        onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Rent is negotiable</span>
                </label>
            </div>
        </div>
    );
}
