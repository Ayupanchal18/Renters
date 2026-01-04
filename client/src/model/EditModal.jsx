import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function EditModal({ isOpen, onClose, user, onSave, isLoading = false }) {
    const [formData, setFormData] = useState({ 
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        about: user?.about || user?.bio || ''
    });

    useEffect(() => {
        if (user) {
            setFormData({ 
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                about: user.about || user.bio || ''
            });
        }
    }, [user]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            {/* Modal Box */}
            <div
                className="bg-card dark:bg-card w-full max-w-lg rounded-xl shadow-xl p-6 relative animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    <X size={22} />
                </button>

                <h2 className="text-xl font-bold mb-4 text-foreground">Edit Personal Information</h2>

                {/* Form */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground">Full Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="w-full mt-1 border border-border rounded-lg px-3 py-2 bg-background text-foreground disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <div className="relative">
                            <input
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full mt-1 border border-border rounded-lg px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                Cannot be changed
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Phone</label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="Enter your phone number"
                            className="w-full mt-1 border border-border rounded-lg px-3 py-2 bg-background text-foreground disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">About</label>
                        <textarea
                            name="about"
                            value={formData.about}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="Tell us about yourself..."
                            className="w-full mt-1 border border-border rounded-lg px-3 py-2 h-24 bg-background text-foreground disabled:opacity-50 resize-none"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={() => onSave(formData)}
                    disabled={isLoading}
                    className="mt-5 w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </div>
    );
}
