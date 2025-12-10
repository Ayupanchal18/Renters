"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

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

        // Name
        if (!formData.name.trim()) newErrors.name = "Full name is required";
        else if (formData.name.trim().length < 2)
            newErrors.name = "Name must be at least 2 characters";

        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!emailRegex.test(formData.email))
            newErrors.email = "Please enter a valid email address";

        // Phone
        const phoneRegex = /^[0-9+\-\s]{10,}$/;
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
        else if (!phoneRegex.test(formData.phone.replace(/\s/g, "")))
            newErrors.phone = "Please enter a valid phone number";

        // Address
        if (!formData.address.trim()) newErrors.address = "Address is required";
        else if (formData.address.trim().length < 5)
            newErrors.address = "Address must be at least 5 characters";

        // User type
        if (!formData.userType) newErrors.userType = "Please select a user type";

        // Password
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 6)
            newErrors.password = "Password must be at least 6 characters";
        else if (!/[A-Z]/.test(formData.password))
            newErrors.password = "Must contain at least one uppercase letter";
        else if (!/[0-9]/.test(formData.password))
            newErrors.password = "Must contain at least one number";

        // Confirm password
        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";

        // Terms
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

        // Clear error when user starts typing
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

    /* ────────────────────── JSX ────────────────────── */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 md:p-10 lg:p-12 transition-all duration-300">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Global messages */}
                    {submitError && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium animate-pulse">
                            {submitError}
                        </div>
                    )}
                    {submitSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2 animate-fadeIn">
                            <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Account created! Redirecting...
                        </div>
                    )}

                    {/* Grid */}
                    <div className="grid md:grid-cols-2 gap-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className={`w-full px-4 py-2.5 rounded-lg border${errors.name
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:outline-none focus:ring-2 transition-colors`}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                className={`w-full px-4 py-2.5 rounded-lg border${errors.email
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:outline-none focus:ring-2 transition-colors`}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 (555) 123-4567"
                                className={`w-full px-4 py-2.5 rounded-lg border${errors.phone
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:outline-none focus:ring-2 transition-colors`}
                            />
                            {errors.phone && (
                                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                            )}
                        </div>

                        {/* User Type */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                I am a
                            </label>
                            <select
                                name="userType"
                                value={formData.userType}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border${errors.userType
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:outline-none focus:ring-2 transition-colors`}
                            >
                                <option value="buyer">Buyer</option>
                                <option value="seller">Seller</option>
                                <option value="agent">Real Estate Agent</option>
                            </select>
                            {errors.userType && (
                                <p className="text-xs text-red-600 mt-1">{errors.userType}</p>
                            )}
                        </div>

                        {/* Address (full width) */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 Main Street, City, State"
                                className={`w-full px-4 py-2.5 rounded-lg border${errors.address
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:outline-none focus:ring-2 transition-colors`}
                            />
                            {errors.address && (
                                <p className="text-xs text-red-600 mt-1">{errors.address}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className={`w-full px-4 py-2.5 rounded-lg border${errors.password
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:outline-none focus:ring-2 transition-colors`}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className={`w-full px-4 py-2.5 rounded-lg border${errors.confirmPassword
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:outline-none focus:ring-2 transition-colors`}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            name="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={handleChange}
                            className={`w-5 h-5 rounded border${errors.agreeToTerms
                                ? "border-red-500 text-red-600"
                                : "border-slate-300 text-primary"
                                } focus:ring-primary focus:ring-2`}
                        />
                        <span className="text-sm text-slate-700">
                            I agree to the{" "}
                            <a
                                href="#"
                                className="font-medium text-primary hover:underline"
                            >
                                Terms and Conditions
                            </a>
                        </span>
                    </label>
                    {errors.agreeToTerms && (
                        <p className="text-xs text-red-600 -mt-2">{errors.agreeToTerms}</p>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={loading || submitSuccess}
                        className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-200 disabled:opacity-70"
                    >
                        {loading
                            ? "Creating Account..."
                            : submitSuccess
                                ? "Success!"
                                : "Create Account"}
                    </Button>

                    {/* Footer */}
                    <p className="text-center text-sm text-slate-600">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-primary hover:underline"
                        >
                            Sign in here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

/* Tiny CSS animations (you can put them in globals.css) */