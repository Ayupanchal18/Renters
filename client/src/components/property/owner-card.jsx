import React, { useState } from 'react';
import { Phone, Mail, User, ShieldCheck, Shield, Building2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../hooks/useMessages';
import { isAuthenticated } from '../../utils/auth';
import { Button } from '../ui/button';

export default function OwnerCard({ owner, propertyId }) {
    const [isCreatingConversation, setIsCreatingConversation] = useState(false);
    const navigate = useNavigate();
    const { createConversation } = useMessages();
    
    const name = owner?.name || 'Property Owner';
    const phone = owner?.phone;
    const email = owner?.email;
    const ownerType = owner?.ownerType || 'owner';
    const isVerified = owner?.verificationStatus?.toLowerCase() === 'verified';
    const ownerId = owner?.id || owner?._id;

    const formatPhone = (phone) => {
        if (!phone) return null;
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 10) {
            return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
        }
        return phone;
    };

    const getOwnerTypeLabel = () => {
        switch (ownerType) {
            case 'agent': return { label: 'Property Agent', icon: Building2 };
            case 'builder': return { label: 'Builder', icon: Building2 };
            default: return { label: 'Property Owner', icon: User };
        }
    };

    const handleSendMessage = async () => {
        // Check if user is authenticated
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        // Check if we have required data
        if (!ownerId || !propertyId) {
            console.error('Missing owner ID or property ID for messaging');
            return;
        }

        // Check if user is trying to message themselves
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = currentUser._id || currentUser.id;
        
        if (currentUserId === ownerId) {
            console.log('Cannot message yourself');
            return;
        }

        setIsCreatingConversation(true);
        
        try {
            const result = await createConversation(ownerId, propertyId);
            
            if (result.success) {
                // Navigate to messages page
                navigate('/messages');
            } else {
                console.error('Failed to create conversation:', result.error);
                // You could show a toast notification here
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        } finally {
            setIsCreatingConversation(false);
        }
    };

    const ownerTypeInfo = getOwnerTypeLabel();
    const OwnerIcon = ownerTypeInfo.icon;

    return (
        <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Listed By
            </h3>

            {/* Owner Info */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <OwnerIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{name}</p>
                        {isVerified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">{ownerTypeInfo.label}</p>
                </div>
            </div>

            {/* Verification Status */}
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-5 ${
                isVerified 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30' 
                    : 'bg-muted'
            }`}>
                {isVerified ? (
                    <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                            Verified Owner
                        </span>
                    </>
                ) : (
                    <>
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Verification Pending
                        </span>
                    </>
                )}
            </div>

            {/* Contact Options */}
            <div className="space-y-3">
                {/* Send Message Button */}
                <Button
                    onClick={handleSendMessage}
                    disabled={isCreatingConversation || !ownerId || !propertyId}
                    className="w-full flex items-center gap-3 p-3 h-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs opacity-90">Message</p>
                        <p className="font-medium">
                            {isCreatingConversation ? 'Starting chat...' : 'Send Message'}
                        </p>
                    </div>
                </Button>

                {phone && (
                    <a
                        href={`tel:${phone}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors group no-underline"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Call</p>
                            <p className="font-medium text-foreground no-underline">{formatPhone(phone)}</p>
                        </div>
                    </a>
                )}

                {email && (
                    <a
                        href={`mailto:${email}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group no-underline"
                    >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium text-foreground truncate no-underline">{email}</p>
                        </div>
                    </a>
                )}

                {!phone && !email && !ownerId && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                        Contact information not available
                    </div>
                )}
            </div>
        </div>
    );
}
