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
        <section className="py-20 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-balance">
                    How We Help Users
                </h2>

                {/* Property Owners */}
                <div className="mb-20">
                    <h3 className="text-3xl font-bold mb-12 text-primary">
                        For Property Owners
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        {ownerFeatures.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={i}
                                    className="p-8 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                                >
                                    <div className="mb-4">
                                        <Icon className="w-12 h-12 text-primary" />
                                    </div>
                                    <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tenants */}
                <div>
                    <h3 className="text-3xl font-bold mb-12 text-primary">For Tenants</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        {tenantFeatures.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={i}
                                    className="p-8 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                                >
                                    <div className="mb-4">
                                        <Icon className="w-12 h-12 text-primary" />
                                    </div>
                                    <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                                    <p className="text-muted-foreground leading-relaxed">
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
