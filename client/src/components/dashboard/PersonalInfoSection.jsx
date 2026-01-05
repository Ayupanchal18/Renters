import React, { useState } from "react";
import { User, Phone, Mail, Edit2, Sparkles } from "lucide-react";
import EditModal from "../../model/EditModal";
import { getToken, setUser as setUserInStorage, getUser } from "../../utils/auth";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";

export default function PersonalInfoSection({ user }) {
    const info = [
        { icon: User, label: "Full Name", value: user?.name, color: "bg-blue-500" },
        { icon: Mail, label: "Email", value: user?.email || "Not provided", color: "bg-emerald-500" },
        { icon: Phone, label: "Phone", value: user?.phone || "Not provided", color: "bg-orange-500" },
    ];

    const [openModal, setOpenModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [localUser, setLocalUser] = useState(user);

    const handleSave = async (updatedUser) => {
        const token = getToken();
        if (!token) {
            showErrorToast("Authentication required", "", { title: "Error" });
            return;
        }

        setIsUpdating(true);
        try {
            // Only send allowed fields (not email or phone - phone requires OTP verification)
            const updateData = {
                name: updatedUser.name,
                bio: updatedUser.about || updatedUser.bio,
            };

            // Include avatar if it was updated
            if (updatedUser.avatar !== undefined) {
                updateData.avatar = updatedUser.avatar;
            }

            const response = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to update profile');
            }

            // Update local state and localStorage
            const currentUser = getUser();
            const newUserData = { ...currentUser, ...data.data };
            setUserInStorage(newUserData);
            setLocalUser(newUserData);

            showSuccessToast("Profile updated successfully", "", { title: "Success" });
            setOpenModal(false);

            // Reload the page to reflect changes
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            showErrorToast(error.message || "Failed to update profile", "", { title: "Error" });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                        <Sparkles size={16} className="text-primary sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                            Personal Information
                        </h3>
                        <p className="text-xs text-muted-foreground hidden sm:block">Your profile details</p>
                    </div>
                </div>

                <button
                    onClick={() => setOpenModal(true)}
                    className="group inline-flex items-center gap-1 text-primary hover:bg-primary hover:text-primary-foreground px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 border border-primary/20 hover:border-primary"
                >
                    <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="text-xs sm:text-sm font-semibold">Edit</span>
                </button>
            </div>

            {/* Info Grid */}
            <div className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                    {info.map((item, idx) => {
                        const Icon = item.icon;
                        const isEmpty = item.value === "Not specified" || item.value === "Not provided";
                        
                        return (
                            <div 
                                key={idx} 
                                className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/40"
                            >
                                <div className={`${item.color} p-2 rounded-lg text-white`}>
                                    <Icon size={14} className="sm:w-4 sm:h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-muted-foreground text-[10px] sm:text-xs font-medium uppercase tracking-wide">
                                        {item.label}
                                    </p>
                                    <p className={`text-sm font-medium truncate ${isEmpty ? "text-muted-foreground/60 italic" : "text-foreground"}`}>
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <EditModal
                isOpen={openModal}
                onClose={() => setOpenModal(false)}
                user={user}
                onSave={handleSave}
                isLoading={isUpdating}
            />
        </div>
    );
}
