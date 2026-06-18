import { Check, Edit2, AlertTriangle, Camera, MapPin, Home, IndianRupee, User, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { calculateQualityScore } from '@shared/validation/wizard';
import { LISTING_TYPES, LISTING_TYPE_LABELS, FURNISHING_LABELS, PREFERRED_TENANTS_LABELS, POSSESSION_STATUS_LABELS, OWNER_TYPE_LABELS, OWNERSHIP_TYPE_LABELS, WATER_SUPPLY_LABELS, POWER_BACKUP_LABELS, LOCK_IN_PERIOD_LABELS } from '@shared/propertyTypes';

const Section = ({ title, icon: Icon, step, onEditStep, children }) => (
    <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
                <Icon size={16} className="text-primary" />
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(step)}
                className="h-7 px-2 text-xs text-primary hover:text-primary"
            >
                <Edit2 size={12} className="mr-1" />
                Edit
            </Button>
        </div>
        <div className="p-4 space-y-2">{children}</div>
    </div>
);

const Field = ({ label, value, missing }) => {
    if (missing || !value) {
        return (
            <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-[120px] sm:min-w-[160px] flex-shrink-0">{label}</span>
                <span className="text-amber-500 italic flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Not provided
                </span>
            </div>
        );
    }
    return (
        <div className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground min-w-[120px] sm:min-w-[160px] flex-shrink-0">{label}</span>
            <span className="text-foreground font-medium">{value}</span>
        </div>
    );
};

/**
 * Step 10: Review & Preview — read-only summary of all data before submission.
 */
