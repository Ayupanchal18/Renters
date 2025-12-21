import React, { useMemo } from 'react'
import { ChevronDown, AlertCircle, DollarSign, Calculator, CreditCard, TrendingUp } from 'lucide-react'
import { PropertyDataValidator } from '../../utils/PropertyDataValidator'
import { DataTransformationUtils } from '../../utils/DataTransformationUtils'

export default function FinancialDetails({ property, isExpanded = true, onToggle }) {
    // Initialize utilities
    const validator = useMemo(() => new PropertyDataValidator(), [])
    const transformer = useMemo(() => new DataTransformationUtils(), [])

    // Process property data
    const processedData = useMemo(() => {
        if (!property) {
            return validator.createEmptyPropertyWithFallbacks()
        }
        
        const validationResult = validator.validateAndTransform(property)
        const transformedProperty = transformer.transformPropertyForDisplay(validationResult.property)
        
        return {
            ...validationResult,
            transformed: transformedProperty
        }
    }, [property, validator, transformer])

    // Get processed property data
    const propertyData = processedData.property || {}
    const transformedData = processedData.transformed || {}
    const hasWarnings = processedData.hasWarnings
    const hasFallbacks = processedData.hasFallbacks

    // Calculate additional financial metrics
    const financialMetrics = useMemo(() => {
        const monthlyRent = transformer.parseNumber(propertyData.monthlyRent)
        const securityDeposit = transformer.parseNumber(propertyData.securityDeposit)
        const maintenanceCharge = transformer.parseNumber(propertyData.maintenanceCharge)
        const builtUpArea = transformer.parseNumber(propertyData.builtUpArea)
        
        const totalMonthlyCost = monthlyRent + maintenanceCharge
        const annualRent = monthlyRent * 12
        const pricePerSqft = builtUpArea > 0 ? monthlyRent / builtUpArea : 0
        
        // Calculate move-in cost (security deposit + first month rent)
        const moveInCost = securityDeposit + monthlyRent
        
        return {
            monthlyRent,
            securityDeposit,
            maintenanceCharge,
            totalMonthlyCost,
            annualRent,
            pricePerSqft,
            moveInCost,
            hasValidRent: monthlyRent > 0,
            hasValidDeposit: securityDeposit > 0,
            hasValidMaintenance: maintenanceCharge > 0,
            hasValidArea: builtUpArea > 0
        }
    }, [propertyData, transformer])

    // Format currency helper
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
            return 'Not specified'
        }
        return transformer.formatCurrency(amount)
    }

    // Format percentage helper
    const formatPercentage = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return 'N/A'
        }
        return `${value.toFixed(1)}%`
    }

    return (
        <div className="property-card animate-stagger-2">
            {/* Header */}
            <button
                onClick={onToggle}
                className="property-card-header w-full flex items-center justify-between hover:bg-slate-100 transition-colors focus-visible-enhanced"
                disabled={!onToggle}
            >
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-responsive-base font-bold text-slate-900">Financial Details</span>
                    {(hasWarnings || hasFallbacks) && (
                        <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse-gentle" />
                    )}
                </div>
                {onToggle && (
                    <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="property-card-content border-t border-slate-200 animate-slide-down">
                    {/* Data Quality Indicator */}
                    {(hasWarnings || hasFallbacks) && (
                        <div className="warning-state animate-slide-down">
                            <div className="warning-state-content">
                                <AlertCircle className="warning-state-icon" />
                                <span className="warning-state-text">
                                    {hasFallbacks ? 'Some financial information is estimated' : 'Financial information verified'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Primary Financial Information */}
                    <div className="space-responsive">
                        {/* Monthly Rent - Primary highlight */}
                        <div className="financial-card primary animate-stagger-1">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-5 h-5 text-green-700" />
                                <p className="text-responsive-xs font-bold text-green-700 uppercase tracking-wide">
                                    Monthly Rent
                                </p>
                            </div>
                            <p className="text-responsive-xl font-bold text-green-900">
                                {transformedData.financial?.monthlyRent?.display || formatCurrency(financialMetrics.monthlyRent)}
                            </p>
                            {propertyData.negotiable && (
                                <p className="text-responsive-sm text-green-600 mt-1 font-medium animate-bounce-gentle">
                                    💰 Negotiable
                                </p>
                            )}
                            {!financialMetrics.hasValidRent && (
                                <p className="text-xs text-amber-600 mt-1">Contact owner for pricing details</p>
                            )}
                        </div>

                        {/* Security Deposit and Maintenance */}
                        <div className="grid-responsive-2">
                            {/* Security Deposit */}
                            <div className="financial-card accent animate-stagger-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="w-4 h-4 text-blue-700" />
                                    <p className="text-responsive-xs font-bold text-blue-700 uppercase tracking-wide">
                                        Security Deposit
                                    </p>
                                </div>
                                <p className="text-responsive-lg font-bold text-blue-900">
                                    {transformedData.financial?.securityDeposit?.display || formatCurrency(financialMetrics.securityDeposit)}
                                </p>
                                {propertyData._hasDefaultSecurityDeposit && (
                                    <p className="text-xs text-blue-600 mt-1">📊 Estimated amount</p>
                                )}
                                {!financialMetrics.hasValidDeposit && (
                                    <p className="text-xs text-slate-500 mt-1">Usually 1-3 months rent</p>
                                )}
                            </div>

                            {/* Maintenance Charges */}
                            <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200 transition-all duration-200 hover:shadow-sm animate-stagger-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-purple-700" />
                                    <p className="text-responsive-xs font-bold text-purple-700 uppercase tracking-wide">
                                        Maintenance
                                    </p>
                                </div>
                                <p className="text-responsive-lg font-bold text-purple-900">
                                    {transformedData.financial?.maintenanceCharge?.display || formatCurrency(financialMetrics.maintenanceCharge)}
                                </p>
                                {propertyData._hasDefaultMaintenanceCharge && (
                                    <p className="text-xs text-purple-600 mt-1">📊 Estimated amount</p>
                                )}
                                {!financialMetrics.hasValidMaintenance && (
                                    <p className="text-xs text-slate-500 mt-1">May be included in rent</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Calculated Totals */}
                    <div className="space-y-3">
                        {/* Total Monthly Cost */}
                        <div className="bg-slate-900/5 border border-slate-300 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calculator className="w-4 h-4 text-slate-700" />
                                <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                    Total Monthly Cost
                                </p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-slate-900">
                                    {transformedData.financial?.totalMonthlyCost?.display || formatCurrency(financialMetrics.totalMonthlyCost)}
                                </p>
                                {financialMetrics.hasValidRent && financialMetrics.hasValidMaintenance && (
                                    <p className="text-sm text-slate-600">
                                        (Rent + Maintenance)
                                    </p>
                                )}
                            </div>
                            {financialMetrics.hasValidArea && financialMetrics.pricePerSqft > 0 && (
                                <p className="text-sm text-slate-600 mt-2">
                                    {formatCurrency(financialMetrics.pricePerSqft)}/sqft per month
                                </p>
                            )}
                        </div>

                        {/* Move-in Cost */}
                        {financialMetrics.hasValidRent && (
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="w-4 h-4 text-orange-700" />
                                    <p className="text-sm font-bold text-orange-700 uppercase tracking-wide">
                                        Estimated Move-in Cost
                                    </p>
                                </div>
                                <p className="text-xl font-bold text-orange-900">
                                    {formatCurrency(financialMetrics.moveInCost)}
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                    Security deposit + First month rent
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Additional Financial Information */}
                    {(propertyData.brokerage || propertyData.tokenAmount || financialMetrics.hasValidRent) && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
                                Additional Information
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Brokerage */}
                                {propertyData.brokerage && (
                                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">
                                            Brokerage Fee
                                        </p>
                                        <p className="text-lg font-bold text-indigo-900">
                                            {formatCurrency(propertyData.brokerage)}
                                        </p>
                                    </div>
                                )}

                                {/* Token Amount */}
                                {propertyData.tokenAmount && (
                                    <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                                        <p className="text-xs font-bold text-pink-700 uppercase tracking-wide mb-1">
                                            Token Amount
                                        </p>
                                        <p className="text-lg font-bold text-pink-900">
                                            {formatCurrency(propertyData.tokenAmount)}
                                        </p>
                                    </div>
                                )}

                                {/* Annual Rent */}
                                {financialMetrics.hasValidRent && (
                                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">
                                            Annual Rent
                                        </p>
                                        <p className="text-lg font-bold text-teal-900">
                                            {formatCurrency(financialMetrics.annualRent)}
                                        </p>
                                    </div>
                                )}

                                {/* Price per sqft */}
                                {financialMetrics.hasValidArea && financialMetrics.pricePerSqft > 0 && (
                                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                        <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-1">
                                            Price per Sq Ft
                                        </p>
                                        <p className="text-lg font-bold text-yellow-900">
                                            {formatCurrency(financialMetrics.pricePerSqft)}/month
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Financial Summary */}
                    {financialMetrics.hasValidRent && (
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Financial Summary</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Monthly Rent:</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatCurrency(financialMetrics.monthlyRent)}
                                    </span>
                                </div>
                                {financialMetrics.hasValidMaintenance && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Maintenance:</span>
                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(financialMetrics.maintenanceCharge)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200 pt-2">
                                    <span className="text-slate-900 font-semibold">Total Monthly:</span>
                                    <span className="font-bold text-green-700">
                                        {formatCurrency(financialMetrics.totalMonthlyCost)}
                                    </span>
                                </div>
                                {financialMetrics.hasValidDeposit && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Security Deposit:</span>
                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(financialMetrics.securityDeposit)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No Financial Data Available */}
                    {!financialMetrics.hasValidRent && (
                        <div className="text-center py-6">
                            <div className="text-slate-400 mb-2">
                                <DollarSign className="w-8 h-8 mx-auto" />
                            </div>
                            <p className="text-sm text-slate-600 mb-2">
                                Financial information not available
                            </p>
                            <p className="text-xs text-slate-500">
                                Contact the property owner for pricing details
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}