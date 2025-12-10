import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Building2, Menu, X, Bell, LogOut, User, Heart, BookmarkCheck, ChevronDown } from 'lucide-react';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        setIsLoggedIn(!!userId);
    }, []);

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        window.location.href = "/";
    };

    const publicLinks = [
        { to: "/", label: "Home" },
        { to: "/listings", label: "All Listings" },
        { to: "/about", label: "About Us" },
        { to: "/contact", label: "Contact" },
        { to: "/blog", label: "Blog" },
    ];

    const userLinks = [
        { to: "/listings", label: "All Listings" },
        { to: "/saved", label: "Saved" },
        { to: "/wishlist", label: "Wishlist" },
    ];

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Row */}
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                    >
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <span>EstateHub</span>
                    </Link>

                    {/* Desktop Menu Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {isLoggedIn ? (
                            userLinks.map((link) => (
                                <Link key={link.to} to={link.to}>
                                    <Button
                                        variant="ghost"
                                        className={`font-medium transition-all${isActive(link.to)
                                            ? "text-blue-600 bg-blue-50"
                                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {link.label}
                                    </Button>
                                </Link>
                            ))
                        ) : (
                            publicLinks.map((link) => (
                                <Link key={link.to} to={link.to}>
                                    <Button
                                        variant="ghost"
                                        className={`font-medium transition-all${isActive(link.to)
                                            ? "text-blue-600 bg-blue-50"
                                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {link.label}
                                    </Button>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Desktop Auth & Action Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-2">
                                {/* Notification Icon */}
                                <Link to="/notifications">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative hover:bg-gray-100"
                                    >
                                        <Bell className="h-5 w-5 text-gray-700" />
                                        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                                    </Button>
                                </Link>

                                {/* Post Property Button */}
                                <Link to="/post-property">
                                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all">
                                        Post Property
                                    </Button>
                                </Link>

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <ChevronDown
                                            className={`h-4 w-4 text-gray-600 transition-transform${profileMenuOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    {/* Profile Dropdown Menu */}
                                    {profileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                            <Link to="/dashboard">
                                                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                                                    <User className="h-4 w-4" />
                                                    <span className="font-medium">My Profile</span>
                                                </button>
                                            </Link>
                                            <Link to="/notifications">
                                                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                                                    <Bell className="h-4 w-4" />
                                                    <span className="font-medium">Notifications</span>
                                                </button>
                                            </Link>
                                            <Link to="/saved">
                                                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                                                    <BookmarkCheck className="h-4 w-4" />
                                                    <span className="font-medium">Saved Properties</span>
                                                </button>
                                            </Link>
                                            <Link to="/wishlist">
                                                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                                                    <Heart className="h-4 w-4" />
                                                    <span className="font-medium">Wishlist</span>
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setProfileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100 mt-2"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span className="font-medium">Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login">
                                    <Button
                                        variant="ghost"
                                        className="text-gray-700 font-medium hover:text-blue-600"
                                    >
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button
                                        variant="outline"
                                        className="font-medium border-gray-300"
                                    >
                                        Sign Up
                                    </Button>
                                </Link>
                                <Link to="/post-property">
                                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all">
                                        Post Property
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 animate-in slide-in-from-top-2">
                        <div className="flex flex-col gap-2 mb-4">
                            {isLoggedIn ? (
                                userLinks.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <button
                                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all${isActive(link.to)
                                                ? "text-blue-600 bg-blue-50"
                                                : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {link.label}
                                        </button>
                                    </Link>
                                ))
                            ) : (
                                publicLinks.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <button
                                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all${isActive(link.to)
                                                ? "text-blue-600 bg-blue-50"
                                                : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {link.label}
                                        </button>
                                    </Link>
                                ))
                            )}
                        </div>

                        {/* Mobile Auth Section */}
                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                            {isLoggedIn ? (
                                <>
                                    <Link
                                        to="/notifications"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2"
                                        >
                                            <Bell className="h-4 w-4" />
                                            Notifications
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2"
                                        >
                                            <User className="h-4 w-4" />
                                            My Profile
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/saved"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2"
                                        >
                                            <BookmarkCheck className="h-4 w-4" />
                                            Saved Properties
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/wishlist"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2"
                                        >
                                            <Heart className="h-4 w-4" />
                                            Wishlist
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/post-property"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                            Post Property
                                        </Button>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full"
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2 text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </Button>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">
                                            Sign Up
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/post-property"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                            Post Property
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
