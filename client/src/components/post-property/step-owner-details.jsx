import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { User } from 'lucide-react';

export default function StepOwnerDetails({ formData, setFormData, validationErrors }) {
    const updateData = (updates) => {
        setFormData({ ...formData, ...updates });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <User size={28} className="text-primary" />
                Your Contact Details
            </h2>

            {/* Owner Name */}
            <div className="space-y-2">
                <Label htmlFor="ownerName" className="text-foreground font-semibold">Full Name *</Label>
                <Input
                    id="ownerName"
                    placeholder="Your full name"
                    value={formData.ownerName}
                    onChange={(e) => updateData({ ownerName: e.target.value })}
                    className={validationErrors.ownerName ? "border-destructive" : ""}
                />
                {validationErrors.ownerName && (
                    <p className="text-destructive text-sm">{validationErrors.ownerName}</p>
                )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
                <Label htmlFor="ownerPhone" className="text-foreground font-semibold">Phone Number *</Label>
                <Input
                    id="ownerPhone"
                    placeholder="+91 98765 43210"
                    value={formData.ownerPhone}
                    onChange={(e) => updateData({ ownerPhone: e.target.value })}
                    className={validationErrors.ownerPhone ? "border-destructive" : ""}
                />
                {validationErrors.ownerPhone && (
                    <p className="text-destructive text-sm">{validationErrors.ownerPhone}</p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="ownerEmail" className="text-foreground font-semibold">Email Address *</Label>
                <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.ownerEmail}
                    onChange={(e) => updateData({ ownerEmail: e.target.value })}
                    className={validationErrors.ownerEmail ? "border-destructive" : ""}
                />
                {validationErrors.ownerEmail && (
                    <p className="text-destructive text-sm">{validationErrors.ownerEmail}</p>
                )}
            </div>

            {/* Owner or Broker */}
            <div className="space-y-3">
                <Label className="text-foreground font-semibold">
                    Are you the Owner or Broker? *
                </Label>

                <div className="flex gap-6">
                    {["owner", "broker"].map((type) => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                value={type}
                                checked={formData.ownerType === type}
                                onChange={(e) => updateData({ ownerType: e.target.value })}
                                className="w-4 h-4 accent-primary"
                            />
                            <span className="text-foreground capitalize font-medium">{type}</span>
                        </label>
                    ))}
                </div>

                {validationErrors.ownerType && (
                    <p className="text-destructive text-sm">{validationErrors.ownerType}</p>
                )}
            </div>

            {/* Privacy Note */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Privacy Note:</span> Your contact details will only be shared with verified users who express interest in your property.
                </p>
            </div>
        </div>
    );
}
