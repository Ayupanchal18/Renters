import React from 'react';
import { Shield, Check, X, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Password Strength Indicator Component
 * Provides visual feedback for password strength and requirements
 */
export function PasswordStrengthIndicator({ 
    password = '', 
    validation = null, 
    showRequirements = true,
    showSuggestions = true,
    className = '',
    compact = false 
}) {
    if (!password && !compact) {
        return (
            <div className={cn("p-3 bg-muted border border-border rounded-lg", className)}>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Enter a password to see strength analysis
                </p>
            </div>
        );
    }

    if (!validation) {
        return null;
    }

    const { score, strength, requirements, errors, suggestions, feedback } = validation;

    if (compact) {
        return (
            <div className={cn("space-y-2", className)}>
                {/* Compact Strength Bar */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Password Strength</span>
                    <span className={cn("text-sm font-medium", feedback.color.text)}>
                        {strength.charAt(0).toUpperCase() + strength.slice(1)}
                    </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div 
                        className={cn("h-2 rounded-full transition-all duration-300", feedback.color.bg)}
                        style={{ width: `${score}%` }}
                    />
                </div>
                {errors.length > 0 && (
                    <p className="text-xs text-destructive">{errors[0]}</p>
                )}
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Strength Indicator */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Password Strength
                    </span>
                    <span className={cn("text-sm font-medium", feedback.color.text)}>
                        {feedback.message}
                    </span>
                </div>
                
                {/* Strength Bar */}
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                        className={cn(
                            "h-3 rounded-full transition-all duration-500 ease-out",
                            feedback.color.bg
                        )}
                        style={{ width: `${score}%` }}
                    />
                </div>
                
                {/* Score Display */}
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Weak</span>
                    <span className="font-medium">{score}/100</span>
                    <span>Excellent</span>
                </div>
            </div>

            {/* Requirements Checklist */}
            {showRequirements && (
                <div className="p-3 bg-muted border border-border rounded-lg">
                    <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Password Requirements
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <RequirementItem 
                            met={requirements.minLength}
                            text="At least 8 characters"
                        />
                        <RequirementItem 
                            met={requirements.hasUppercase}
                            text="One uppercase letter"
                        />
                        <RequirementItem 
                            met={requirements.hasLowercase}
                            text="One lowercase letter"
                        />
                        <RequirementItem 
                            met={requirements.hasNumber}
                            text="One number"
                        />
                        <RequirementItem 
                            met={requirements.hasSpecialChar}
                            text="One special character"
                        />
                        <RequirementItem 
                            met={requirements.notCommon}
                            text="Not a common password"
                        />
                    </div>
                </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Issues to Fix
                    </p>
                    <ul className="text-sm text-destructive space-y-1">
                        {errors.map((error, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <X className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && score < 85 && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Suggestions for Improvement
                    </p>
                    <ul className="text-sm text-primary space-y-1">
                        {suggestions.slice(0, 3).map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Excellent Password Feedback */}
            {score >= 85 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Excellent! Your password is very secure.
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * Individual requirement item component
 */
function RequirementItem({ met, text }) {
    return (
        <div className={cn(
            "flex items-center gap-2 text-xs transition-colors duration-200",
            met ? "text-emerald-700" : "text-muted-foreground"
        )}>
            {met ? (
                <Check className="h-3 w-3 text-emerald-600" />
            ) : (
                <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={met ? "font-medium" : ""}>{text}</span>
        </div>
    );
}

/**
 * Simple strength bar component for inline use
 */
export function PasswordStrengthBar({ score = 0, strength = 'weak', className = '' }) {
    const colors = {
        weak: 'bg-destructive',
        fair: 'bg-orange',
        good: 'bg-warning',
        strong: 'bg-primary',
        excellent: 'bg-emerald-500'
    };

    return (
        <div className={cn("w-full bg-muted rounded-full h-2", className)}>
            <div 
                className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    colors[strength] || colors.weak
                )}
                style={{ width: `${Math.max(5, score)}%` }}
            />
        </div>
    );
}

export default PasswordStrengthIndicator;