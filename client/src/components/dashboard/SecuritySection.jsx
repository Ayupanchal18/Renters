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
            <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Shield size={20} className="text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-foreground">Security & Login</h3>
                                {loading && <InlineLoading text="" size="sm" />}
                            </div>
                            <p className="text-sm text-muted-foreground">Manage your account security</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Error state */}
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                            <span className="text-sm text-destructive">{error}</span>
                        </div>
                    )}

                    {/* Security Actions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
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
                                    className={`group ${action.cardBg} border ${action.borderColor} rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left hover:-translate-y-0.5`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`${action.iconBg} p-2.5 rounded-xl text-white shadow-sm`}>
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-foreground block text-sm">{action.label}</span>
                                                <span className="text-xs text-muted-foreground">{action.description}</span>
                                            </div>
                                        </div>
                                        <ChevronRight 
                                            size={18} 
                                            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0.5" 
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Security Information */}
                    <div className="bg-muted/50 rounded-xl p-5">
                        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Calendar size={16} className="text-muted-foreground" />
                            Security Information
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <span className="text-sm text-muted-foreground">Account created</span>
                                <span className="text-sm font-medium text-foreground">
                                    {user?.accountCreatedAt 
                                        ? new Date(user.accountCreatedAt).toLocaleDateString()
                                        : user?.createdAt 
                                            ? new Date(user.createdAt).toLocaleDateString()
                                            : 'Unknown'
                                    }
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-muted-foreground">Phone verified</span>
                                <span className={`flex items-center gap-1.5 text-sm font-medium ${user?.phoneVerified ? 'text-success' : 'text-warning'}`}>
                                    {user?.phoneVerified ? (
                                        <><CheckCircle size={14} /> Verified</>
                                    ) : (
                                        <><XCircle size={14} /> Not verified</>
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
