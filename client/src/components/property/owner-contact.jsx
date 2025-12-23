import React from 'react';
import { Phone, Mail, MessageSquare, Shield, ShieldCheck, ShieldX, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

// Simple inline validators to avoid class instantiation issues
const isValidPhoneNumber = (phone) => {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export default function OwnerContact({ owner, propertyId }) {
    // Handle missing or invalid owner data with fallbacks
    const processedOwner = processOwnerData(owner);

    return (
        <div className="property-card animate-stagger-4">
            <div className="property-card-header">
                <h3 className="text-responsive-base font-semibold text-foreground flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Owner Information
                </h3>
            </div>

            <div className="property-card-content">
                {/* Owner Card */}
                <div className="flex items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-border animate-stagger-1">
                    <div className="relative flex-shrink-0">
                        <img
                            src={processedOwner.photo}
                            alt={processedOwner.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-border transition-transform duration-200 hover:scale-105"
                            onError={(e) => {
                                e.target.src = "/property_image/placeholder-user.jpg";
                            }}
                        />
                        {processedOwner.hasPlaceholderPhoto && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-full">
                                <User className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-responsive-base font-semibold text-foreground truncate">
                                {processedOwner.name}
                            </p>
                            {processedOwner.hasPlaceholderName && (
                                <Badge variant="secondary" className="text-xs animate-pulse-gentle">
                                    Name not provided
                                </Badge>
                            )}
                        </div>
                        <p className="text-responsive-xs text-muted-foreground capitalize">
                            {processedOwner.ownerType === 'agent' ? '🏢 Agent' : 
                             processedOwner.ownerType === 'builder' ? '🏗️ Builder' : 
                             '🏠 Property Owner'}
                        </p>
                    </div>
                </div>

                {/* Verification Status */}
                {renderVerificationStatus(processedOwner.verificationStatus)}

                {/* Contact Methods */}
                <div className="space-y-2 sm:space-y-3">
                    {/* Phone Contact */}
                    <div className="animate-stagger-3">
                        {renderPhoneContact(processedOwner)}
                    </div>
                    
                    {/* Email Contact */}
                    <div className="animate-stagger-4">
                        {renderEmailContact(processedOwner)}
                    </div>

                    {/* No Contact Methods Available */}
                    {!processedOwner.hasValidPhone && !processedOwner.hasValidEmail && (
                        <div className="fallback-content animate-slide-up">
                            <MessageSquare className="fallback-content-icon" />
                            <p className="fallback-content-title">Contact Information</p>
                            <p className="fallback-content-message">Contact details not available</p>
                        </div>
                    )}
                </div>

                {/* CTA Buttons */}
                <div className="pt-4 animate-stagger-5">
                    <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground touch-target transition-all duration-200 hover:scale-105 focus-visible-enhanced"
                        disabled={!processedOwner.hasValidPhone && !processedOwner.hasValidEmail}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {processedOwner.hasValidPhone || processedOwner.hasValidEmail 
                            ? 'Request Viewing' 
                            : 'Contact Not Available'
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * Processes owner data and applies fallbacks for missing information
 * Validates: Requirements 4.1, 4.4, 4.5
 */
function processOwnerData(owner) {
    // Handle completely missing owner data
    if (!owner || typeof owner !== 'object') {
        return {
            name: 'Property Owner',
            phone: null,
            email: null,
            photo: "/property_image/placeholder-user.jpg",
            verificationStatus: 'unverified',
            hasPlaceholderName: true,
            hasPlaceholderPhoto: true,
            hasValidPhone: false,
            hasValidEmail: false
        };
    }

    // Process name
    const name = owner.name || owner.ownerName || 'Property Owner';
    const hasPlaceholderName = !owner.name && !owner.ownerName;

    // Process phone
    const phone = owner.phone || owner.ownerPhone || null;
    const hasValidPhone = phone && isValidPhoneNumber(phone);

    // Process email
    const email = owner.email || owner.ownerEmail || null;
    const hasValidEmail = email && isValidEmail(email);

    // Process photo
    const photo = owner.photo || owner.avatar || owner.ownerPhoto || "/property_image/placeholder-user.jpg";
    const hasPlaceholderPhoto = !owner.photo && !owner.avatar && !owner.ownerPhoto;

    // Process verification status
    const verificationStatus = owner.verificationStatus || owner.verified || 'unverified';

    // Process owner type
    const ownerType = owner.ownerType || 'owner';

    return {
        name,
        phone,
        email,
        photo,
        verificationStatus,
        ownerType,
        hasPlaceholderName,
        hasPlaceholderPhoto,
        hasValidPhone,
        hasValidEmail
    };
}

/**
 * Renders verification status badge with appropriate styling
 * Validates: Requirements 4.3
 */
function renderVerificationStatus(status) {
    const getVerificationConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'verified':
            case 'true':
            case true:
                return {
                    icon: ShieldCheck,
                    text: 'Verified Owner',
                    bgColor: 'bg-emerald-50',
                    borderColor: 'border-emerald-200',
                    textColor: 'text-emerald-700',
                    iconColor: 'text-emerald-600',
                    dotColor: 'bg-emerald-600'
                };
            case 'pending':
                return {
                    icon: Shield,
                    text: 'Verification Pending',
                    bgColor: 'bg-warning/10',
                    borderColor: 'border-warning/20',
                    textColor: 'text-warning',
                    iconColor: 'text-warning',
                    dotColor: 'bg-warning'
                };
            case 'rejected':
            case 'failed':
                return {
                    icon: ShieldX,
                    text: 'Verification Failed',
                    bgColor: 'bg-destructive/10',
                    borderColor: 'border-destructive/20',
                    textColor: 'text-destructive',
                    iconColor: 'text-destructive',
                    dotColor: 'bg-destructive'
                };
            default:
                return {
                    icon: Shield,
                    text: 'Verification Status Unknown',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                    textColor: 'text-muted-foreground',
                    iconColor: 'text-muted-foreground',
                    dotColor: 'bg-muted-foreground'
                };
        }
    };

    const config = getVerificationConfig(status);
    const Icon = config.icon;

    return (
        <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3 flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
            <span className={`text-sm ${config.textColor} font-medium`}>{config.text}</span>
        </div>
    );
}

/**
 * Renders phone contact with validation and proper formatting
 * Validates: Requirements 4.1, 4.2
 */
function renderPhoneContact(processedOwner) {
    if (!processedOwner.hasValidPhone) {
        return (
            <div className="contact-card opacity-60 cursor-not-allowed">
                <div className="contact-card-icon bg-muted">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="contact-card-content">
                    <p className="contact-card-label">Call Owner</p>
                    <p className="contact-card-value text-muted-foreground">
                        {processedOwner.phone ? 'Invalid phone number' : 'Phone not provided'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <a
            href={`tel:${processedOwner.phone}`}
            className="contact-card hover:bg-secondary focus-visible-enhanced"
        >
            <div className="contact-card-icon bg-primary/10 group-hover:bg-primary/20">
                <Phone className="w-4 h-4 text-primary" />
            </div>
            <div className="contact-card-content">
                <p className="contact-card-label">Call Owner</p>
                <p className="contact-card-value">{formatPhoneNumber(processedOwner.phone)}</p>
            </div>
        </a>
    );
}

/**
 * Renders email contact with validation and proper formatting
 * Validates: Requirements 4.1, 4.2
 */
function renderEmailContact(processedOwner) {
    if (!processedOwner.hasValidEmail) {
        return (
            <div className="contact-card opacity-60 cursor-not-allowed">
                <div className="contact-card-icon bg-muted">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="contact-card-content">
                    <p className="contact-card-label">Send Email</p>
                    <p className="contact-card-value text-muted-foreground">
                        {processedOwner.email ? 'Invalid email address' : 'Email not provided'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <a
            href={`mailto:${processedOwner.email}`}
            className="contact-card hover:bg-secondary focus-visible-enhanced"
        >
            <div className="contact-card-icon bg-accent/10 group-hover:bg-accent/20">
                <Mail className="w-4 h-4 text-accent" />
            </div>
            <div className="contact-card-content">
                <p className="contact-card-label">Send Email</p>
                <p className="contact-card-value">{processedOwner.email}</p>
            </div>
        </a>
    );
}

/**
 * Formats phone number for display in Indian format
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Indian phone number format
    if (digits.length === 10) {
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
        return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    } else if (digits.length === 11 && digits.startsWith('0')) {
        return `+91 ${digits.slice(1, 6)} ${digits.slice(6)}`;
    } else if (digits.length > 10) {
        // For international numbers with country code
        const countryCode = digits.slice(0, -10);
        const phoneNumber = digits.slice(-10);
        return `+${countryCode} ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
    }
    
    // Return original with +91 prefix if no standard format applies
    return phone.startsWith('+') ? phone : `+91 ${phone}`;
}
