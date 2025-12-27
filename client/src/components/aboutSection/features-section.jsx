import {
    Building2,
    Users,
    Shield,
    MapPin,
    MessageCircle,
    BookmarkIcon,
} from "lucide-react";

const ownerFeatures = [
    {
        icon: Building2,
        title: "Easy Listing",
        description:
            "Post your property in minutes with our intuitive listing builder",
    },
    {
        icon: Users,
        title: "Verified Tenants",
        description: "Connect with verified, screened tenants through our platform",
    },
    {
        icon: Shield,
        title: "Dashboard",
        description:
            "Manage all your listings and tenant communications in one place",
    },
];

const tenantFeatures = [
    {
        icon: MapPin,
        title: "Smart Filters",
        description:
            "Find properties that match your preferences and budget instantly",
    },
    {
        icon: MessageCircle,
        title: "Direct Contact",
        description:
            "Connect directly with property owners with secure messaging",
    },
    {
        icon: BookmarkIcon,
        title: "Saved Listings",
        description:
            "Bookmark your favorite properties and track them over time",
    },
];

export default function FeaturesSection() {
    return (
        <section className="py-8 sm:py-12 md:py-16 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-10 md:mb-12 text-center text-balance">
                    How We Help Users
                </h2>

                {/* Property Owners */}
                <div className="mb-10 sm:mb-14 md:mb-16">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-5 sm:mb-8 text-primary">
                        For Property Owners
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {ownerFeatures.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={i}
                                    className="p-4 sm:p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                                >
                                    <div className="mb-3">
                                        <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" />
                                    </div>
                                    <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-2">{feature.title}</h4>
                                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tenants */}
                <div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-5 sm:mb-8 text-primary">For Tenants</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {tenantFeatures.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={i}
                                    className="p-4 sm:p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                                >
                                    <div className="mb-3">
                                        <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" />
                                    </div>
                                    <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-2">{feature.title}</h4>
                                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