export default function StepReview({ formData, onEditStep }) {
    const score = calculateQualityScore(formData);
    const isRent = formData.listingType === LISTING_TYPES.RENT;

    const getScoreColor = () => {
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-amber-500';
        return 'text-destructive';
    };

    const getScoreLabel = () => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Improvement';
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Review Your Listing</h2>
                <p className="text-sm text-muted-foreground">
                    Check all details before submitting. Click &ldquo;Edit&rdquo; on any section to make changes.
                </p>
            </div>

            {/* Quality Score */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-primary" />
                        <span className="font-semibold text-foreground text-sm sm:text-base">Listing Quality</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getScoreColor()}`}>{score}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            score >= 80 ? 'bg-success' : score >= 60 ? 'bg-amber-500' : 'bg-destructive'
                        }`}
                        style={{ width: `${score}%` }}
                    />
                </div>
                <p className={`text-xs ${getScoreColor()} font-medium`}>{getScoreLabel()}</p>

                {/* Improvement nudges */}
                {score < 80 && (
                    <div className="mt-3 pt-3 border-t border-primary/10 space-y-1">
                        {(!formData.description || formData.description.trim().length < 50) && (
                            <p className="text-xs text-muted-foreground">💡 Add a detailed description to improve your score by +8</p>
                        )}
                        {(formData.photos?.length || 0) < 5 && (
                            <p className="text-xs text-muted-foreground">📷 Upload {5 - (formData.photos?.length || 0)} more photos to boost visibility</p>
                        )}
                        {!formData.locality && (
                            <p className="text-xs text-muted-foreground">📍 Add your locality name for better search visibility</p>
                        )}
                        {(formData.amenities?.length || 0) < 5 && (
                            <p className="text-xs text-muted-foreground">✨ Add more amenities — properties with 5+ get 60% more views</p>
                        )}
                    </div>
                )}
            </div>

            {/* Listing Type & Category */}
            <Section title="Listing Type" icon={Home} step={1} onEditStep={onEditStep}>
                <Field label="Listing for" value={LISTING_TYPE_LABELS[formData.listingType]} />
                <Field label="Category" value={formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : ''} />
            </Section>

            {/* Basic Details */}
            <Section title="Basic Details" icon={Home} step={3} onEditStep={onEditStep}>
                <Field label="Title" value={formData.title} />
                <Field label="Description" value={formData.description ? (formData.description.length > 100 ? formData.description.slice(0, 100) + '...' : formData.description) : ''} missing={!formData.description} />
                <Field label="Property Type" value={formData.propertyType} />
                <Field label="Furnishing" value={FURNISHING_LABELS[formData.furnishing]} />
                <Field label="Available From" value={formData.availableFrom ? new Date(formData.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} />
            </Section>

            {/* Location */}
            <Section title="Location" icon={MapPin} step={4} onEditStep={onEditStep}>
                <Field label="City" value={formData.city} />
                <Field label="Locality" value={formData.locality} missing={!formData.locality} />
                <Field label="Address" value={formData.address} />
                <Field label="State" value={formData.state} missing={!formData.state} />
                <Field label="Pin Code" value={formData.pincode} missing={!formData.pincode} />
            </Section>

            {/* Pricing */}
            <Section title="Pricing" icon={IndianRupee} step={5} onEditStep={onEditStep}>
                {isRent ? (
                    <>
                        <Field label="Monthly Rent" value={formData.monthlyRent ? `₹${Number(formData.monthlyRent).toLocaleString('en-IN')}` : ''} />
                        <Field label="Security Deposit" value={formData.securityDeposit ? `₹${Number(formData.securityDeposit).toLocaleString('en-IN')}` : ''} missing={!formData.securityDeposit} />
                        <Field label="Maintenance" value={formData.maintenanceCharge ? `₹${Number(formData.maintenanceCharge).toLocaleString('en-IN')}/mo` : ''} missing={!formData.maintenanceCharge} />
                        <Field label="Preferred Tenants" value={PREFERRED_TENANTS_LABELS[formData.preferredTenants]} />
                        <Field label="Lock-in Period" value={LOCK_IN_PERIOD_LABELS[formData.lockInPeriod] || ''} missing={!formData.lockInPeriod} />
                        <Field label="Negotiable" value={formData.rentNegotiable ? 'Yes' : 'No'} />
                    </>
                ) : (
                    <>
                        <Field label="Selling Price" value={formData.sellingPrice ? `₹${Number(formData.sellingPrice).toLocaleString('en-IN')}` : ''} />
                        <Field label="Price/sq.ft." value={formData.pricePerSqft ? `₹${Number(formData.pricePerSqft).toLocaleString('en-IN')}` : ''} missing={!formData.pricePerSqft} />
                        <Field label="Possession" value={POSSESSION_STATUS_LABELS[formData.possessionStatus]} />
                        <Field label="Ownership" value={OWNERSHIP_TYPE_LABELS[formData.ownershipType] || ''} missing={!formData.ownershipType} />
                        <Field label="Booking Amount" value={formData.bookingAmount ? `₹${Number(formData.bookingAmount).toLocaleString('en-IN')}` : ''} missing={!formData.bookingAmount} />
                        <Field label="Loan Available" value={formData.loanAvailable ? 'Yes' : 'No'} />
                        <Field label="RERA Number" value={formData.reraNumber} missing={!formData.reraNumber} />
                    </>
                )}
            </Section>

            {/* Property Specifics */}
            <Section title="Property Details" icon={Home} step={6} onEditStep={onEditStep}>
                {(formData.category === 'flat' || formData.category === 'house') && (
                    <>
                        <Field label="Built-up Area" value={formData.builtUpArea ? `${formData.builtUpArea} sq.ft.` : ''} missing={!formData.builtUpArea} />
                        <Field label="Carpet Area" value={formData.carpetArea ? `${formData.carpetArea} sq.ft.` : ''} missing={!formData.carpetArea} />
                        <Field label="Bedrooms" value={formData.bedrooms} />
                        <Field label="Bathrooms" value={formData.bathrooms} missing={!formData.bathrooms} />
                        <Field label="Balconies" value={formData.balconies} missing={!formData.balconies} />
                        <Field label="Floor" value={formData.floorNumber && formData.totalFloors ? `${formData.floorNumber} of ${formData.totalFloors}` : formData.floorNumber || ''} missing={!formData.floorNumber} />
                        <Field label="Facing" value={formData.facingDirection} missing={!formData.facingDirection} />
                        <Field label="Property Age" value={formData.propertyAge} missing={!formData.propertyAge} />
                        <Field label="Parking" value={formData.parking ? formData.parking.charAt(0).toUpperCase() + formData.parking.slice(1) : ''} missing={!formData.parking} />
                    </>
                )}
                {(formData.category === 'room' || formData.category === 'pg' || formData.category === 'hostel') && (
                    <>
                        <Field label="Room Type" value={formData.roomType ? formData.roomType.charAt(0).toUpperCase() + formData.roomType.slice(1) : ''} />
                        <Field label="Bathroom" value={formData.bathroomType ? formData.bathroomType.charAt(0).toUpperCase() + formData.bathroomType.slice(1) : ''} missing={!formData.bathroomType} />
                        <Field label="Kitchen" value={formData.kitchenAvailable ? 'Available' : 'Not Available'} />
                    </>
                )}
                {formData.category === 'commercial' && (
                    <>
                        <Field label="Built-up Area" value={formData.builtUpArea ? `${formData.builtUpArea} sq.ft.` : ''} missing={!formData.builtUpArea} />
                        <Field label="Carpet Area" value={formData.carpetArea ? `${formData.carpetArea} sq.ft.` : ''} missing={!formData.carpetArea} />
                        <Field label="Washroom" value={formData.washroom ? formData.washroom.charAt(0).toUpperCase() + formData.washroom.slice(1) : ''} missing={!formData.washroom} />
                        <Field label="Frontage" value={formData.frontage ? `${formData.frontage} meters` : ''} missing={!formData.frontage} />
                    </>
                )}
                <Field label="Water Supply" value={WATER_SUPPLY_LABELS[formData.waterSupply] || ''} missing={!formData.waterSupply} />
                <Field label="Power Backup" value={POWER_BACKUP_LABELS[formData.powerBackup] || ''} missing={!formData.powerBackup} />
                {formData.gatedCommunity && <Field label="Gated Community" value="Yes" />}
            </Section>

            {/* Amenities */}
            <Section title="Amenities" icon={Check} step={7} onEditStep={onEditStep}>
                {formData.amenities && formData.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {formData.amenities.map((a) => (
                            <span key={a} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                                {a}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-amber-500 italic flex items-center gap-1">
                        <AlertTriangle size={12} />
                        No amenities selected — listings with amenities get 60% more views
                    </p>
                )}
            </Section>

            {/* Photos */}
            <Section title="Photos" icon={Camera} step={8} onEditStep={onEditStep}>
                {formData.photos && formData.photos.length > 0 ? (
                    <>
                        <p className="text-sm text-muted-foreground mb-3">
                            <span className="font-medium text-foreground">{formData.photos.length}</span> photo{formData.photos.length !== 1 ? 's' : ''} uploaded
                            {formData.photos.length < 3 && (
                                <span className="text-amber-500 ml-2">— upload {3 - formData.photos.length} more for better results</span>
                            )}
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {formData.photos.slice(0, 10).map((photo, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border relative">
                                    <img
                                        src={photo.preview || '/placeholder.svg'}
                                        alt={`Photo ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {i === 0 && (
                                        <span className="absolute bottom-0.5 left-0.5 bg-primary text-primary-foreground text-[8px] px-1 py-0.5 rounded">
                                            Cover
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-amber-500 italic flex items-center gap-1">
                        <AlertTriangle size={12} />
                        No photos — listings with photos get 5× more inquiries
                    </p>
                )}
            </Section>

            {/* Owner */}
            <Section title="Contact Details" icon={User} step={9} onEditStep={onEditStep}>
                <Field label="Name" value={formData.ownerName} />
                <Field label="Phone" value={formData.ownerPhone} />
                <Field label="Email" value={formData.ownerEmail} />
                <Field label="Type" value={OWNER_TYPE_LABELS[formData.ownerType] || (formData.ownerType ? formData.ownerType.charAt(0).toUpperCase() + formData.ownerType.slice(1) : '')} />
            </Section>

            {/* Final note */}
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Almost done!</span>{' '}
                    Click &ldquo;Submit&rdquo; below to post your listing. Our team will review and publish it within 24–48 hours.
                </p>
            </div>
        </div>
    );
}
