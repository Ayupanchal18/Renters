import { useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../lib/api";
import { setToken, setUser } from "../utils/auth";
import { useSocket } from "../contexts/SocketContext";
import { Mail, Lock, ArrowRight, Shield, Sparkles } from "lucide-react";
import SocialLoginButtons from "../components/auth/SocialLoginButtons";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const { initializeSocket } = useSocket();

    // Get the intended destination from location state
    const from = location.state?.from?.pathname || "/dashboard";
    const isRedirectedFromProtectedRoute = location.state?.from;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await authAPI.login({ email, password }, navigate);

            if (result.error) {
                setError(result.error);
            } else {
                // Use auth utilities for proper token storage
                setToken(result.token);
                setUser(result.user);
                
                // Keep userId for backward compatibility with existing code
                localStorage.setItem("userId", result.user.id);
                
                // Initialize socket connection after successful login
                initializeSocket();
                
                // Smart redirect based on admin role & maintenance status
                if (result.user?.role === "admin") {
                    navigate("/admin", { replace: true });
                } else {
                    try {
                        const statusRes = await fetch("/api/maintenance/status").then(r => r.json());
                        if (statusRes.success && statusRes.data?.enabled) {
                            navigate("/maintenance", { state: { maintenanceInfo: statusRes.data }, replace: true });
                        } else {
                            navigate(from, { replace: true });
                        }
                    } catch (mErr) {
                        navigate(from, { replace: true });
                    }
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <Navbar />

            {/* Background Pattern */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            </div>

            <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
                <div className="w-full max-w-md">
                    {/* Login Card */}
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6 sm:p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <img 
                                src="/Logo1.png" 
                                alt="Renters Logo" 
                                className="w-14 h-14 object-contain"
                            />
                            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
                            <p className="text-muted-foreground text-sm">
                                {isRedirectedFromProtectedRoute 
                                    ? "Please sign in to continue to your requested page"
                                    : "Sign in to manage your listings and messages"
                                }
                            </p>
                        </div>

                        {/* Redirect Notice */}
                        {isRedirectedFromProtectedRoute && (
                            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl border border-blue-200 dark:border-blue-800 text-sm flex items-center gap-2">
                                <Lock className="w-4 h-4 flex-shrink-0" />
                                <span>
                                    Authentication required to access <strong>{from}</strong>
                                </span>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="login-email" className="block text-sm font-medium text-foreground">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                                    <Input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        autoComplete="username email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 bg-background border-border focus:border-primary rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="login-password" className="block text-sm font-medium text-foreground">
                                        Password
                                    </label>
                                    <Link 
                                        to="/coming-soon" 
                                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                                    <Input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 bg-background border-border focus:border-primary rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Signing in...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        Sign In
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                )}
                            </Button>
                        </form>

                        {/* Divider for social login */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-card text-muted-foreground">or continue with</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <SocialLoginButtons 
                            disabled={loading}
                            onError={(err) => setError(err)}
                        />

                        {/* Divider for Signup */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-card text-muted-foreground">New to Renters?</span>
                            </div>
                        </div>

                        {/* Signup Link */}
                        <Link to="/signup" className="block">
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl font-medium border-border hover:bg-muted hover:border-primary/30 transition-all"
                            >
                                Create an Account
                            </Button>
                        </Link>

                        {/* Guest Link */}
                        <div className="mt-4">
                            <Link to="/" className="block">
                                <Button
                                    variant="ghost"
                                    className="w-full h-12 rounded-xl font-medium transition-all"
                                >
                                    Continue as Guest
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <span>Secure Login</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>100K+ Users</span>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
