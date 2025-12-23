import React from 'react';
import { IndianRupee, TrendingUp, Shield, Calculator, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';

export default function PricingCard({ property }) {
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return null;
        return new Intl.NumberFormat('en-IN').format(amount);
    };

    const monthlyRent = property.monthlyRent;
    const securityDeposit = property.securityDeposit;
    const maintenanceCharge = property.maintenanceCharge;
    const totalMonthly = (monthlyRent || 0) + (maintenanceCharge || 0);

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Price Header */}
            <div className="bg-gradient-to-br from-primary via-primary to-primary/90 p-5 sm:p-6 text-primary-foreground">
                <p className="text-sm font-medium opacity-90 mb-1">Monthly Rent</p>
                <div className="flex items-baseline gap-1">
                    <IndianRupee className="w-6 h-6" />
                    <span className="text-3xl sm:text-4xl font-bold">
                        {formatCurrency(monthlyRent) || 'Contact for price'}
                    </span>
                    {monthlyRent && <span className="text-sm opacity-80">/month</span>}
                </div>
                {property.negotiable && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                        Negotiable
                    </span>
                )}
            </div>

            {/* Price Breakdown */}
            <div className="p-5 sm:p-6 space-y-4">
                {/* Security Deposit */}
                {securityDeposit && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            <span className="text-sm">Security Deposit</span>
                        </div>
                        <span className="font-semibold text-foreground">₹{formatCurrency(securityDeposit)}</span>
                    </div>
                )}

                {/* Maintenance */}
                {maintenanceCharge && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">Maintenance</span>
                        </div>
                        <span className="font-semibold text-foreground">₹{formatCurrency(maintenanceCharge)}/mo</span>
                    </div>
                )}

                {/* Total Monthly */}
                {monthlyRent && maintenanceCharge && (
                    <div className="flex items-center justify-between py-3 bg-muted/50 -mx-5 sm:-mx-6 px-5 sm:px-6 rounded-lg">
                        <div className="flex items-center gap-2 text-foreground">
                            <Calculator className="w-4 h-4" />
                            <span className="text-sm font-medium">Total Monthly</span>
                        </div>
                        <span className="text-lg font-bold text-primary">₹{formatCurrency(totalMonthly)}</span>
                    </div>
                )}

                {/* Brokerage */}
                {property.brokerage && (
                    <div className="flex items-center justify-between py-2 text-sm">
                        <span className="text-muted-foreground">Brokerage</span>
                        <span className="font-medium text-foreground">₹{formatCurrency(property.brokerage)}</span>
                    </div>
                )}

                {/* CTA Buttons */}
                <div className="pt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Owner
                    </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-4 pt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Verified Listing
                    </span>
                    <span>•</span>
                    <span>No Spam Calls</span>
                </div>
            </div>
        </div>
    );
}
