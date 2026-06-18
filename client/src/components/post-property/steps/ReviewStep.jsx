import { Check, Edit2, AlertTriangle, Camera, MapPin, Home, IndianRupee, User, Sparkles, Globe } from "lucide-react";
import { Button } from "../../ui/button";
import { calculateQualityScore } from "@shared/validation/wizard";
import { 
    LISTING_TYPES, 
    LISTING_TYPE_LABELS, 
    FURNISHING_LABELS, 
    PREFERRED_TENANTS_LABELS, 
    POSSESSION_STATUS_LABELS, 
    OWNER_TYPE_LABELS, 
    OWNERSHIP_TYPE_LABELS, 
    WATER_SUPPLY_LABELS, 
    POWER_BACKUP_LABELS, 
    LOCK_IN_PERIOD_LABELS 
} from "@shared/propertyTypes";

const Section = ({ title, icon: Icon, step, onEditStep, children }) => (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Icon size={15} />
                </div>
                <h3 className="font-bold text-foreground text-xs sm:text-sm">{title}</h3>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(step)}
                className="h-8 px-3 text-xs text-primary hover:text-primary-hover hover:bg-primary/5 rounded-xl flex items-center gap-1 active:scale-95"
            >
                <Edit2 size={12} />
                Edit
            </Button>
        </div>
        <div className="p-4 sm:p-5 space-y-3.5 divide-y divide-border/40">
            {children}
        </div>
    </div>
);

const Field = ({ label, value, missing }) => {
    if (missing || value === undefined || value === null || value === "") {
        return (
            <div className="flex flex-col sm:flex-row sm:items-center py-2 first:pt-0 last:pb-0 gap-1 sm:gap-2 text-xs sm:text-sm">
                <span className="text-muted-foreground min-w-[120px] sm:min-w-[180px] flex-shrink-0 font-medium">
                    {label}
                </span>
                <span className="text-amber-500 italic flex items-center gap-1 font-medium bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10 w-fit">
                    <AlertTriangle size={11} />
                    Not provided
                </span>
            </div>
        );
    }
    return (
        <div className="flex flex-col sm:flex-row sm:items-center py-2 first:pt-0 last:pb-0 gap-1 sm:gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground min-w-[120px] sm:min-w-[180px] flex-shrink-0 font-medium">
                {label}
            </span>
            <span className="text-foreground font-semibold">
                {value}
            </span>
        </div>
    );
};

