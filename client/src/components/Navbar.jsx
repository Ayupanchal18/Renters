import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Building2, Menu, X, Bell, LogOut, User, Heart, ChevronDown, Shield, MessageSquare, Check, Key, Home as HomeIcon } from 'lucide-react';
import { isAuthenticated, logout, getUser } from "../utils/auth";
import { ThemeToggle } from "./ui/theme-toggle";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import { useUnreadCounts } from "../hooks/useUnreadCounts";
import { useNotifications } from "../hooks/useNotifications";
import { LISTING_TYPES, LISTING_TYPE_LABELS } from '@shared/propertyTypes';

/**
 * Navbar variant styles using CVA
 * - default: Glass blur effect with semi-transparent background
 * - gradient: Premium gradient from primary to tertiary colors
 * - transparent: Fully transparent for hero sections
 */
const navbarVariants = cva(
    // Base styles: sticky positioning, z-index, transition
    "sticky top-0 z-50 transition-all duration-normal",
    {
        variants: {
            variant: {
                default: [
                    // Glass blur effect with backdrop-filter: blur(10px)
                    "backdrop-blur-[10px]",
                    "bg-background/80",
                    // Subtle bottom border
                    "border-b border-border/50",
                    "shadow-sm",
                    // Support for browsers without backdrop-filter
                    "supports-[backdrop-filter]:bg-background/70",
                ].join(" "),
                gradient: [
                    // Premium gradient from primary to tertiary
                    "bg-gradient-to-r from-primary via-primary/90 to-tertiary/80",
                    "backdrop-blur-[10px]",
                    "border-b border-white/10",
                    "shadow-md",
                    // Text should be light on gradient
                    "[&_*]:text-white [&_.text-foreground]:text-white/90",
                ].join(" "),
                transparent: [
                    // Transparent variant for hero sections
                    "bg-transparent",
                    "border-b border-transparent",
                    // No shadow for transparent variant
                ].join(" "),
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export default function Navbar({ variant = "default" }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    // Listing type context for rent vs buy
    const [listingTypeContext, setListingTypeContext] = useState(LISTING_TYPES.RENT);
    const location = useLocation();
    const navigate = useNavigate();
    const notificationDropdownRef = useRef(null);

    // Use unread counts hook for real-time badge updates
    const {
        messageCount,
        notificationCount
    } = useUnreadCounts({ autoConnect: isLoggedIn, autoFetch: isLoggedIn });

    // Use notifications hook for dropdown preview
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        fetchNotifications
    } = useNotifications({ autoConnect: isLoggedIn, autoFetch: isLoggedIn });

    // Get recent notifications for dropdown (max 5)
    const recentNotifications = notifications.slice(0, 5);

    useEffect(() => {
        setIsLoggedIn(isAuthenticated());
        // Check if user is admin
        const user = getUser();
        setIsAdmin(user?.role === 'admin');
    }, [location.pathname]); // Re-check authentication when route changes

    // Detect listing type context from URL
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/buy') || path.includes('buy-properties')) {
            setListingTypeContext(LISTING_TYPES.BUY);
        } else if (path.startsWith('/rent') || path.includes('rent-properties')) {
            setListingTypeContext(LISTING_TYPES.RENT);
        }
    }, [location.pathname]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
                setNotificationDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (notificationDropdownOpen && isLoggedIn) {
            fetchNotifications({ page: 1, limit: 5 });
        }
    }, [notificationDropdownOpen, isLoggedIn, fetchNotifications]);

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout(navigate);
        setIsLoggedIn(false);
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
        setNotificationDropdownOpen(false);
    };

    // Handle notification click - mark as read and navigate
    const handleNotificationClick = async (notification) => {
        const notificationId = notification._id || notification.id;
        if (!notification.read) {
            await markAsRead(notificationId);
        }
        setNotificationDropdownOpen(false);

        // Navigate to conversation if it's a message notification
        if (notification.type === 'message' && notification.data?.conversationId) {
            navigate(`/messages?conversation=${notification.data.conversationId}`);
        } else {
            navigate('/notifications');
        }
    };

    // Format relative time for notifications
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const publicLinks = [
        { to: "/", label: "Home" },
        { to: "/rent-properties", label: "Rent", listingType: LISTING_TYPES.RENT },
        { to: "/buy-properties", label: "Buy", listingType: LISTING_TYPES.BUY },
        { to: "/about", label: "About Us" },
        { to: "/contact", label: "Contact" },
    ];

    const userLinks = [
        { to: "/rent-properties", label: "Rent", listingType: LISTING_TYPES.RENT },
        { to: "/buy-properties", label: "Buy", listingType: LISTING_TYPES.BUY },
        { to: "/messages", label: "Messages", showBadge: true, badgeCount: messageCount },
        { to: "/wishlist", label: "Wishlist" },
    ];

    // Determine if we're using a variant that needs light text
    const isGradientVariant = variant === "gradient";

    return (
        <nav className={cn(navbarVariants({ variant }))}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Row */}
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link
                        to="/"
                        className={cn(
                            "flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity",
                            isGradientVariant
                                ? "text-white"
                                : "bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-lg",
                            isGradientVariant
                                ? "bg-white/20"
                                : "bg-gradient-to-br from-primary to-primary"
                        )}>
                            <Building2 className={cn(
                                "h-6 w-6",
                                isGradientVariant ? "text-white" : "text-primary-foreground"
                            )} />
                        </div>
                        <span>Renters</span>
                    </Link>

                    {/* Desktop Menu Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {isLoggedIn ? (
                            userLinks.map((link) => (
                                <Link key={link.to} to={link.to}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "font-medium transition-all relative",
                                            isActive(link.to) || (link.listingType && link.listingType === listingTypeContext && (location.pathname.includes('rent') || location.pathname.includes('buy')))
                                                ? isGradientVariant
                                                    ? "text-white bg-white/20"
                                                    : "text-primary bg-primary/10"
                                                : isGradientVariant
                                                    ? "text-white/90 hover:text-white hover:bg-white/10"
                                                    : "text-foreground hover:text-primary hover:bg-muted"
                                        )}
                                    >
                                        {/* Icon for Rent/Buy links */}
                                        {link.listingType === LISTING_TYPES.RENT && <Key className="w-4 h-4 mr-1.5" />}
                                        {link.listingType === LISTING_TYPES.BUY && <HomeIcon className="w-4 h-4 mr-1.5" />}
                                        {link.label}
                                        {/* Unread badge for messages */}
                                        {link.showBadge && link.badgeCount > 0 && (
                                            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                                                {link.badgeCount > 99 ? '99+' : link.badgeCount}
                                            </span>
                                        )}
                                    </Button>
                                </Link>
                            ))
                        ) : (
                            publicLinks.map((link) => (
                                <Link key={link.to} to={link.to}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "font-medium transition-all",
                                            isActive(link.to) || (link.listingType && link.listingType === listingTypeContext && (location.pathname.includes('rent') || location.pathname.includes('buy')))
                                                ? isGradientVariant
                                                    ? "text-white bg-white/20"
                                                    : "text-primary bg-primary/10"
                                                : isGradientVariant
                                                    ? "text-white/90 hover:text-white hover:bg-white/10"
                                                    : "text-foreground hover:text-primary hover:bg-muted"
                                        )}
                                    >
                                        {/* Icon for Rent/Buy links */}
                                        {link.listingType === LISTING_TYPES.RENT && <Key className="w-4 h-4 mr-1.5" />}
                                        {link.listingType === LISTING_TYPES.BUY && <HomeIcon className="w-4 h-4 mr-1.5" />}
                                        {link.label}
                                    </Button>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Desktop Auth & Action Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {isLoggedIn ? (
                            <div className="flex items-center gap-2">
                                {/* Notification Bell with Dropdown */}
                                <div className="relative" ref={notificationDropdownRef}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                                        className={cn(
                                            "relative",
                                            isGradientVariant
                                                ? "hover:bg-white/10"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <Bell className={cn(
                                            "h-5 w-5",
                                            isGradientVariant ? "text-white" : "text-foreground"
                                        )} />
                                        {/* Unread notification badge */}
                                        {notificationCount > 0 && (
                                            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                                                {notificationCount > 99 ? '99+' : notificationCount}
                                            </span>
                                        )}
                                    </Button>

                                    {/* Notification Dropdown */}
                                    {notificationDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-popover rounded-xl shadow-lg border border-border py-2 z-50 max-h-96 overflow-hidden">
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                                                <h3 className="font-semibold text-popover-foreground">Notifications</h3>
                                                {notificationCount > 0 && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            await markAllAsRead();
                                                        }}
                                                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            {/* Notification List */}
                                            <div className="max-h-64 overflow-y-auto">
                                                {recentNotifications.length > 0 ? (
                                                    recentNotifications.map((notification) => (
                                                        <button
                                                            key={notification._id || notification.id}
                                                            onClick={() => handleNotificationClick(notification)}
                                                            className={cn(
                                                                "w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-b-0",
                                                                !notification.read && "bg-primary/5"
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                {/* Unread indicator */}
                                                                {!notification.read && (
                                                                    <span className="mt-2 h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                                                                )}
                                                                <div className={cn("flex-1 min-w-0", notification.read && "ml-5")}>
                                                                    <p className="font-medium text-sm text-popover-foreground truncate">
                                                                        {notification.title}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                                        {notification.message}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                                                        {formatRelativeTime(notification.createdAt)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-8 text-center text-muted-foreground">
                                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">No notifications yet</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer - Link to full notifications page */}
                                            <div className="border-t border-border px-4 py-2">
                                                <Link
                                                    to="/notifications"
                                                    onClick={() => setNotificationDropdownOpen(false)}
                                                    className="block text-center text-sm text-primary hover:text-primary/80 font-medium"
                                                >
                                                    View all notifications
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Post Property Button - Primary CTA on right side (Requirement 4.4) */}
                                <Link to="/post-property">
                                    <Button className={cn(
                                        "font-medium shadow-md hover:shadow-lg transition-all",
                                        isGradientVariant
                                            ? "bg-white text-primary hover:bg-white/90"
                                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                    )}>
                                        Post Property
                                    </Button>
                                </Link>

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                                            isGradientVariant
                                                ? "hover:bg-white/10"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center rounded-md",
                                            isGradientVariant
                                                ? "bg-white/20"
                                                : "bg-gradient-to-br from-primary to-primary"
                                        )}>
                                            <User className={cn(
                                                "h-4 w-4",
                                                isGradientVariant ? "text-white" : "text-primary-foreground"
                                            )} />
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 transition-transform",
                                                isGradientVariant ? "text-white/70" : "text-muted-foreground",
                                                profileMenuOpen && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {/* Profile Dropdown Menu */}
                                    {profileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-popover rounded-xl shadow-lg border border-border py-2 z-50">
                                            <Link to="/dashboard">
                                                <button className="w-full text-left px-4 py-2 text-popover-foreground hover:bg-muted flex items-center gap-2 transition-colors">
                                                    <User className="h-4 w-4" />
                                                    <span className="font-medium">My Profile</span>
                                                </button>
                                            </Link>
                                            <Link to="/notifications">
                                                <button className="w-full text-left px-4 py-2 text-popover-foreground hover:bg-muted flex items-center gap-2 transition-colors">
                                                    <Bell className="h-4 w-4" />
                                                    <span className="font-medium">Notifications</span>
                                                </button>
                                            </Link>
                                            <Link to="/wishlist">
                                                <button className="w-full text-left px-4 py-2 text-popover-foreground hover:bg-muted flex items-center gap-2 transition-colors">
                                                    <Heart className="h-4 w-4" />
                                                    <span className="font-medium">Wishlist</span>
                                                </button>
                                            </Link>
                                            {/* Admin Panel Link - Only visible for admin users */}
                                            {isAdmin && (
                                                <Link to="/admin">
                                                    <button className="w-full text-left px-4 py-2 text-primary hover:bg-primary/10 flex items-center gap-2 transition-colors border-t border-border">
                                                        <Shield className="h-4 w-4" />
                                                        <span className="font-medium">Admin Panel</span>
                                                    </button>
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setProfileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors border-t border-border mt-2"
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
                                        className={cn(
                                            "font-medium",
                                            isGradientVariant
                                                ? "text-white hover:text-white hover:bg-white/10"
                                                : "text-foreground hover:text-primary"
                                        )}
                                    >
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "font-medium",
                                            isGradientVariant
                                                ? "border-white/30 text-white hover:bg-white/10"
                                                : "border-border"
                                        )}
                                    >
                                        Sign Up
                                    </Button>
                                </Link>
                                {/* Post Property Button - Redirects to login for non-authenticated users */}
                                <Link to="/login" state={{ from: '/post-property', message: 'Please login to post a property' }}>
                                    <Button className={cn(
                                        "font-medium shadow-md hover:shadow-lg transition-all",
                                        isGradientVariant
                                            ? "bg-white text-primary hover:bg-white/90"
                                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                    )}>
                                        Post Property
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                isGradientVariant
                                    ? "hover:bg-white/10 text-white"
                                    : "hover:bg-muted"
                            )}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className={cn(
                        "md:hidden py-3 animate-in slide-in-from-top-2",
                        isGradientVariant
                            ? "border-t border-white/20"
                            : "border-t border-border"
                    )}>
                        <div className="flex flex-col gap-1 mb-3">
                            {isLoggedIn ? (
                                userLinks.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <button
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center gap-2",
                                                isActive(link.to) || (link.listingType && link.listingType === listingTypeContext && (location.pathname.includes('rent') || location.pathname.includes('buy')))
                                                    ? isGradientVariant
                                                        ? "text-white bg-white/20"
                                                        : "text-primary bg-primary/10"
                                                    : isGradientVariant
                                                        ? "text-white/90 hover:bg-white/10"
                                                        : "text-foreground hover:bg-muted"
                                            )}
                                        >
                                            {/* Icon for Rent/Buy links */}
                                            {link.listingType === LISTING_TYPES.RENT && <Key className="w-4 h-4" />}
                                            {link.listingType === LISTING_TYPES.BUY && <HomeIcon className="w-4 h-4" />}
                                            {link.label}
                                            {/* Badge for messages */}
                                            {link.showBadge && link.badgeCount > 0 && (
                                                <span className="ml-auto h-5 w-5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                                                    {link.badgeCount > 99 ? '99+' : link.badgeCount}
                                                </span>
                                            )}
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
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center gap-2",
                                                isActive(link.to) || (link.listingType && link.listingType === listingTypeContext && (location.pathname.includes('rent') || location.pathname.includes('buy')))
                                                    ? isGradientVariant
                                                        ? "text-white bg-white/20"
                                                        : "text-primary bg-primary/10"
                                                    : isGradientVariant
                                                        ? "text-white/90 hover:bg-white/10"
                                                        : "text-foreground hover:bg-muted"
                                            )}
                                        >
                                            {/* Icon for Rent/Buy links */}
                                            {link.listingType === LISTING_TYPES.RENT && <Key className="w-4 h-4" />}
                                            {link.listingType === LISTING_TYPES.BUY && <HomeIcon className="w-4 h-4" />}
                                            {link.label}
                                        </button>
                                    </Link>
                                ))
                            )}
                        </div>

                        {/* Mobile Auth Section */}
                        <div className={cn(
                            "flex flex-col gap-1.5 pt-3",
                            isGradientVariant
                                ? "border-t border-white/20"
                                : "border-t border-border"
                        )}>
                            {isLoggedIn ? (
                                <>
                                    <Link
                                        to="/messages"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start gap-2 relative h-9 text-sm"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Messages
                                            {messageCount > 0 && (
                                                <span className="ml-auto h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                                                    {messageCount > 99 ? '99+' : messageCount}
                                                </span>
                                            )}
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/notifications"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start gap-2 relative h-9 text-sm"
                                        >
                                            <Bell className="h-4 w-4" />
                                            Notifications
                                            {notificationCount > 0 && (
                                                <span className="ml-auto h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                                                    {notificationCount > 99 ? '99+' : notificationCount}
                                                </span>
                                            )}
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start gap-2 h-9 text-sm"
                                        >
                                            <User className="h-4 w-4" />
                                            My Profile
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/wishlist"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start gap-2 h-9 text-sm"
                                        >
                                            <Heart className="h-4 w-4" />
                                            Wishlist
                                        </Button>
                                    </Link>
                                    {isAdmin && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start gap-2 text-primary border-primary hover:bg-primary/10 h-9 text-sm"
                                            >
                                                <Shield className="h-4 w-4" />
                                                Admin Panel
                                            </Button>
                                        </Link>
                                    )}
                                    <Link
                                        to="/post-property"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm">
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
                                            size="sm"
                                            className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 h-9 text-sm"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </Button>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" size="sm" className="w-full h-9 text-sm">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" size="sm" className="w-full h-9 text-sm">
                                            Sign Up
                                        </Button>
                                    </Link>
                                    <Link
                                        to="/login"
                                        state={{ from: '/post-property', message: 'Please login to post a property' }}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm">
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
