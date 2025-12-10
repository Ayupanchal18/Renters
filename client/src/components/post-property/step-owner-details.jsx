import { Input } from "../ui/input";
import { User } from 'lucide-react';

export default function StepOwnerDetails({ formData, setFormData, validationErrors }) {
    const updateData = (updates) => {
        setFormData({ ...formData, ...updates });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <User size={28} className="text-purple-600" />
                Your Contact Details
            </h2>

            {/* Owner Name */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name *</label>
                <Input
                    placeholder="Your full name"
                    value={formData.ownerName}
                    onChange={(e) => updateData({ ownerName: e.target.value })}
                    className={validationErrors.ownerName ? "border-red-500" : ""}
                />
                {validationErrors.ownerName && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.ownerName}</p>
                )}
            </div>

            {/* Phone Number */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Phone Number *</label>
                <Input
                    placeholder="+91 98765 43210"
                    value={formData.ownerPhone}
                    onChange={(e) => updateData({ ownerPhone: e.target.value })}
                    className={validationErrors.ownerPhone ? "border-red-500" : ""}
                />
                {validationErrors.ownerPhone && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.ownerPhone}</p>
                )}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address *</label>
                <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.ownerEmail}
                    onChange={(e) => updateData({ ownerEmail: e.target.value })}
                    className={validationErrors.ownerEmail ? "border-red-500" : ""}
                />
                {validationErrors.ownerEmail && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.ownerEmail}</p>
                )}
            </div>

            {/* Owner or Broker */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Are you the Owner or Broker? *
                </label>

                <div className="flex gap-6">
                    {["owner", "broker"].map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                value={type}
                                checked={formData.ownerType === type}
                                onChange={(e) => updateData({ ownerType: e.target.value })}
                                className="w-4 h-4"
                            />
                            <span className="text-slate-700 capitalize font-medium">{type}</span>
                        </label>
                    ))}
                </div>

                {validationErrors.ownerType && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.ownerType}</p>
                )}
            </div>
        </div>
    );
}
