import React, { useState, useCallback, useMemo } from "react";
import { CheckCircle, AlertCircle, Mail, Phone, Shield, User, RefreshCw, BadgeCheck, Clock } from "lucide-react";
import { Button } from "../ui/button";
import OTPVerificationModal from "./OTPVerificationModal";
import { VerificationSectionSkeleton } from "../ui/skeleton-loaders";
import { LoadingButton, InlineLoading } from "../ui/loading-states";
import { 
    showVerificationErrorToast
} from "../../utils/verificationErrorMessages.js";
import { 
    logAuthenticationError, 
    logAuthenticationSuccess,
    logVerificationError,
    AUTH_ERROR_CONTEXTS 
} from "../../utils/authErrorLogger.js";
import { showErrorToast, showSuccessToast, OPERATION_CONTEXTS } from "../../utils/toastNotifications.jsx";

const VerificationSection = React.memo(function VerificationSection({ 
    user, 
    verificationStatus,
    onVerificationComplete, 
    isLoading = false,
    error = null,
    onRetry = null
}) {
    const [otpModal, setOtpModal] = useState({
        isOpen: false,
        type: null,
        contact: null
    });
    const [initiatingVerification, setInitiatingVerification] = useState({});

    const getStatusColor = (isVerified) => {
        return isVerified 
            ? "bg-gradient-to-br from-success/10 to-success/5 border-success/30 dark:from-success/20 dark:to-success/10 dark:border-success/40" 
            : "bg-muted/50 border-border";
    };

    const getStatusIcon = (isVerified) => {
        return isVerified 
            ? <CheckCircle size={18} className="text-success" />
            : <Clock size={18} className="text-muted-foreground" />;
    };

    const getStatusText = (isVerified) => {
        return isVerified ? "Verified" : "Pending";
    };

    const handleInitiateVerification = useCallback(async (type) => {
        const contact = type === 'email' ? user?.email : user?.phone;
        
        if (!contact) {
            // Show user-friendly error message for missing contact
            const errorMessage = `Please add your ${type === 'email' ? 'email address' : 'phone number'} in your profile first.`;
            
            showErrorToast(
                errorMessage,
                type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION,
                {
                    title: `${type === 'email' ? 'Email' : 'Phone'} Required`,
                    duration: 6000
                }
            );

            // Log missing contact error
            logVerificationError(
                new Error(`Missing ${type} contact for verification`),
                type,
                { 
                    hasUser: !!user,
                    userHasEmail: !!user?.email,
                    userHasPhone: !!user?.phone,
                    requestedType: type
                }
            );
            
            return;
        }

        setInitiatingVerification(prev => ({ ...prev, [type]: true }));
        
        try {
            // Log verification initiation
            logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                operation: 'INITIATE_VERIFICATION',
                verificationType: type,
                hasContact: !!contact
            });

            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setOtpModal({
                isOpen: true,
                type,
                contact
            });
        } catch (error) {
            // Log and show error if verification initiation fails
            logVerificationError(error, type, { 
                contact: contact.substring(0, 3) + '***',
                operation: 'INITIATE_VERIFICATION'
            });

            showVerificationErrorToast(error, type, contact);
        } finally {
            setInitiatingVerification(prev => ({ ...prev, [type]: false }));
        }
    }, [user?.email, user?.phone]);

    const handleVerificationSuccess = useCallback(() => {
        const verificationType = otpModal.type;
        
        // Log successful verification
        logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
            operation: 'VERIFICATION_COMPLETE',
            verificationType,
            contact: otpModal.contact ? otpModal.contact.substring(0, 3) + '***' : 'unknown'
        });

        // Show success message
        showSuccessToast(
            `Your ${verificationType === 'email' ? 'email address' : 'phone number'} has been successfully verified!`,
            verificationType === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION,
            {
                title: 'Verification Complete',
                duration: 5000
            }
        );

        setOtpModal({ isOpen: false, type: null, contact: null });
        
        // Trigger parent component to refresh user data
        if (onVerificationComplete) {
            onVerificationComplete(verificationType);
        }
    }, [onVerificationComplete, otpModal.type, otpModal.contact]);

    const handleModalClose = useCallback(() => {
        setOtpModal({ isOpen: false, type: null, contact: null });
    }, []);

    const verifications = useMemo(() => {
        // Enhanced verification data parsing with validation
        const parseVerificationData = () => {
            try {
                // Validate verification status structure
                if (verificationStatus && verificationStatus.verification) {
                    const { email, phone } = verificationStatus.verification;
                    
                    // Validate email verification data
                    const emailVerified = typeof email?.verified === 'boolean' ? email.verified : (user?.emailVerified ?? false);
                    const emailContact = email?.contact || user?.email || null;
                    const emailVerifiedAt = email?.verifiedAt || user?.emailVerifiedAt || null;
                    
                    // Validate phone verification data
                    const phoneVerified = typeof phone?.verified === 'boolean' ? phone.verified : (user?.phoneVerified ?? false);
                    const phoneContact = phone?.contact || user?.phone || null;
                    const phoneVerifiedAt = phone?.verifiedAt || user?.phoneVerifiedAt || null;
                    
                    // Log successful data parsing
                    logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                        operation: 'DATA_PARSING',
                        emailVerified,
                        phoneVerified,
                        hasEmailContact: !!emailContact,
                        hasPhoneContact: !!phoneContact,
                        dataSource: 'verification_api'
                    });
                    
                    return {
                        emailVerified,
                        phoneVerified,
                        emailContact,
                        phoneContact,
                        emailVerifiedAt,
                        phoneVerifiedAt
                    };
                }
                
                // Fallback to user data if verification status is not available
                const emailVerified = user?.emailVerified ?? false;
                const phoneVerified = user?.phoneVerified ?? false;
                const emailContact = user?.email || null;
                const phoneContact = user?.phone || null;
                const emailVerifiedAt = user?.emailVerifiedAt || null;
                const phoneVerifiedAt = user?.phoneVerifiedAt || null;
                
                // Log fallback data usage
                logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                    operation: 'DATA_PARSING',
                    emailVerified,
                    phoneVerified,
                    hasEmailContact: !!emailContact,
                    hasPhoneContact: !!phoneContact,
                    dataSource: 'user_fallback'
                });
                
                return {
                    emailVerified,
                    phoneVerified,
                    emailContact,
                    phoneContact,
                    emailVerifiedAt,
                    phoneVerifiedAt
                };
                
            } catch (parseError) {
                // Log parsing error and use safe fallbacks
                logAuthenticationError(parseError, AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                    operation: 'DATA_PARSING_ERROR',
                    verificationStatusExists: !!verificationStatus,
                    userExists: !!user,
                    errorMessage: parseError.message
                });
                
                // Return safe fallback values
                return {
                    emailVerified: user?.emailVerified ?? false,
                    phoneVerified: user?.phoneVerified ?? false,
                    emailContact: user?.email || null,
                    phoneContact: user?.phone || null,
                    emailVerifiedAt: user?.emailVerifiedAt || null,
                    phoneVerifiedAt: user?.phoneVerifiedAt || null
                };
            }
        };

        const {
            emailVerified,
            phoneVerified,
            emailContact,
            phoneContact,
            emailVerifiedAt,
            phoneVerifiedAt
        } = parseVerificationData();

        return [
            { 
                label: "Email Verification", 
                isVerified: emailVerified,
                icon: <Mail size={16} className="text-blue-600" />,
                type: 'email',
                contact: emailContact,
                canVerify: !!emailContact,
                verifiedAt: emailVerifiedAt
            },
            { 
                label: "Phone Verification", 
                isVerified: phoneVerified,
                icon: <Phone size={16} className="text-blue-600" />,
                type: 'phone',
                contact: phoneContact,
                canVerify: !!phoneContact,
                verifiedAt: phoneVerifiedAt
            }
        ];
    }, [
        verificationStatus?.verification?.email?.verified,
        verificationStatus?.verification?.phone?.verified,
        verificationStatus?.verification?.email?.contact,
        verificationStatus?.verification?.phone?.contact,
        verificationStatus?.verification?.email?.verifiedAt,
        verificationStatus?.verification?.phone?.verifiedAt,
        user?.emailVerified,
        user?.phoneVerified,
        user?.email,
        user?.phone,
        user?.emailVerifiedAt,
        user?.phoneVerifiedAt
    ]);

    // Show skeleton loader when loading
    if (isLoading && !user) {
        return <VerificationSectionSkeleton />;
    }

    return (
        <>
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                            <BadgeCheck size={16} className="text-primary sm:w-5 sm:h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground">Verification Status</h3>
                            <p className="text-xs text-muted-foreground hidden sm:block">Verify your identity</p>
                        </div>
                    </div>
                </div>

                <div className="p-3 sm:p-4">
                    {/* Enhanced Error state with user-friendly messaging */}
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} className="text-destructive" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-destructive">
                                            Verification Status Error
                                        </span>
                                        <p className="text-xs text-destructive/80 mt-1">
                                            {(() => {
                                                const errorStr = error.toString().toLowerCase();
                                                
                                                if (errorStr.includes('network') || errorStr.includes('fetch')) {
                                                    return 'Unable to load verification status. Please check your internet connection and try again.';
                                            }
                                            
                                            if (errorStr.includes('authentication required') || errorStr.includes('401')) {
                                                return 'Please log in again to view your verification status.';
                                            }
                                            
                                            if (errorStr.includes('access denied') || errorStr.includes('403')) {
                                                return 'You do not have permission to view verification status. Please contact support if this persists.';
                                            }
                                            
                                            if (errorStr.includes('server error') || errorStr.includes('500')) {
                                                return 'Verification service is temporarily unavailable. Please try again in a few minutes.';
                                            }
                                            
                                            if (errorStr.includes('invalid response format')) {
                                                return 'Received invalid data from server. Please refresh the page and try again.';
                                            }
                                            
                                            if (errorStr.includes('endpoint not found') || errorStr.includes('404')) {
                                                return 'Verification status service is not available. Please contact support.';
                                            }
                                            
                                            // Default fallback message
                                            return 'Unable to load verification status. Please try again or contact support if the problem persists.';
                                        })()}
                                    </p>
                                </div>
                            </div>
                            {onRetry && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Log retry attempt with enhanced context
                                        logAuthenticationError(
                                            new Error('User initiated verification status retry'),
                                            AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS,
                                            { 
                                                userInitiated: true, 
                                                originalError: error,
                                                retryTimestamp: new Date().toISOString(),
                                                errorType: error.includes('Network') ? 'NETWORK' : 
                                                          error.includes('401') ? 'AUTH' :
                                                          error.includes('500') ? 'SERVER' : 'UNKNOWN'
                                            }
                                        );
                                        onRetry();
                                    }}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    <RefreshCw size={14} className="mr-1" />
                                    Retry
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {verifications.map((item, idx) => (
                            <div
                                key={idx}
                                className={`${getStatusColor(item.isVerified)} border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${item.isVerified ? 'bg-success/10' : 'bg-muted'}`}>
                                            {item.icon}
                                        </div>
                                        <span className="font-medium text-foreground text-sm">{item.label}</span>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                        item.isVerified 
                                            ? 'bg-success/10 text-success' 
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {getStatusIcon(item.isVerified)}
                                        <span>{getStatusText(item.isVerified)}</span>
                                    </div>
                                </div>
                                
                                {/* Contact info */}
                                {item.contact && (
                                    <div className="text-xs text-muted-foreground mb-2 font-mono bg-muted/50 px-2 py-1 rounded truncate">
                                        {item.type === 'phone' 
                                            ? item.contact.replace(/(\+?\d{1,3})\d+(\d{4})/, '$1****$2')
                                            : item.contact
                                        }
                                    </div>
                                )}

                                {/* Verification button */}
                                {item.canVerify && !item.isVerified && (
                                    <LoadingButton
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleInitiateVerification(item.type)}
                                        className="w-full text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground h-8"
                                        isLoading={initiatingVerification[item.type]}
                                        loadingText="Starting..."
                                    >
                                        Verify {item.type === 'email' ? 'Email' : 'Phone'}
                                    </LoadingButton>
                                )}

                                {/* Verified date */}
                                {item.isVerified && item.verifiedAt && (
                                    <div className="text-xs text-success font-medium">
                                        Verified {new Date(item.verifiedAt).toLocaleDateString()}
                                    </div>
                                )}

                                {/* Missing contact message */}
                                {!item.canVerify && !item.isVerified && item.type && (
                                    <div className="text-xs text-muted-foreground">
                                        Add your {item.type} to verify
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* OTP Verification Modal */}
            <OTPVerificationModal
                isOpen={otpModal.isOpen}
                type={otpModal.type}
                contact={otpModal.contact}
                onClose={handleModalClose}
                onSuccess={handleVerificationSuccess}
            />
        </>
    );
});

export default VerificationSection;
