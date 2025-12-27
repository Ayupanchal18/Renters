import React from 'react';
import { IndianRupee, TrendingUp, Shield, Calculator, MessageSquare, Home, Banknote } from 'lucide-react';
import { Button } from '../ui/button';

export default function PricingCard({ property }) {
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return null;
        return new Intl.NumberFormat('en-IN').format(amount);
    };

    const isBuyProperty = property.listingType === 'buy';
    const price = isBuyProperty ? property.sellingPrice : property.monthlyRent;
    const priceLabel = isBuyProperty ? 'Price' : 'Monthly Rent';
    const priceSuffix = isBuyProperty ? '' : '/month';
    
    const securityDeposit = property.securityDeposit;
    const maintenanceCharge = property.maintenanceCharge;
    const totalMonthly = (property.monthlyRent || 0) + (maintenanceCharge || 0);

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Price Header */}
            <div className="bg-gradient-to-br from-primary via-primary to-primary/90 p-5 sm:p-6 text-primary-foreground">
                <p className="text-sm font-medium opacity-90 mb-1">{priceLabel}</p>
                <div className="flex items-baseline gap-1">
                    <IndianRupee className="w-6 h-6" />
                    <span className="text-3xl sm:text-4xl font-bold">
                        {formatCurrency(price) || 'Contact for price'}
                    </span>
                    {price && priceSuffix && <span className="text-sm opacity-80">{priceSuffix}</span>}
                </div>
                {(property.negotiable || property.rentNegotiable) && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                        Negotiable
                    </span>
                )}
            </div>

            {/* Price Breakdown */}
            <div className="p-5 sm:p-6 space-y-4">
                {/* Rent-specific fields */}
                {!isBuyProperty && (
                    <>
                        {/* Security Deposit */}
                        {securityDeposit > 0 && (
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm">Security Deposit</span>
                                </div>
                                <span className="font-semibold text-foreground">₹{formatCurrency(securityDeposit)}</span>
                            </div>
                        )}

                        {/* Maintenance */}
                        {maintenanceCharge > 0 && (
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm">Maintenance</span>
                                </div>
                                <span className="font-semibold text-foreground">₹{formatCurrency(maintenanceCharge)}/mo</span>
                            </div>
                        )}

                        {/* Total Monthly */}
                        {property.monthlyRent && maintenanceCharge > 0 && (
                            <div className="flex items-center justify-between py-3 bg-muted/50 -mx-5 sm:-mx-6 px-5 sm:px-6 rounded-lg">
                                <div className="flex items-center gap-2 text-foreground">
                                    <Calculator className="w-4 h-4" />
                                    <span className="text-sm font-medium">Total Monthly</span>
                                </div>
                                <span className="text-lg font-bold text-primary">₹{formatCurrency(totalMonthly)}</span>
                            </div>
                        )}
                    </>
                )}

                {/* Buy-specific fields */}
                {isBuyProperty && (
                    <>
                        {/* Price per Sqft */}
                        {property.pricePerSqft > 0 && (
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Home className="w-4 h-4" />
                                    <span className="text-sm">Price per Sqft</span>
                                </div>
                                <span className="font-semibold text-foreground">₹{formatCurrency(property.pricePerSqft)}</span>
                            </div>
                        )}

                        {/* Booking Amount */}
                        {property.bookingAmount > 0 && (
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Banknote className="w-4 h-4" />
                                    <span className="text-sm">Booking Amount</span>
                                </div>
                                <span className="font-semibold text-foreground">₹{formatCurrency(property.bookingAmount)}</span>
                            </div>
                        )}

                        {/* Loan Available */}
                        {property.loanAvailable && (
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm">Loan Available</span>
                                </div>
                                <span className="font-semibold text-green-600">Yes</span>
                            </div>
                        )}

                        {/* Possession Status */}
                        {property.possessionStatus && (
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm">Possession</span>
                                </div>
                                <span className="font-semibold text-foreground capitalize">
                                    {property.possessionStatus.replace('_', ' ')}
                                </span>
                            </div>
                        )}
                    </>
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
