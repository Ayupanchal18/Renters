import React, { useState, useCallback, useMemo } from "react";
import { Lock, Phone, Trash2, Shield, ChevronRight, Calendar, CheckCircle, XCircle } from "lucide-react";
import SecurityModal from "./SecurityModal";
import DiagnosticTools from "./DiagnosticTools";
import { SecuritySectionSkeleton } from "../ui/skeleton-loaders";
import { InlineLoading } from "../ui/loading-states";

const SecuritySection = React.memo(function SecuritySection({ isLoading = false, error = null, user = null }) {
    const [activeModal, setActiveModal] = useState(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    
    const loading = isLoading;

    const handleSecurityUpdate = useCallback((type) => {
        console.log(`Security operation completed: ${type}`);
        setActiveModal(null);
    }, []);

    const securityActions = useMemo(() => [
        {
            icon: Lock,
            label: "Change Password",
            action: "password",
            iconBg: "bg-blue-500",
            cardBg: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20",
            borderColor: "border-blue-200/60 dark:border-blue-800/40",
            description: "Update your password"
        },
        {
            icon: Phone,
            label: "Change Phone",
            action: "phone",
            iconBg: "bg-teal-500",
            cardBg: "bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20",
            borderColor: "border-teal-200/60 dark:border-teal-800/40",
            description: "Update phone number"
        },
        {
            icon: Trash2,
            label: "Delete Account",
            action: "delete",
            iconBg: "bg-red-500",
            cardBg: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20",
            borderColor: "border-red-200/60 dark:border-red-800/40",
            description: "Remove your account"
        },
    ], []);

    if (loading && !user) {
        return <SecuritySectionSkeleton />;
    }

    return (
        <>
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                            <Shield size={16} className="text-primary sm:w-5 sm:h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground">Security & Login</h3>
                            <p className="text-xs text-muted-foreground hidden sm:block">Manage your account security</p>
                        </div>
                    </div>
                </div>

                <div className="p-3 sm:p-4">
                    {/* Error state */}
                    {error && (
                        <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <span className="text-xs text-destructive">{error}</span>
                        </div>
                    )}

                    {/* Security Actions */}
                    <div className="space-y-2 mb-3">
                        {securityActions.map((action, idx) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (action.action === 'diagnostics') {
                                            setShowDiagnostics(true);
                                        } else {
                                            setActiveModal(action.action);
                                        }
                                    }}
                                    className={`group w-full ${action.cardBg} border ${action.borderColor} rounded-lg p-3 hover:shadow-sm transition-all duration-200 text-left`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`${action.iconBg} p-2 rounded-lg text-white`}>
                                                <Icon size={14} />
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground block text-sm">{action.label}</span>
                                                <span className="text-xs text-muted-foreground">{action.description}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-muted-foreground" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Security Information */}
                    <div className="bg-muted/50 rounded-lg p-3">
                        <h4 className="font-medium text-foreground text-sm mb-2 flex items-center gap-1.5">
                            <Calendar size={14} className="text-muted-foreground" />
                            Security Information
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                                <span className="text-xs text-muted-foreground">Account created</span>
                                <span className="text-xs font-medium text-foreground">
                                    {user?.accountCreatedAt 
                                        ? new Date(user.accountCreatedAt).toLocaleDateString()
                                        : user?.createdAt 
                                            ? new Date(user.createdAt).toLocaleDateString()
                                            : 'Unknown'
                                    }
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-xs text-muted-foreground">Phone verified</span>
                                <span className={`flex items-center gap-1 text-xs font-medium ${user?.phoneVerified ? 'text-success' : 'text-warning'}`}>
                                    {user?.phoneVerified ? (
                                        <><CheckCircle size={12} /> Verified</>
                                    ) : (
                                        <><XCircle size={12} /> Not verified</>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SecurityModal
                isOpen={activeModal !== null}
                onClose={() => setActiveModal(null)}
                type={activeModal || "password"}
                user={user}
                onSecurityUpdate={handleSecurityUpdate}
            />

            {showDiagnostics && (
                <DiagnosticTools
                    user={user}
                    onClose={() => setShowDiagnostics(false)}
                />
            )}
        </>
    );
});

export default SecuritySection;
