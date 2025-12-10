import { MessageSquare, Home, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function StatsGrid({ listings, messages, favorites }) {
    const stats = [
        {
            icon: Home,
            label: "Your Listings",
            value: listings,
            link: "#",
            color: "from-blue-500 to-blue-600",
            bg: "bg-blue-50",
        },
        {
            icon: MessageSquare,
            label: "Unread Messages",
            value: messages,
            link: "/messages",
            color: "from-purple-500 to-purple-600",
            bg: "bg-purple-50",
        },
        {
            icon: Heart,
            label: "Saved Properties",
            value: favorites,
            link: "/wishlist",
            color: "from-rose-500 to-rose-600",
            bg: "bg-rose-50",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;

                return (
                    <div
                        key={idx}
                        className={`${stat.bg} rounded-lg p-6 border border-gray-100 hover:shadow-lg transition-shadow`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className={`bg-gradient-to-br${stat.color} p-3 rounded-lg text-white`}
                            >
                                <Icon size={24} />
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm font-medium mb-2">
                            {stat.label}
                        </p>

                        {/* FIXED: changed value → stat.value */}
                        <p className="text-4xl font-bold text-gray-900">{stat.value}</p>

                        <Link
                            to={stat.link}
                            className="text-primary font-semibold text-sm mt-3 inline-block hover:underline"
                        >
                            View Details →
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
