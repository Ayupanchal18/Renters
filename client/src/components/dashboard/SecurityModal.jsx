import { useState } from "react";
import { X, Eye, EyeOff, Lock, Mail, Trash2 } from "lucide-react";

export default function SecurityModal({ isOpen, onClose, type }) {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    if (!isOpen) return null;

    const getModalContent = () => {
        switch (type) {
            case "password":
                return {
                    title: "Change Password",
                    description: "Update your password to keep your account secure",
                    icon: Lock,
                    fields: [
                        { label: "Current Password", type: "password", key: "currentPassword" },
                        { label: "New Password", type: "password", key: "newPassword" },
                        { label: "Confirm Password", type: "password", key: "confirmPassword" },
                    ],
                    buttonText: "Update Password",
                };

            case "email":
                return {
                    title: "Change Email",
                    description: "Update your email address for account recovery and notifications",
                    icon: Mail,
                    fields: [
                        { label: "Current Email", type: "email", key: "currentEmail", disabled: true },
                        { label: "New Email", type: "email", key: "newEmail" },
                        { label: "Confirm Email", type: "email", key: "confirmEmail" },
                    ],
                    buttonText: "Update Email",
                };

            case "delete":
                return {
                    title: "Delete Account",
                    description: "This action cannot be undone. All your data will be permanently deleted.",
                    icon: Trash2,
                    fields: [],
                    buttonText: "Delete Account",
                    dangerous: true,
                };

            default:
                return null;
        }
    };

    const content = getModalContent();
    if (!content) return null;

    const Icon = content.icon;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
                {/* Header */}
                <div
                    className={`border-b border-gray-200 p-6 flex items-center justify-between${content.dangerous ? "bg-red-50" : "bg-gray-50"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded-lg${content.dangerous ? "bg-red-100" : "bg-primary/10"
                                }`}
                        >
                            <Icon
                                size={24}
                                className={content.dangerous ? "text-red-600" : "text-primary"}
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{content.title}</h2>
                            <p className="text-sm text-gray-600">{content.description}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    <div className="space-y-4">
                        {content.fields.map((field) => (
                            <div key={field.key}>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    {field.label}
                                </label>

                                <div className="relative">
                                    <input
                                        type={
                                            field.type === "password" && showPassword
                                                ? "text"
                                                : field.type
                                        }
                                        placeholder={`Enter${field.label.toLowerCase()}`}
                                        disabled={field.disabled}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-primary/50 
                               disabled:bg-gray-100"
                                        onChange={(e) =>
                                            setFormData({ ...formData, [field.key]: e.target.value })
                                        }
                                    />

                                    {field.type === "password" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {content.dangerous && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                                <span className="font-semibold">Warning:</span> This action is permanent and
                                cannot be reversed.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition-colors${content.dangerous
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-primary hover:bg-primary/90"
                            }`}
                    >
                        {content.buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
