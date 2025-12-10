import { useState } from "react";
import { Lock, Mail, Phone, Trash2 } from "lucide-react";
import SecurityModal from "./SecurityModal";

export default function SecuritySection() {
    const [activeModal, setActiveModal] = useState(null);

    const securityActions = [
        {
            icon: Lock,
            label: "Change Password",
            action: "password",
            color: "bg-blue-50 border-blue-200",
            icon_color: "text-blue-600",
        },
        {
            icon: Mail,
            label: "Change Email",
            action: "email",
            color: "bg-purple-50 border-purple-200",
            icon_color: "text-purple-600",
        },
        {
            icon: Phone,
            label: "Change Phone",
            action: "phone",
            color: "bg-teal-50 border-teal-200",
            icon_color: "text-teal-600",
        },
        {
            icon: Trash2,
            label: "Delete Account",
            action: "delete",
            color: "bg-red-50 border-red-200",
            icon_color: "text-red-600",
        },
    ];

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Security & Login</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {securityActions.map((action, idx) => {
                        const Icon = action.icon;

                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveModal(action.action)}
                                className={`${action.color} border rounded-lg p-4 hover:shadow-md transition-all text-left group`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 bg-white rounded-lg${action.icon_color}`}>
                                            <Icon size={20} />
                                        </div>
                                        <span className="font-semibold text-gray-900">{action.label}</span>
                                    </div>

                                    <span className="text-xl text-gray-400 group-hover:text-gray-600">
                                        →
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            <SecurityModal
                isOpen={activeModal !== null}
                onClose={() => setActiveModal(null)}
                type={activeModal || "password"}
            />
        </>
    );
}
