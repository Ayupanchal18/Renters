import { useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../lib/api";
import { setToken, setUser } from "../utils/auth";
import { useSocket } from "../contexts/SocketContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const { initializeSocket } = useSocket();

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
                
                // Initialize socket connection after successful login (Requirement 4.2)
                initializeSocket();
                
                navigate("/dashboard");
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-md mx-auto px-4 py-16">
                <h1 className="text-2xl font-bold mb-4">Login</h1>

                <p className="text-gray-600 mb-6">
                    Sign in to manage your listings and messages.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded border border-destructive/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <Link to="/coming-soon" className="text-sm text-blue-600">
                            Forgot Password?
                        </Link>

                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Sign In"}
                        </Button>
                    </div>
                </form>

                {/* Signup Link */}
                <div className="mt-6 text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-blue-600">
                        Sign up
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
