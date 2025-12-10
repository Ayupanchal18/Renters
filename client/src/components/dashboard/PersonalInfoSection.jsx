import { User, Phone, Mail, Edit2 } from "lucide-react";
import EditModal from "../../model/EditModal";
import { useState } from "react";

export default function PersonalInfoSection({ user, onEdit }) {
    const info = [
        { icon: User, label: "Full Name", value: user.name },
        { icon: User, label: "Gender", value: user.gender || "Not specified" },
        { icon: Mail, label: "Email", value: user.email || "Not provided" },
        { icon: Phone, label: "Phone", value: user.phone || "Not provided" },
    ];


    const [openModal, setOpenModal] = useState(false);

    const handleSave = (updatedUser) => {
        onSaveUser(updatedUser);  // send updated data to parent
        setOpenModal(false);      // close modal
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                    Personal Information
                </h3>

                <button
                    onClick={() => setOpenModal(true)}

                    className="flex items-center gap-2 text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
                >
                    <Edit2 size={18} />
                    <span className="text-sm font-semibold">Edit</span>
                </button>

            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {info.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <div key={idx} className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg">
                                <Icon size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{item.label}</p>
                                <p className="text-gray-900 font-semibold">{item.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* About Section */}
            {user.about && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">About You</p>
                    <p className="text-gray-700">{user.about}</p>
                </div>
            )}
            <EditModal
                isOpen={openModal}
                onClose={() => setOpenModal(false)}
                user={user}
                onSave={handleSave}
            />
        </div>
    );
}
