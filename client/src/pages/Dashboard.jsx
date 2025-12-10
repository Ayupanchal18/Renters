import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import {
    useUser,
    useProperties,
    useConversations,
    useWishlist,
} from "../hooks/useAPI";
import { useEffect } from "react";
import ProfileCard from "../components/dashboard/ProfileCard";
import StatsGrid from "../components/dashboard/StatsGrid";
import PersonalInfoSection from "../components/dashboard/PersonalInfoSection";
import VerificationSection from "../components/dashboard/VerificationSection";
import PropertiesSection from "../components/dashboard/PropertiesSection";
import SecuritySection from "../components/dashboard/SecuritySection";

export default function Dashboard() {
    const navigate = useNavigate();

    const { data: user, isLoading: userLoading } = useUser();
    const { data: propsData } = useProperties({ limit: 100 });
    const { data: conversations } = useConversations();
    const { data: wishlist } = useWishlist();

    useEffect(() => {
        if (!localStorage.getItem("userId")) {
            navigate("/login");
        }
    }, [navigate]);

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
                <div className="text-center">
                    <div className="inline-block animate-pulse">
                        <div className="w-12 h-12 bg-primary rounded-full"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const userListings =
        propsData?.items?.filter((p) => p.owner === user?.id) || [];

    const unreadMessages =
        conversations?.filter((c) => c.unreadCount?.get(user?.id) > 0).length || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-primary/2 to-accent/5">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}! 👋</h1>
                    <p className="text-gray-600">Manage your properties, verify your account, and keep your security settings updated</p>
                </div>

                {/* Profile Card */}
                <div className="mb-12">
                    <ProfileCard
                        user={user}
                        completion={45}
                        onPostProperty={() => navigate("/post-property")}
                    />
                </div>

                {/* Stats Grid */}
                <div className="mb-12">
                    <StatsGrid
                        listings={userListings.length}
                        messages={unreadMessages}
                        favorites={wishlist?.length || 0}
                    />
                </div>

                {/* Personal Information */}
                <div className="mb-12">
                    <PersonalInfoSection user={user} />
                </div>

                {/* Verification Status */}
                <div className="mb-12">
                    <VerificationSection
                        status={{
                            email: user?.emailVerified ? 'verified' : 'pending',
                            phone: 'unverified',
                            kyc: 'pending',
                            ownerVerification: 'unverified',
                        }}
                    />
                </div>

                {/* Properties Section */}
                <div className="mb-12">
                    <PropertiesSection properties={userListings} />
                </div>

                {/* Security Section */}
                <div className="mb-12">
                    <SecuritySection />
                </div>
            </main>

            <Footer />
        </div>
    );
}
