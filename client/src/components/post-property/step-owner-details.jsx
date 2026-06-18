import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { User } from 'lucide-react';
import { OWNER_TYPES, OWNER_TYPE_LABELS } from '@shared/propertyTypes';
import { validateFieldInline } from '@shared/validation/wizard';

export default function StepOwnerDetails({ formData, setFormData, validationErrors }) {
    const [inlineErrors, setInlineErrors] = useState({});

    const updateData = (updates) => {
        setFormData({ ...formData, ...updates });
    };

    const handleBlur = (fieldName, value) => {
        const error = validateFieldInline(fieldName, value, formData);
        setInlineErrors((prev) => ({
            ...prev,
            [fieldName]: error,
        }));
    };

    const getError = (field) => validationErrors[field] || inlineErrors[field];

    return (
        <div className="space-y-5 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <User size={24} className="text-primary" />
                Your Contact Details
            </h2>

            {/* Owner Name */}
            <div className="space-y-2">
                <Label htmlFor="ownerName" className="text-foreground font-semibold text-sm sm:text-base">Full Name *</Label>
                <Input
                    id="ownerName"
                    placeholder="Your full name"
                    value={formData.ownerName}
                    onChange={(e) => updateData({ ownerName: e.target.value })}
                    className={`text-sm sm:text-base ${getError('ownerName') ? "border-destructive" : ""}`}
                />
                {getError('ownerName') && (
                    <p className="text-destructive text-xs sm:text-sm">{getError('ownerName')}</p>
                )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
                <Label htmlFor="ownerPhone" className="text-foreground font-semibold text-sm sm:text-base">Phone Number *</Label>
                <div className="flex gap-2">
                    <span className="flex items-center justify-center px-3 bg-muted border border-input rounded-lg text-sm text-muted-foreground font-medium">
                        +91
                    </span>
                    <Input
                        id="ownerPhone"
                        placeholder="98765 43210"
                        value={formData.ownerPhone}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            updateData({ ownerPhone: val });
                        }}
                        onBlur={(e) => handleBlur('ownerPhone', e.target.value)}
                        inputMode="numeric"
                        maxLength={10}
                        className={`flex-1 text-sm sm:text-base ${getError('ownerPhone') ? "border-destructive" : ""}`}
                    />
                </div>
                {getError('ownerPhone') && (
                    <p className="text-destructive text-xs sm:text-sm">{getError('ownerPhone')}</p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="ownerEmail" className="text-foreground font-semibold text-sm sm:text-base">Email Address *</Label>
                <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.ownerEmail}
                    onChange={(e) => updateData({ ownerEmail: e.target.value })}
                    onBlur={(e) => handleBlur('ownerEmail', e.target.value)}
                    className={`text-sm sm:text-base ${getError('ownerEmail') ? "border-destructive" : ""}`}
                />
                {getError('ownerEmail') && (
                    <p className="text-destructive text-xs sm:text-sm">{getError('ownerEmail')}</p>
                )}
            </div>

            {/* Owner or Agent or Builder */}
            <div className="space-y-3">
                <Label className="text-foreground font-semibold text-sm sm:text-base">
                    You are *
                </Label>

                <div className="grid grid-cols-3 gap-3">
                    {OWNER_TYPES.map((type) => (
                        <label 
                            key={type} 
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.ownerType === type 
                                    ? "border-primary bg-primary/5" 
                                    : "border-border hover:border-primary/50"
                            }`}
                        >
                            <input
                                type="radio"
                                value={type}
                                checked={formData.ownerType === type}
                                onChange={(e) => updateData({ ownerType: e.target.value })}
                                className="w-4 h-4 accent-primary"
                            />
                            <span className="text-foreground font-medium text-xs sm:text-sm">{OWNER_TYPE_LABELS[type]}</span>
                        </label>
                    ))}
                </div>

                {getError('ownerType') && (
                    <p className="text-destructive text-xs sm:text-sm">{getError('ownerType')}</p>
                )}
            </div>

            {/* Privacy Note */}
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Privacy Note:</span> Your contact details will only be shared with verified users who express interest in your property.
                </p>
            </div>
        </div>
    );
}
