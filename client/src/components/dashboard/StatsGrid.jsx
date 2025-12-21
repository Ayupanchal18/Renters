import React from "react";
import { MessageSquare, Home, Heart, TrendingUp, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function StatsGrid({ listings, messages, favorites }) {
    const stats = [
        {
            icon: Home,
            label: "Your Listings",
            value: listings,
            link: "#properties",
            trend: "+2 this month",
            trendUp: true,
            iconBg: "bg-blue-500",
            cardBg: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20",
            borderColor: "border-blue-200/60 dark:border-blue-800/40",
        },
        {
            icon: MessageSquare,
            label: "Unread Messages",
            value: messages,
            link: "/messages",
            trend: messages > 0 ? "Needs attention" : "All caught up",
            trendUp: messages === 0,
            iconBg: "bg-purple-500",
            cardBg: "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20",
            borderColor: "border-purple-200/60 dark:border-purple-800/40",
        },
        {
            icon: Heart,
            label: "Wishlist",
            value: favorites,
            link: "/wishlist",
            trend: "Your favorites",
            trendUp: true,
            iconBg: "bg-rose-500",
            cardBg: "bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20",
            borderColor: "border-rose-200/60 dark:border-rose-800/40",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;

                return (
                    <Link
                        key={idx}
                        to={stat.link}
                        className={`group relative ${stat.cardBg} rounded-2xl p-5 border ${stat.borderColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                    >
                        {/* Decorative gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${stat.iconBg} p-3 rounded-xl text-white shadow-lg`}>
                                    <Icon size={22} />
                                </div>
                                <ArrowUpRight 
                                    size={18} 
                                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" 
                                />
                            </div>

                            <p className="text-muted-foreground text-sm font-medium mb-1">
                                {stat.label}
                            </p>

                            <p className="text-3xl font-bold text-foreground mb-2">{stat.value}</p>

                            <div className="flex items-center gap-1.5">
                                <TrendingUp 
                                    size={14} 
                                    className={stat.trendUp ? "text-success" : "text-warning"} 
                                />
                                <span className={`text-xs font-medium ${stat.trendUp ? "text-success" : "text-warning"}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