export default function ReviewStep({ formData, onEditStep }) {
    const score = calculateQualityScore(formData);
    const isRent = formData.listingType === LISTING_TYPES.RENT || formData.listingType === "rent";

    const getScoreColor = () => {
        if (score >= 80) return "text-success";
        if (score >= 60) return "text-amber-500";
        return "text-destructive";
    };

    const getScoreBg = () => {
        if (score >= 80) return "bg-success";
        if (score >= 60) return "bg-amber-500";
        return "bg-destructive";
    };

    const getScoreLabel = () => {
        if (score >= 80) return "Excellent Listing Quality!";
        if (score >= 60) return "Good Listing Quality";
        if (score >= 40) return "Fair Listing Quality";
        return "Needs Improvement";
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                    <Check size={22} className="text-success" />
                    Review & Submit
                </h2>
                <p className="text-sm text-muted-foreground">
                    Double-check details before publishing. Click &ldquo;Edit&rdquo; to modify any step.
                </p>
            </div>

            {/* Quality Score Indicator */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-primary animate-pulse" />
                        <span className="font-bold text-foreground text-xs sm:text-sm">Listing Quality Score</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-2xl font-black ${getScoreColor()}`}>{score}</span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                </div>
                
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-2.5 p-0.5 border border-border/40">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${getScoreBg()}`}
                        style={{ width: `${score}%` }}
                    />
                </div>
                <p className={`text-xs font-bold ${getScoreColor()}`}>{getScoreLabel()}</p>

                {/* score tips */}
                {score < 80 && (
                    <div className="mt-4 pt-3.5 border-t border-border/80 space-y-2">
                        <p className="text-xs font-bold text-foreground">💡 Tips to maximize leads:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                            {(!formData.description || formData.description.trim().length < 50) && (
                                <p className="flex items-center gap-1.5 bg-background/50 p-1.5 rounded-lg border border-border/40">
                                    ✍️ <span className="font-medium">Add detailed description (+8 pts)</span>
                                </p>
                            )}
                            {(formData.photos?.length || 0) < 5 && (
                                <p className="flex items-center gap-1.5 bg-background/50 p-1.5 rounded-lg border border-border/40">
                                    📷 <span className="font-medium">Upload {5 - (formData.photos?.length || 0)} more photos (+8 pts)</span>
                                </p>
                            )}
                            {!formData.locality && (
                                <p className="flex items-center gap-1.5 bg-background/50 p-1.5 rounded-lg border border-border/40">
                                    📍 <span className="font-medium">Specify locality name (+4 pts)</span>
                                </p>
                            )}
                            {(formData.amenities?.length || 0) < 5 && (
                                <p className="flex items-center gap-1.5 bg-background/50 p-1.5 rounded-lg border border-border/40">
                                    ✨ <span className="font-medium">Select more amenities (+4 pts)</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Step 1 Sections: Basic Details */}
            <Section title="1. Basic Information" icon={Home} step={1} onEditStep={onEditStep}>
                <Field label="Listing Type" value={LISTING_TYPE_LABELS[formData.listingType]} />
                <Field label="Category" value={formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : ""} />
                <Field label="Property Title" value={formData.title} />
                <Field label="Property Subtype" value={formData.propertyType} />
                <Field label="Available From" value={formData.availableFrom ? new Date(formData.availableFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""} />
                <Field label="Description" value={formData.description} missing={!formData.description} />
            </Section>

            {/* Step 2 Section: Location */}
            <Section title="2. Location Details" icon={MapPin} step={2} onEditStep={onEditStep}>
                <Field label="City" value={formData.city} />
                <Field label="Locality" value={formData.locality} missing={!formData.locality} />
                <Field label="Full Address" value={formData.address} />
                <Field label="Pin Code" value={formData.pincode} missing={!formData.pincode} />
                <Field label="State" value={formData.state} missing={!formData.state} />
                <Field label="Map Geotag Coordinates" value={formData.mapLocation} missing={!formData.mapLocation} />
            </Section>

            {/* Step 3 Section: Specifics, Amenities, Owner Details */}
            <Section title="3. Property Specifications & Amenities" icon={Home} step={3} onEditStep={onEditStep}>
                <Field label="Furnishing Status" value={FURNISHING_LABELS[formData.furnishing]} />
                
                {(formData.category === "flat" || formData.category === "house") && (
                    <>
                        <Field label="Built-up Area" value={formData.builtUpArea ? `${formData.builtUpArea} sq.ft.` : ""} missing={!formData.builtUpArea} />
                        <Field label="Carpet Area" value={formData.carpetArea ? `${formData.carpetArea} sq.ft.` : ""} missing={!formData.carpetArea} />
                        <Field label="Bedrooms" value={formData.bedrooms} />
                        <Field label="Bathrooms" value={formData.bathrooms} missing={!formData.bathrooms} />
                        <Field label="Balconies" value={formData.balconies} missing={!formData.balconies} />
                        <Field label="Floor Level" value={formData.floorNumber && formData.totalFloors ? `${formData.floorNumber} of ${formData.totalFloors}` : formData.floorNumber || ""} missing={!formData.floorNumber} />
                        <Field label="Facing Direction" value={formData.facingDirection} missing={!formData.facingDirection} />
                        <Field label="Property Age" value={formData.propertyAge} missing={!formData.propertyAge} />
                        <Field label="Parking Space" value={formData.parking ? formData.parking.charAt(0).toUpperCase() + formData.parking.slice(1) : ""} missing={!formData.parking} />
                    </>
                )}

                {(formData.category === "room" || formData.category === "pg" || formData.category === "hostel") && (
                    <>
                        <Field label="Room Sharing Type" value={formData.roomType ? formData.roomType.charAt(0).toUpperCase() + formData.roomType.slice(1) : ""} />
                        <Field label="Bathroom Type" value={formData.bathroomType ? formData.bathroomType.charAt(0).toUpperCase() + formData.bathroomType.slice(1) : ""} missing={!formData.bathroomType} />
                        <Field label="Kitchen Availability" value={formData.kitchenAvailable ? "Available" : "Not Available"} />
                    </>
                )}

                {formData.category === "commercial" && (
                    <>
                        <Field label="Built-up Area" value={formData.builtUpArea ? `${formData.builtUpArea} sq.ft.` : ""} missing={!formData.builtUpArea} />
                        <Field label="Carpet Area" value={formData.carpetArea ? `${formData.carpetArea} sq.ft.` : ""} missing={!formData.carpetArea} />
                        <Field label="Washroom Type" value={formData.washroom ? formData.washroom.charAt(0).toUpperCase() + formData.washroom.slice(1) : ""} missing={!formData.washroom} />
                        <Field label="Frontage Width" value={formData.frontage ? `${formData.frontage} meters` : ""} missing={!formData.frontage} />
                    </>
                )}

                <Field label="Water Supply Type" value={WATER_SUPPLY_LABELS[formData.waterSupply] || ""} missing={!formData.waterSupply} />
                <Field label="Power Backup Mode" value={POWER_BACKUP_LABELS[formData.powerBackup] || ""} missing={!formData.powerBackup} />
                <Field label="Gated Community" value={formData.gatedCommunity ? "Yes" : "No"} />

                <div className="py-2.5">
                    <span className="text-muted-foreground min-w-[120px] sm:min-w-[180px] inline-block text-xs sm:text-sm font-medium mb-1.5">
                        Selected Amenities
                    </span>
                    {formData.amenities && formData.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {formData.amenities.map((a) => (
                                <span key={a} className="text-[10px] sm:text-xs bg-primary/10 text-primary border border-primary/10 px-2.5 py-0.5 rounded-full font-semibold">
                                    {a}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-amber-500 italic flex items-center gap-1 text-xs font-semibold bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10 w-fit">
                            <AlertTriangle size={11} />
                            No amenities selected
                        </span>
                    )}
                </div>

                <div className="pt-3.5 border-t border-border/40 space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
                        <User size={13} className="text-primary" />
                        Owner Contact Details
                    </h4>
                    <Field label="Owner Name" value={formData.ownerName} />
                    <Field label="Mobile Number" value={formData.ownerPhone} />
                    <Field label="Email Address" value={formData.ownerEmail} />
                    <Field label="Advertiser Type" value={OWNER_TYPE_LABELS[formData.ownerType] || (formData.ownerType ? formData.ownerType.charAt(0).toUpperCase() + formData.ownerType.slice(1) : "")} />
                </div>
            </Section>

            {/* Step 4 Section: Photos */}
            <Section title="4. Uploaded Photos" icon={Camera} step={4} onEditStep={onEditStep}>
                {formData.photos && formData.photos.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                            <span className="font-bold text-foreground">{formData.photos.length}</span> image{formData.photos.length !== 1 ? "s" : ""} uploaded. 
                            The first image is the cover thumbnail.
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {formData.photos.map((photo, i) => (
                                <div key={i} className={`aspect-square rounded-xl overflow-hidden border-2 relative bg-card shadow-sm ${i === 0 ? "border-primary" : "border-border"}`}>
                                    <img
                                        src={photo.preview || "/placeholder.svg"}
                                        alt={`Property photo ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {i === 0 && (
                                        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded">
                                            Cover
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <span className="text-amber-500 italic flex items-center gap-1 text-xs font-semibold bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10 w-fit">
                        <AlertTriangle size={11} />
                        No photos uploaded yet
                    </span>
                )}
            </Section>

            {/* Step 5 Section: Virtual Tour */}
            {formData.virtualTour?.type && formData.virtualTour.type !== "none" && (
                <Section title="5. Virtual Tour" icon={Globe} step={5} onEditStep={onEditStep}>
                    <Field label="Tour Type" value={{
                        matterport: "Matterport 3D Tour",
                        panorama: "360° Panorama Photos",
                        video: "Video Tour",
                    }[formData.virtualTour.type]} />
                    {formData.virtualTour.type === "matterport" && (
                        <Field label="Matterport URL" value={formData.virtualTour.matterportUrl} missing={!formData.virtualTour.matterportUrl} />
                    )}
                    {formData.virtualTour.type === "video" && (
                        <Field label="Video URL" value={formData.virtualTour.videoUrl} missing={!formData.virtualTour.videoUrl} />
                    )}
                    {formData.virtualTour.type === "panorama" && (
                        <Field
                            label="Panorama Scenes"
                            value={formData.virtualTour.panoramaImages?.length
                                ? `${formData.virtualTour.panoramaImages.length} image(s) uploaded`
                                : ""}
                            missing={!formData.virtualTour.panoramaImages?.length}
                        />
                    )}
                </Section>
            )}

            {/* Step 6 Section: Pricing */}
            <Section title="6. Financials & Terms" icon={IndianRupee} step={6} onEditStep={onEditStep}>
                {isRent ? (
                    <>
                        <Field label="Monthly Rent" value={formData.monthlyRent ? `₹${Number(formData.monthlyRent).toLocaleString("en-IN")}` : ""} />
                        <Field label="Security Deposit" value={formData.securityDeposit ? `₹${Number(formData.securityDeposit).toLocaleString("en-IN")}` : ""} missing={!formData.securityDeposit} />
                        <Field label="Monthly Maintenance" value={formData.maintenanceCharge ? `₹${Number(formData.maintenanceCharge).toLocaleString("en-IN")}` : ""} missing={!formData.maintenanceCharge} />
                        <Field label="Rent is Negotiable" value={formData.rentNegotiable ? "Yes" : "No"} />
                        <Field label="Preferred Tenants" value={PREFERRED_TENANTS_LABELS[formData.preferredTenants]} />
                        <Field label="Lease Tenure" value={formData.leaseDuration} missing={!formData.leaseDuration} />
                        <Field label="Lock-in Period" value={LOCK_IN_PERIOD_LABELS[formData.lockInPeriod]} missing={!formData.lockInPeriod} />
                        <Field label="Brokerage Fee" value={formData.brokerage} missing={!formData.brokerage} />
                    </>
                ) : (
                    <>
                        <Field label="Selling Price" value={formData.sellingPrice ? `₹${Number(formData.sellingPrice).toLocaleString("en-IN")}` : ""} />
                        <Field label="Price per Sq Ft" value={formData.pricePerSqft ? `₹${Number(formData.pricePerSqft).toLocaleString("en-IN")}` : ""} missing={!formData.pricePerSqft} />
                        <Field label="Possession Status" value={POSSESSION_STATUS_LABELS[formData.possessionStatus]} />
                        <Field label="Ownership Class" value={OWNERSHIP_TYPE_LABELS[formData.ownershipType]} missing={!formData.ownershipType} />
                        <Field label="Booking Amount" value={formData.bookingAmount ? `₹${Number(formData.bookingAmount).toLocaleString("en-IN")}` : ""} missing={!formData.bookingAmount} />
                        <Field label="Price is Negotiable" value={formData.priceNegotiable ? "Yes" : "No"} />
                        <Field label="Home Loan Available" value={formData.loanAvailable ? "Yes" : "No"} />
                        <Field label="RERA Registration" value={formData.reraNumber} missing={!formData.reraNumber} />
                    </>
                )}
            </Section>

            {/* Note & submit info */}
            <div className="p-4 bg-muted/30 border border-border/80 rounded-2xl">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    📝 <strong className="text-foreground font-semibold">Almost there!</strong> Verify all sections are correct. Press <strong className="text-foreground font-semibold">Submit</strong> to publish your listing instantly on our platform.
                </p>
            </div>
        </div>
    );
}
