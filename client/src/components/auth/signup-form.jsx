"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { validatePasswordStrength } from "../../utils/passwordValidation";
import PasswordStrengthIndicator from "../ui/password-strength-indicator";
import { User, Mail, Phone, MapPin, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function SignupForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        userType: "buyer",
        password: "",
        confirmPassword: "",
        agreeToTerms: false,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

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

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";

        if (!formData.agreeToTerms)
            newErrors.agreeToTerms = "You must accept the terms";

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
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    userType: formData.userType,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSubmitError(data.error || "Signup failed. Try again.");
            } else {
                setSubmitSuccess(true);
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("token", data.token);

                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            }
        } catch (err) {
            setSubmitError(err.message || "Signup failed.");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = (hasError) =>
        `w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
            hasError
                ? "border-destructive focus:ring-destructive/50"
                : "border-border focus:ring-primary/50 focus:border-primary"
        }`;

    return (
        <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Create Your Account
                </h1>
                <p className="text-muted-foreground">
                    Join Renters to discover properties and connect with agents
                </p>
            </div>

            {/* Card */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
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
                            <span className="text-sm font-medium">Account created! Redirecting...</span>
                        </div>
                    )}

                    {/* Form Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
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
                                    placeholder="John Doe"
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
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
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
                                    placeholder="+1 (555) 123-4567"
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
                        <div className="md:col-span-2 space-y-1.5">
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
                                    placeholder="123 Main Street, City, State"
                                    className={`${inputClasses(errors.address)} pl-10`}
                                />
                            </div>
                            {errors.address && (
                                <p className="text-xs text-destructive">{errors.address}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label htmlFor="signup-password" className="block text-sm font-medium text-foreground">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="signup-password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`${inputClasses(errors.password)} pl-10`}
                                />
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
                                        showSuggestions={true}
                                        compact={false}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label htmlFor="signup-confirmPassword" className="block text-sm font-medium text-foreground">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="signup-confirmPassword"
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`${inputClasses(errors.confirmPassword)} pl-10`}
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    {/* Terms */}
                    <label htmlFor="signup-agreeToTerms" className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                            id="signup-agreeToTerms"
                            type="checkbox"
                            name="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={handleChange}
                            className={`mt-0.5 w-4 h-4 rounded border bg-background text-primary focus:ring-primary focus:ring-2 ${
                                errors.agreeToTerms ? "border-destructive" : "border-border"
                            }`}
                        />
                        <span className="text-sm text-muted-foreground">
                            I agree to the{" "}
                            <Link to="/terms" className="font-medium text-primary hover:underline">
                                Terms and Conditions
                            </Link>
                        </span>
                    </label>
                    {errors.agreeToTerms && (
                        <p className="text-xs text-destructive -mt-2">{errors.agreeToTerms}</p>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={loading || submitSuccess}
                        className="w-full py-3 text-base font-semibold"
                    >
                        {loading
                            ? "Creating Account..."
                            : submitSuccess
                                ? "Success!"
                                : "Create Account"}
                    </Button>

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/login" className="font-medium text-primary hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </form>
            </div>

            {/* Security Note */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
                🔒 Your information is secure and encrypted
            </p>
        </div>
    );
}
