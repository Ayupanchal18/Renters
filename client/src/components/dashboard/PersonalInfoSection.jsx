import React, { useState } from "react";
import { User, Phone, Mail, Edit2, UserCircle, Sparkles } from "lucide-react";
import EditModal from "../../model/EditModal";

export default function PersonalInfoSection({ user, onEdit }) {
    const info = [
        { icon: User, label: "Full Name", value: user.name, color: "bg-blue-500" },
        { icon: UserCircle, label: "Gender", value: user.gender || "Not specified", color: "bg-purple-500" },
        { icon: Mail, label: "Email", value: user.email || "Not provided", color: "bg-emerald-500" },
        { icon: Phone, label: "Phone", value: user.phone || "Not provided", color: "bg-orange-500" },
    ];

    const [openModal, setOpenModal] = useState(false);

    const handleSave = (updatedUser) => {
        onSaveUser(updatedUser);
        setOpenModal(false);
    };

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Sparkles size={20} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">
                            Personal Information
                        </h3>
                        <p className="text-sm text-muted-foreground">Your profile details</p>
                    </div>
                </div>

                <button
                    onClick={() => setOpenModal(true)}
                    className="group flex items-center gap-2 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-xl transition-all duration-200 border border-primary/20 hover:border-primary"
                >
                    <Edit2 size={16} className="transition-transform group-hover:rotate-12" />
                    <span className="text-sm font-semibold">Edit</span>
                </button>
            </div>

            {/* Info Grid */}
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {info.map((item, idx) => {
                        const Icon = item.icon;
                        const isEmpty = item.value === "Not specified" || item.value === "Not provided";
                        
                        return (
                            <div 
                                key={idx} 
                                className="group flex items-center gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors duration-200"
                            >
                                <div className={`${item.color} p-2.5 rounded-xl text-white shadow-sm`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-0.5">
                                        {item.label}
                                    </p>
                                    <p className={`font-semibold truncate ${isEmpty ? "text-muted-foreground/60 italic" : "text-foreground"}`}>
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* About Section */}
                {user.about && (
                    <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-2">About You</p>
                        <p className="text-foreground leading-relaxed">{user.about}</p>
                    </div>
                )}
            </div>

            <EditModal
                isOpen={openModal}
                onClose={() => setOpenModal(false)}
                user={user}
                onSave={handleSave}
            />
        </div>
    );
}
