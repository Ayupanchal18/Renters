import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, Eye, EyeOff, Lock, Phone, Trash2, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { SecurityErrorBoundary, ErrorDisplay } from "../ui/error-boundary";
import PasswordStrengthIndicator from '../ui/password-strength-indicator';
import { 
    showSuccessToast, 
    OPERATION_CONTEXTS 
} from "../../utils/toastNotifications";

const SecurityModal = React.memo(function SecurityModal({ isOpen, onClose, type, user, onSecurityUpdate }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        newPhone: "",
        deleteConfirmation: "",
        deleteConfirmCheckbox: false,
    });
    const [errors, setErrors] = useState({});
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [pendingPhoneUpdate, setPendingPhoneUpdate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Simple password validation - just minimum 6 characters
    const getPasswordValidation = useCallback((password) => {
        if (!password) return null;
        
        const errors = [];
        let score = 0;
        
        // Simple requirement: minimum 6 characters
        const requirements = {
            minLength: password.length >= 6
        };
        
        if (requirements.minLength) {
            score = 100;
        } else {
            errors.push("Password must be at least 6 characters");
        }
        
        // Determine strength based on length
        let strength = 'weak';
        if (password.length >= 12) strength = 'excellent';
        else if (password.length >= 10) strength = 'strong';
        else if (password.length >= 8) strength = 'good';
        else if (password.length >= 6) strength = 'fair';
        
        // Feedback configuration
        const feedbackConfig = {
            weak: { message: 'Too short', color: { text: 'text-destructive', bg: 'bg-destructive' } },
            fair: { message: 'OK', color: { text: 'text-orange-600', bg: 'bg-orange-500' } },
            good: { message: 'Good', color: { text: 'text-yellow-600', bg: 'bg-yellow-500' } },
            strong: { message: 'Strong', color: { text: 'text-primary', bg: 'bg-primary' } },
            excellent: { message: 'Excellent', color: { text: 'text-emerald-600', bg: 'bg-emerald-500' } }
        };
        
        return {
            isValid: errors.length === 0,
            score,
            errors,
            strength,
            requirements,
            suggestions: [],
            feedback: feedbackConfig[strength]
        };
    }, []);


    // Form validation function
    const validateForm = useCallback(() => {
        const newErrors = {};

        if (type === "password") {
            if (!formData.currentPassword) {
                newErrors.currentPassword = "Current password is required";
            }
            if (!formData.newPassword) {
                newErrors.newPassword = "New password is required";
            } else {
                const passwordValidation = getPasswordValidation(formData.newPassword);
                if (passwordValidation && !passwordValidation.isValid) {
                    newErrors.newPassword = passwordValidation.errors[0] || "Password does not meet requirements";
                }
                
                if (formData.newPassword === formData.currentPassword) {
                    newErrors.newPassword = "New password must be different from current password";
                }
                
                if (passwordValidation && passwordValidation.score < 30) {
                    newErrors.newPassword = "Password is too weak. Please choose a stronger password.";
                }
            }
            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        } else if (type === "phone") {
            if (!formData.currentPassword) {
                newErrors.currentPassword = "Current password is required for security";
            }
            if (!showOTPInput) {
                if (!formData.newPhone) {
                    newErrors.newPhone = "Phone number is required";
                } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.newPhone)) {
                    newErrors.newPhone = "Please enter a valid phone number (e.g., +1234567890)";
                } else if (formData.newPhone === user?.phone) {
                    newErrors.newPhone = "New phone number must be different from current phone number";
                }
            } else {
                if (!otpCode || otpCode.length !== 6) {
                    newErrors.otp = "Please enter the complete 6-digit verification code";
                }
            }
        } else if (type === "delete") {
            if (!formData.currentPassword) {
                newErrors.currentPassword = "Password is required to confirm account deletion";
            }
            if (formData.deleteConfirmation !== "DELETE_MY_ACCOUNT") {
                newErrors.deleteConfirmation = 'Please type "DELETE_MY_ACCOUNT" exactly to confirm deletion';
            }
            if (!formData.deleteConfirmCheckbox) {
                newErrors.deleteConfirmCheckbox = "You must confirm that you understand this action is permanent";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [type, formData, getPasswordValidation, user?.phone, showOTPInput, otpCode]);

    // Form submission handler
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;

        setErrors({});
        setIsLoading(true);

        try {
            if (type === "password") {
                // Simulate password change
                await new Promise(resolve => setTimeout(resolve, 1000));
                showSuccessToast("Password updated successfully", OPERATION_CONTEXTS.PASSWORD_CHANGE);
                onSecurityUpdate?.("password");
                onClose();
            } else if (type === "phone") {
                if (!showOTPInput) {
                    // Simulate sending OTP
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setPendingPhoneUpdate({
                        currentPassword: formData.currentPassword,
                        newPhone: formData.newPhone,
                    });
                    setShowOTPInput(true);
                    showSuccessToast(`Verification code sent to ${formData.newPhone}`, OPERATION_CONTEXTS.PHONE_UPDATE);
                } else {
                    // Simulate phone update with OTP
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    showSuccessToast("Phone number updated successfully", OPERATION_CONTEXTS.PHONE_UPDATE);
                    onSecurityUpdate?.("phone");
                    onClose();
                }
            } else if (type === "delete") {
                // Simulate account deletion
                await new Promise(resolve => setTimeout(resolve, 1000));
                onSecurityUpdate?.("delete");
            }
        } catch (error) {
            console.error("Security operation error:", error);
            setErrors({ general: error.message || "An unexpected error occurred. Please try again." });
        } finally {
            setIsLoading(false);
        }
    }, [validateForm, type, formData, onSecurityUpdate, onClose, showOTPInput]);

    // Handle resend OTP
    const handleResendOTP = useCallback(async () => {
        if (!pendingPhoneUpdate) return;
        
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setOtpCode("");
            setErrors({});
            showSuccessToast("Verification code resent", OPERATION_CONTEXTS.PHONE_UPDATE);
        } catch (error) {
            console.error("Resend OTP error:", error);
            setErrors({ general: "Failed to resend OTP. Please try again." });
        } finally {
            setIsLoading(false);
        }
    }, [pendingPhoneUpdate]);


    // Modal content configuration
    const getModalContent = useMemo(() => {
        switch (type) {
            case "password":
                return {
                    title: "Change Password",
                    description: "Update your password to keep your account secure",
                    icon: Lock,
                    fields: [
                        { 
                            label: "Current Password", 
                            type: "password", 
                            key: "currentPassword",
                            showToggle: true,
                            show: showPassword,
                            onToggle: () => setShowPassword(!showPassword)
                        },
                        { 
                            label: "New Password", 
                            type: "password", 
                            key: "newPassword",
                            showToggle: true,
                            show: showNewPassword,
                            onToggle: () => setShowNewPassword(!showNewPassword)
                        },
                        { 
                            label: "Confirm New Password", 
                            type: "password", 
                            key: "confirmPassword"
                        },
                    ],
                    buttonText: "Update Password",
                };

            case "phone":
                return {
                    title: "Change Phone Number",
                    description: "Update your phone number for SMS notifications and security",
                    icon: Phone,
                    fields: [
                        { 
                            label: "Current Password", 
                            type: "password", 
                            key: "currentPassword",
                            showToggle: true,
                            show: showPassword,
                            onToggle: () => setShowPassword(!showPassword)
                        },
                        { 
                            label: "Current Phone", 
                            type: "tel", 
                            key: "currentPhone", 
                            disabled: true,
                            value: user?.phone || "Not set"
                        },
                        { 
                            label: "New Phone Number", 
                            type: "tel", 
                            key: "newPhone",
                            placeholder: "+1234567890",
                            disabled: showOTPInput
                        },
                    ],
                    buttonText: showOTPInput ? "Verify & Update Phone" : "Send Verification Code",
                };

            case "delete":
                return {
                    title: "Delete Account",
                    description: "This action cannot be undone. All your data will be permanently deleted.",
                    icon: Trash2,
                    fields: [
                        { 
                            label: "Current Password", 
                            type: "password", 
                            key: "currentPassword",
                            showToggle: true,
                            show: showPassword,
                            onToggle: () => setShowPassword(!showPassword)
                        },
                        { 
                            label: 'Type "DELETE_MY_ACCOUNT" to confirm', 
                            type: "text", 
                            key: "deleteConfirmation",
                            placeholder: "DELETE_MY_ACCOUNT"
                        },
                    ],
                    buttonText: "Delete Account",
                    dangerous: true,
                };

            default:
                return null;
        }
    }, [type, showPassword, showNewPassword, showOTPInput, user?.phone]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
                newPhone: user?.phone || "",
                deleteConfirmation: "",
                deleteConfirmCheckbox: false,
            });
            setErrors({});
            setShowPassword(false);
            setShowNewPassword(false);
            setShowOTPInput(false);
            setOtpCode("");
            setPendingPhoneUpdate(null);
            setIsLoading(false);
            setIsRetrying(false);
            setRetryCount(0);
        }
    }, [isOpen, type, user]);

    // Early return after all hooks are defined
    if (!isOpen) return null;
    const content = getModalContent;
    if (!content) return null;

    const Icon = content.icon;
    const displayError = errors.general;


    return (
        <SecurityErrorBoundary
            operation={type}
            context="security-modal"
            onRetry={() => {
                setErrors({});
            }}
            onCancel={onClose}
        >
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-background rounded-lg max-w-md w-full shadow-xl border border-border max-h-[90vh] overflow-y-auto my-auto">
                {/* Header */}
                <div
                    className={`border-b border-border p-6 flex items-center justify-between ${content.dangerous ? "bg-red-50 dark:bg-red-950/30" : "bg-muted/50"}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${content.dangerous ? "bg-red-100 dark:bg-red-900/50" : "bg-primary/10"}`}>
                            <Icon
                                size={24}
                                className={content.dangerous ? "text-red-600 dark:text-red-400" : "text-primary"}
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">{content.title}</h2>
                            <p className="text-sm text-muted-foreground">{content.description}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    {/* General Error */}
                    {displayError && (
                        <ErrorDisplay
                            error={displayError}
                            variant="inline"
                            onRetry={type === "password" ? () => handleSubmit() : undefined}
                            onDismiss={() => setErrors({})}
                            className="mb-4"
                        />
                    )}

                    {/* Retry Information */}
                    {isRetrying && retryCount > 0 && (
                        <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                            <span className="text-sm text-blue-800 dark:text-blue-200">
                                Retrying operation... (attempt {retryCount})
                            </span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {content.fields.map((field) => (
                            <div key={field.key}>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {field.label}
                                </label>

                                <div className="relative">
                                    <input
                                        type={field.type === "password" && field.show ? "text" : field.type}
                                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                        disabled={field.disabled}
                                        value={field.disabled ? field.value : formData[field.key]}
                                        className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground
                                            focus:outline-none focus:ring-2 focus:ring-primary/50 
                                            disabled:bg-muted disabled:text-muted-foreground ${
                                                errors[field.key] 
                                                    ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500' 
                                                    : 'border-input'
                                            }`}
                                        onChange={(e) =>
                                            setFormData({ ...formData, [field.key]: e.target.value })
                                        }
                                    />

                                    {field.showToggle && (
                                        <button
                                            type="button"
                                            onClick={field.onToggle}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {field.show ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    )}
                                </div>

                                {errors[field.key] && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[field.key]}</p>
                                )}
                            </div>
                        ))}

                        {/* OTP Input for Phone Update */}
                        {type === "phone" && showOTPInput && (
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Verification Code
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={otpCode}
                                        maxLength={6}
                                        className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground
                                            focus:outline-none focus:ring-2 focus:ring-primary/50 
                                            ${errors.otp 
                                                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500' 
                                                : 'border-input'
                                            }`}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setOtpCode(value);
                                            setErrors({ ...errors, otp: '' });
                                        }}
                                    />
                                </div>
                                {errors.otp && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.otp}</p>
                                )}
                                <div className="mt-2 flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Code sent to {pendingPhoneUpdate?.newPhone}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={isLoading}
                                        className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
                                    >
                                        {isLoading ? "Sending..." : "Resend Code"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Password Strength Indicator */}
                    {type === "password" && formData.newPassword && (
                        <div className="mt-4">
                            <PasswordStrengthIndicator 
                                password={formData.newPassword}
                                validation={getPasswordValidation(formData.newPassword)}
                                showRequirements={true}
                                showSuggestions={true}
                            />
                        </div>
                    )}


                    {/* Warning for Destructive Actions */}
                    {content.dangerous && (
                        <div className="mt-4 space-y-3">
                            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                                            ⚠️ Permanent Account Deletion
                                        </p>
                                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                                            This action cannot be undone. Once you delete your account, all of the following will be permanently removed:
                                        </p>
                                        <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 ml-4">
                                            <li>• Your profile and personal information</li>
                                            <li>• All property listings and photos</li>
                                            <li>• Message conversations and history</li>
                                            <li>• Wishlist and saved searches</li>
                                            <li>• Account settings and preferences</li>
                                        </ul>
                                        <p className="text-sm text-red-800 dark:text-red-200 font-medium mt-3">
                                            You will not be able to recover this data or reactivate your account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Additional confirmation checkbox */}
                            <div className="space-y-2">
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="deleteConfirmCheckbox"
                                        checked={formData.deleteConfirmCheckbox || false}
                                        onChange={(e) => {
                                            setFormData({ ...formData, deleteConfirmCheckbox: e.target.checked });
                                            if (e.target.checked && errors.deleteConfirmCheckbox) {
                                                setErrors({ ...errors, deleteConfirmCheckbox: '' });
                                            }
                                        }}
                                        className={`mt-1 h-4 w-4 text-red-600 focus:ring-red-500 rounded ${
                                            errors.deleteConfirmCheckbox ? 'border-red-300 dark:border-red-700' : 'border-input'
                                        }`}
                                    />
                                    <label htmlFor="deleteConfirmCheckbox" className="text-sm text-yellow-800 dark:text-yellow-200">
                                        I understand that this action is permanent and cannot be undone. I want to delete my account and all associated data.
                                    </label>
                                </div>
                                {errors.deleteConfirmCheckbox && (
                                    <p className="text-sm text-red-600 dark:text-red-400 ml-7">{errors.deleteConfirmCheckbox}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border p-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 border border-input text-foreground font-medium text-sm rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={
                            isLoading ||
                            (type === "delete" && !formData.deleteConfirmCheckbox) ||
                            (type === "password" && (!getPasswordValidation(formData.newPassword)?.isValid || getPasswordValidation(formData.newPassword)?.score < 30))
                        }
                        className={`px-4 py-2 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            content.dangerous
                                ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                : "bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {type === "password" && "Updating..."}
                                {type === "phone" && (showOTPInput ? "Verifying..." : "Sending...")}
                                {type === "delete" && "Deleting..."}
                            </div>
                        ) : (
                            content.buttonText
                        )}
                    </button>
                </div>
            </div>
        </div>
        </SecurityErrorBoundary>
    );
});

export default SecurityModal;
