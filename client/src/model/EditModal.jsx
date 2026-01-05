import { X, Loader2, Camera, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getToken } from "../utils/auth";
import { showSuccessToast, showErrorToast } from "../utils/toastNotifications";

export default function EditModal({ isOpen, onClose, user, onSave, isLoading = false }) {
    const [formData, setFormData] = useState({ 
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        about: user?.about || user?.bio || '',
        avatar: user?.avatar || ''
    });
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(user?.avatar || null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData({ 
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                about: user.about || user.bio || '',
                avatar: user.avatar || ''
            });
            setPhotoPreview(user.avatar || null);
        }
    }, [user]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showErrorToast("Please select a valid image file (JPEG, PNG, GIF, or WebP)", "", { title: "Invalid File Type" });
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showErrorToast("Image size must be less than 5MB", "", { title: "File Too Large" });
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Upload the image
        setIsUploadingPhoto(true);
        try {
            const token = getToken();
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);

            const response = await fetch('/api/upload/profile-photo', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadFormData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to upload image');
            }

            // Update form data with the uploaded image URL
            const imageUrl = data.data?.url || data.url || data.imageUrl;
            if (imageUrl) {
                setFormData(prev => ({ ...prev, avatar: imageUrl }));
                showSuccessToast("Photo uploaded successfully", "", { title: "Success" });
            } else {
                throw new Error('No image URL returned from server');
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            showErrorToast(error.message || "Failed to upload photo", "", { title: "Upload Failed" });
            // Revert preview on error
            setPhotoPreview(user?.avatar || null);
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoPreview(null);
        setFormData(prev => ({ ...prev, avatar: '' }));
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            {/* Modal Box */}
            <div
                className="bg-card dark:bg-card w-full max-w-lg rounded-xl shadow-xl p-6 relative animate-scaleIn max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                    onClick={onClose}
                    disabled={isLoading || isUploadingPhoto}
                >
                    <X size={22} />
                </button>

                <h2 className="text-xl font-bold mb-4 text-foreground">Edit Personal Information</h2>

                {/* Form */}
                <div className="flex flex-col gap-4">
                    {/* Profile Photo Section */}
                    <div className="flex flex-col items-center gap-3 pb-4 border-b border-border">
                        <div className="relative">
                            <div 
                                className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-border cursor-pointer group"
                                onClick={handlePhotoClick}
                            >
                                {isUploadingPhoto ? (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                ) : null}
                                {photoPreview ? (
                                    <img 
                                        src={photoPreview} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-10 h-10 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handlePhotoChange}
                                className="hidden"
                                disabled={isLoading || isUploadingPhoto}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handlePhotoClick}
                                disabled={isLoading || isUploadingPhoto}
                                className="text-xs text-primary hover:underline disabled:opacity-50"
                            >
                                {photoPreview ? 'Change Photo' : 'Add Photo'}
                            </button>
                            {photoPreview && (
                                <>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        disabled={isLoading || isUploadingPhoto}
                                        className="text-xs text-destructive hover:underline disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

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
                        <div className="relative">
                            <input
                                name="phone"
                                value={formData.phone || 'Not provided'}
                                disabled
                                className="w-full mt-1 border border-border rounded-lg px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                Use "Update Number" option
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Phone number changes require OTP verification
                        </p>
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
                    disabled={isLoading || isUploadingPhoto}
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
