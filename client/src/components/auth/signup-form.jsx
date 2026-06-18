"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { validatePasswordStrength } from "@shared/validation/password";
import PasswordStrengthIndicator from "../ui/password-strength-indicator";
import { User, Mail, Phone, MapPin, Lock, CheckCircle, AlertCircle, Shield, Eye, EyeOff } from "lucide-react";
import SocialLoginButtons from "./SocialLoginButtons";

export default function SignupForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        userType: "buyer",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
        acceptPrivacyPolicy: false,
        acceptDataProcessing: false,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // OTP Verification State
    const [registrationStep, setRegistrationStep] = useState(1);
    const [otpCode, setOtpCode] = useState("");
    const [otpError, setOtpError] = useState("");
    const [otpSuccess, setOtpSuccess] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    // Password Visibility State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    /* ────────────────────── VALIDATION ────────────────────── */
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = "Full name is required";
        else if (formData.name.trim().length < 2)
            newErrors.name = "Name must be at least 2 characters";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!emailRegex.test(formData.email))
            newErrors.email = "Please enter a valid email address";

        const phoneRegex = /^[0-9+\-\s]{10,}$/;
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
        else if (!phoneRegex.test(formData.phone.replace(/\s/g, "")))
            newErrors.phone = "Please enter a valid phone number";

        if (!formData.address.trim()) newErrors.address = "Address is required";
        else if (formData.address.trim().length < 5)
            newErrors.address = "Address must be at least 5 characters";

        if (!formData.userType) newErrors.userType = "Please select a user type";

        // Enhanced password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else {
            const passwordValidation = validatePasswordStrength(formData.password, {
                name: formData.name,
                email: formData.email
            });
            if (!passwordValidation.isValid) {
                newErrors.password = passwordValidation.errors[0] || "Password does not meet requirements";
            }
        }

        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";

        // GDPR Consent validation - all required
        if (!formData.acceptTerms)
            newErrors.acceptTerms = "You must accept the Terms of Service";
        
        if (!formData.acceptPrivacyPolicy)
            newErrors.acceptPrivacyPolicy = "You must accept the Privacy Policy";
        
        if (!formData.acceptDataProcessing)
            newErrors.acceptDataProcessing = "You must consent to data processing";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitSuccess(false);

        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include', // Include cookies for refresh token
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email.toLowerCase().trim(),
                    phone: formData.phone,
                    address: formData.address,
                    userType: formData.userType,
                    password: formData.password,
                    acceptTerms: formData.acceptTerms,
                    acceptPrivacyPolicy: formData.acceptPrivacyPolicy,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.details) {
                    // Handle validation errors from server
                    const serverErrors = {};
                    data.details.forEach(err => {
                        serverErrors[err.field] = err.message;
                    });
                    setErrors(serverErrors);
                }
                setSubmitError(data.error || "Signup failed. Try again.");
            } else {
                setSubmitSuccess(true);
                // Store only the access token - refresh token is in httpOnly cookie
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                // Send OTP and transition to Step 2
                sendOTP(data.token, data.user.email);
            }
        } catch (err) {
            setSubmitError(err.message || "Signup failed.");
        } finally {
            setLoading(false);
        }
    };

    const sendOTP = async (token, email) => {
        try {
            setResendLoading(true);
            setOtpError("");
            const res = await fetch("/api/verification/send-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ type: "email", contact: email })
            });
            const data = await res.json();
            if (!res.ok) {
                setOtpError(data.message || "Failed to send OTP.");
            } else {
                setRegistrationStep(2);
                if (data.otp) {
                    console.log("Development OTP:", data.otp);
                }
            }
        } catch (err) {
            setOtpError("Network error sending OTP.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setOtpError("");
        if (otpCode.length !== 6) {
            setOtpError("Please enter a valid 6-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch("/api/verification/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: "email",
                    contact: formData.email,
                    otp: otpCode
                })
            });
            const data = await res.json();
            
            if (!res.ok) {
                setOtpError(data.message || "Invalid OTP.");
            } else {
                setOtpSuccess(true);
                // Update local storage user
                const userObj = JSON.parse(localStorage.getItem("user"));
                userObj.emailVerified = true;
                localStorage.setItem("user", JSON.stringify(userObj));
                
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            }
        } catch (err) {
            setOtpError("Network error verifying OTP.");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = (hasError) =>
        `w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
            hasError
                ? "border-destructive focus:ring-destructive/50"
                : "border-border focus:ring-primary/50 focus:border-primary"
        }`;

    return (
        <div className="w-full">
            {/* Header (Mobile Only) */}
            <div className="md:hidden text-center mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-primary/20">
                    <img src="/Logo1.png" alt="Renters" className="w-10 h-10 object-contain" />
                </div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Create Account</h1>
                <p className="text-sm text-muted-foreground mt-1">Join Renters and find your home</p>
            </div>

            {/* Social Login at Top - Only show on Step 1 */}
            {registrationStep === 1 && (
                <>
                    <div className="mb-4">
                        <SocialLoginButtons 
                            disabled={loading || submitSuccess}
                            onError={(err) => setSubmitError(err)}
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                            <span className="px-3 bg-background text-muted-foreground">or register with email</span>
                        </div>
                    </div>
                </>
            )}

                {registrationStep === 1 ? (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Messages */}
                        {submitError && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium">{submitError}</span>
                            </div>
                        )}
                        {submitSuccess && (
                            <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 text-success rounded-lg">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium">Account created! Preparing verification...</span>
                            </div>
                        )}

                        {/* Form Grid */}
                        <div className="grid grid-cols-1 gap-3">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label htmlFor="signup-name" className="block text-sm font-medium text-foreground">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Rahul Sharma"
                                        className={`${inputClasses(errors.name)} pl-10`}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label htmlFor="signup-email" className="block text-sm font-medium text-foreground">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-email"
                                        type="email"
                                        name="email"
                                        autoComplete="username email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="rahul.sharma@gmail.com"
                                        className={`${inputClasses(errors.email)} pl-10`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label htmlFor="signup-phone" className="block text-sm font-medium text-foreground">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-phone"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className={`${inputClasses(errors.phone)} pl-10`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-xs text-destructive">{errors.phone}</p>
                                )}
                            </div>

                            {/* User Type */}
                            <div className="space-y-1.5">
                                <label htmlFor="signup-userType" className="block text-sm font-medium text-foreground">
                                    I am a
                                </label>
                                <select
                                    id="signup-userType"
                                    name="userType"
                                    value={formData.userType}
                                    onChange={handleChange}
                                    className={inputClasses(errors.userType)}
                                >
                                    <option value="buyer">Buyer</option>
                                    <option value="seller">Seller</option>
                                    <option value="agent">Real Estate Agent</option>
                                </select>
                                {errors.userType && (
                                    <p className="text-xs text-destructive">{errors.userType}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="space-y-1.5">
                                <label htmlFor="signup-address" className="block text-sm font-medium text-foreground">
                                    Address
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-address"
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Andheri West, Mumbai, Maharashtra"
                                        className={`${inputClasses(errors.address)} pl-10`}
                                    />
                                </div>
                                {errors.address && (
                                    <p className="text-xs text-destructive">{errors.address}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label htmlFor="signup-password" className="block text-sm font-medium text-foreground">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`${inputClasses(errors.password)} pl-10 pr-10`}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-destructive">{errors.password}</p>
                                )}
                                {formData.password && (
                                    <div className="mt-3">
                                        <PasswordStrengthIndicator
                                            password={formData.password}
                                            validation={validatePasswordStrength(formData.password, {
                                                name: formData.name,
                                                email: formData.email
                                            })}
                                            showRequirements={true}
                                            showSuggestions={false}
                                            compact={false}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label htmlFor="signup-confirmPassword" className="block text-sm font-medium text-foreground">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        autoComplete="new-password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`${inputClasses(errors.confirmPassword)} pl-10 pr-10`}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        {/* Consent Section - GDPR Compliance */}
                        <div className="space-y-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Shield className="w-4 h-4 text-primary" />
                                <span>Privacy & Consent</span>
                            </div>
                            
                            {/* Terms of Service */}
                            <label htmlFor="signup-acceptTerms" className="flex items-start gap-3 cursor-pointer select-none">
                                <input
                                    id="signup-acceptTerms"
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={handleChange}
                                    className={`mt-0.5 w-4 h-4 rounded border bg-background text-primary focus:ring-primary focus:ring-2 ${
                                        errors.acceptTerms ? "border-destructive" : "border-border"
                                    }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                    I agree to the{" "}
                                    <Link to="/terms" className="font-medium text-primary hover:underline" target="_blank">
                                        Terms of Service
                                    </Link>
                                    <span className="text-destructive ml-1">*</span>
                                </span>
                            </label>
                            {errors.acceptTerms && (
                                <p className="text-xs text-destructive ml-7">{errors.acceptTerms}</p>
                            )}

                            {/* Privacy Policy */}
                            <label htmlFor="signup-acceptPrivacyPolicy" className="flex items-start gap-3 cursor-pointer select-none">
                                <input
                                    id="signup-acceptPrivacyPolicy"
                                    type="checkbox"
                                    name="acceptPrivacyPolicy"
                                    checked={formData.acceptPrivacyPolicy}
                                    onChange={handleChange}
                                    className={`mt-0.5 w-4 h-4 rounded border bg-background text-primary focus:ring-primary focus:ring-2 ${
                                        errors.acceptPrivacyPolicy ? "border-destructive" : "border-border"
                                    }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                    I have read and accept the{" "}
                                    <Link to="/privacy-policy" className="font-medium text-primary hover:underline" target="_blank">
                                        Privacy Policy
                                    </Link>
                                    <span className="text-destructive ml-1">*</span>
                                </span>
                            </label>
                            {errors.acceptPrivacyPolicy && (
                                <p className="text-xs text-destructive ml-7">{errors.acceptPrivacyPolicy}</p>
                            )}

                            {/* Data Processing Consent */}
                            <label htmlFor="signup-acceptDataProcessing" className="flex items-start gap-3 cursor-pointer select-none">
                                <input
                                    id="signup-acceptDataProcessing"
                                    type="checkbox"
                                    name="acceptDataProcessing"
                                    checked={formData.acceptDataProcessing}
                                    onChange={handleChange}
                                    className={`mt-0.5 w-4 h-4 rounded border bg-background text-primary focus:ring-primary focus:ring-2 ${
                                        errors.acceptDataProcessing ? "border-destructive" : "border-border"
                                    }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                    I consent to the processing of my personal data for account creation and service delivery
                                    <span className="text-destructive ml-1">*</span>
                                </span>
                            </label>
                            {errors.acceptDataProcessing && (
                                <p className="text-xs text-destructive ml-7">{errors.acceptDataProcessing}</p>
                            )}

                            <p className="text-xs text-muted-foreground ml-7">
                                You can manage your privacy settings and withdraw consent at any time from your account dashboard.
                            </p>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading || submitSuccess}
                            className="w-full h-10 text-base font-semibold"
                        >
                            {loading
                                ? "Creating Account..."
                                : submitSuccess
                                    ? "Preparing Verification..."
                                    : "Create Account"}
                        </Button>

                        {/* Footer */}
                        <div className="space-y-3">
                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link to="/login" className="font-medium text-primary hover:underline">
                                    Sign in here
                                </Link>
                            </p>
                            
                            <Link to="/" className="block text-center mt-2">
                                <Button
                                    variant="ghost"
                                    className="w-full text-base font-medium"
                                    type="button"
                                >
                                    Continue as Guest
                                </Button>
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold mb-2 text-foreground">Verify your Email</h2>
                            <p className="text-muted-foreground text-sm">
                                We've sent a 6-digit code to <span className="font-medium text-foreground">{formData.email}</span>.
                            </p>
                        </div>

                        {/* Messages */}
                        {otpError && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium">{otpError}</span>
                            </div>
                        )}
                        {otpSuccess && (
                            <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 text-success rounded-lg">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium">Email verified successfully! Redirecting...</span>
                            </div>
                        )}

                        {/* OTP Input */}
                        <div className="space-y-2">
                            <label htmlFor="otpCode" className="block text-sm font-medium text-foreground">
                                Verification Code
                            </label>
                            <input
                                id="otpCode"
                                type="text"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                placeholder="000000"
                                className={`${inputClasses(otpError)} text-center text-2xl tracking-[0.5em] font-mono py-3`}
                                disabled={loading || otpSuccess}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || otpSuccess || otpCode.length !== 6}
                            className="w-full h-12 text-base font-semibold"
                        >
                            {loading ? "Verifying..." : "Verify Email"}
                        </Button>

                        <div className="text-center pt-2">
                            <p className="text-sm text-muted-foreground">
                                Didn't receive the code?{" "}
                                <button
                                    type="button"
                                    onClick={() => sendOTP(localStorage.getItem("authToken"), formData.email)}
                                    disabled={resendLoading || loading || otpSuccess}
                                    className="font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resendLoading ? "Sending..." : "Resend"}
                                </button>
                            </p>
                        </div>
                    </form>
                )}



            {/* Security Note */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
                🔒 Your information is secure and encrypted
            </p>
        </div>
    );
}
