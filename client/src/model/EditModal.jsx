import { X } from "lucide-react";
import { useEffect, useState } from "react";

export default function EditModal({ isOpen, onClose, user, onSave }) {
    const [formData, setFormData] = useState({ ...user });

    useEffect(() => {
        setFormData({ ...user });
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
                className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 relative animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <X size={22} />
                </button>

                <h2 className="text-xl font-bold mb-4">Edit Personal Information</h2>

                {/* Form */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded-lg px-3 py-2"
                        >
                            <option value="">Not specified</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Phone</label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">About</label>
                        <textarea
                            name="about"
                            value={formData.about}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded-lg px-3 py-2 h-24"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={() => onSave(formData)}
                    className="mt-5 w-full bg-primary text-black py-2 rounded-lg font-semibold hover:bg-primary/90"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
