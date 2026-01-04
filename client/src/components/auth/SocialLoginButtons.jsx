import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { setToken, setUser } from "../../utils/auth";
import { useSocket } from "../../contexts/SocketContext";

/**
 * SocialLoginButtons Component
 * 
 * Provides Google and Facebook OAuth login buttons.
 * Uses frontend SDKs to get tokens, then verifies with our backend.
 */
export default function SocialLoginButtons({ onSuccess, onError, disabled = false }) {
    const [loading, setLoading] = useState({ google: false, facebook: false });
    const navigate = useNavigate();
    const { initializeSocket } = useSocket();

    // Get OAuth client IDs from environment
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

    /* ─────────────────────── GOOGLE LOGIN ─────────────────────── */
    const handleGoogleLogin = async () => {
        if (!googleClientId || googleClientId === 'your_google_client_id') {
            const errorMsg = "Google login is not configured";
            console.warn(errorMsg);
            onError?.(errorMsg);
            return;
        }

        setLoading(prev => ({ ...prev, google: true }));

        try {
            // Load Google Identity Services library if not loaded
            if (!window.google?.accounts?.id) {
                await loadGoogleScript();
            }

            // Initialize Google Identity Services
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCallback,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            // Render the Google One Tap or prompt
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // If One Tap is blocked, use popup method
                    renderGoogleButton();
                }
            });
        } catch (error) {
            console.error("Google login error:", error);
            setLoading(prev => ({ ...prev, google: false }));
            onError?.(error.message || "Google login failed");
        }
    };

    const loadGoogleScript = () => {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.google?.accounts?.id) {
                resolve();
                return;
            }

            // Check if script is already being loaded
            const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
            if (existingScript) {
                // Wait for it to load
                existingScript.addEventListener('load', () => {
                    if (window.google?.accounts?.id) {
                        resolve();
                    } else {
                        reject(new Error("Google SDK loaded but not initialized"));
                    }
                });
                existingScript.addEventListener('error', () => {
                    reject(new Error("Failed to load Google SDK. Please check your internet connection or disable ad blockers."));
                });
                return;
            }

            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            
            // Set timeout for slow networks
            const timeout = setTimeout(() => {
                reject(new Error("Google SDK loading timed out. Please check your internet connection."));
            }, 10000); // 10 second timeout

            script.onload = () => {
                clearTimeout(timeout);
                // Give the SDK time to initialize
                setTimeout(() => {
                    if (window.google?.accounts?.id) {
                        resolve();
                    } else {
                        reject(new Error("Google SDK loaded but not initialized"));
                    }
                }, 100);
            };
            
            script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error("Failed to load Google SDK. Please check your internet connection or disable ad blockers."));
            };
            
            document.head.appendChild(script);
        });
    };

    const renderGoogleButton = () => {
        // Create a temporary container for Google button
        const container = document.createElement("div");
        container.id = "google-signin-button";
        container.style.display = "none";
        document.body.appendChild(container);

        window.google.accounts.id.renderButton(container, {
            type: "standard",
            theme: "outline",
            size: "large",
        });

        // Trigger click on the hidden button
        const googleButton = container.querySelector('[role="button"]');
        if (googleButton) {
            googleButton.click();
        }

        // Clean up
        setTimeout(() => container.remove(), 100);
    };

    const handleGoogleCallback = async (response) => {
        try {
            const result = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ credential: response.credential }),
            });

            const data = await result.json();

            if (!result.ok) {
                throw new Error(data.error || "Google authentication failed");
            }

            // Success - store auth and redirect
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("userId", data.user.id);
            initializeSocket();
            
            onSuccess?.(data);
            navigate("/dashboard");
        } catch (error) {
            console.error("Google callback error:", error);
            onError?.(error.message || "Google login failed");
        } finally {
            setLoading(prev => ({ ...prev, google: false }));
        }
    };

    /* ─────────────────────── FACEBOOK LOGIN ─────────────────────── */
    const handleFacebookLogin = async () => {
        if (!facebookAppId || facebookAppId === 'your_facebook_app_id') {
            const errorMsg = "Facebook login is not configured";
            console.warn(errorMsg);
            onError?.(errorMsg);
            return;
        }

        setLoading(prev => ({ ...prev, facebook: true }));

        try {
            // Load Facebook SDK if not loaded
            if (!window.FB) {
                await loadFacebookScript();
            }

            // Login with Facebook
            window.FB.login(handleFacebookCallback, {
                scope: "email,public_profile",
                return_scopes: true,
            });
        } catch (error) {
            console.error("Facebook login error:", error);
            setLoading(prev => ({ ...prev, facebook: false }));
            onError?.(error.message || "Facebook login failed");
        }
    };

    const loadFacebookScript = () => {
        return new Promise((resolve, reject) => {
            if (window.FB) {
                resolve();
                return;
            }

            window.fbAsyncInit = function () {
                window.FB.init({
                    appId: facebookAppId,
                    cookie: true,
                    xfbml: true,
                    version: "v18.0",
                });
                resolve();
            };

            const script = document.createElement("script");
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
            document.head.appendChild(script);
        });
    };

    const handleFacebookCallback = async (response) => {
        try {
            if (response.status !== "connected") {
                throw new Error("Facebook login was cancelled");
            }

            const result = await fetch("/api/auth/facebook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ accessToken: response.authResponse.accessToken }),
            });

            const data = await result.json();

            if (!result.ok) {
                throw new Error(data.error || "Facebook authentication failed");
            }

            // Success - store auth and redirect
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("userId", data.user.id);
            initializeSocket();
            
            onSuccess?.(data);
            navigate("/dashboard");
        } catch (error) {
            console.error("Facebook callback error:", error);
            onError?.(error.message || "Facebook login failed");
        } finally {
            setLoading(prev => ({ ...prev, facebook: false }));
        }
    };

    const isAnyLoading = loading.google || loading.facebook || disabled;

    return (
        <div className="space-y-3">
            {/* Google Login Button */}
            <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isAnyLoading}
                className="w-full h-12 rounded-xl font-medium border-border hover:bg-muted hover:border-primary/30 transition-all flex items-center justify-center gap-3"
            >
                {loading.google ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="3"
                        />
                        <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                )}
                <span>Continue with Google</span>
            </Button>

            {/* Facebook Login Button */}
            <Button
                type="button"
                variant="outline"
                onClick={handleFacebookLogin}
                disabled={isAnyLoading}
                className="w-full h-12 rounded-xl font-medium border-border hover:bg-muted hover:border-[#1877F2]/30 transition-all flex items-center justify-center gap-3"
            >
                {loading.facebook ? (
                    <svg className="w-5 h-5 animate-spin text-[#1877F2]" viewBox="0 0 24 24" fill="none">
                        <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="3"
                        />
                        <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                )}
                <span>Continue with Facebook</span>
            </Button>
        </div>
    );
}
