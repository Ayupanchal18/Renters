import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Check, MapPin, Home, Building2, DollarSign, Camera, AlertCircle, ClipboardCheck, Globe } from 'lucide-react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";

import BasicInfoStep from "./steps/BasicInfoStep";
import LocationStep from "./steps/LocationStep";
import DetailsStep from "./steps/DetailsStep";
import PhotosStep from "./steps/PhotosStep";
import VirtualTourStep from "./steps/VirtualTourStep";
import PricingStep from "./steps/PricingStep";
import ReviewStep from "./steps/ReviewStep";
import SuccessPage from "./success-page";
import DraftRestoreModal from "./draft-restore-modal";

import { useDispatch } from "react-redux";
import { postRentProperty, postBuyProperty } from "../../redux/slices/propertySlice";
import { LISTING_TYPES } from "@shared/propertyTypes";
import { validateStep } from "@shared/validation/wizard";
import { useDraftSave, loadDraft, clearDraft } from "../../hooks/useDraftSave";

const STEPS = [
    { id: 1, name: "Basic Info", icon: Home },
    { id: 2, name: "Location", icon: MapPin },
    { id: 3, name: "Details & Amenities", icon: Building2 },
    { id: 4, name: "Photos", icon: Camera },
    { id: 5, name: "Virtual Tour", icon: Globe },
    { id: 6, name: "Pricing", icon: DollarSign },
    { id: 7, name: "Review", icon: ClipboardCheck },
];

const INITIAL_FORM_DATA = {
    listingType: "",
    category: "",
    title: "",
    description: "",
    propertyType: "",
    furnishing: "",
    availableFrom: "",
    city: "",
    state: "",
    locality: "",
    pincode: "",
    address: "",
    mapLocation: "",
    monthlyRent: "",
    securityDeposit: "",
    maintenanceCharge: "",
    negotiable: false,
    rentNegotiable: false,
    preferredTenants: "any",
    leaseDuration: "",
    lockInPeriod: 0,
    brokerage: "",
    sellingPrice: "",
    pricePerSqft: "",
    possessionStatus: "ready",
    bookingAmount: "",
    loanAvailable: true,
    priceNegotiable: false,
    ownershipType: "",
    reraNumber: "",
    roomType: "",
    bathroomType: "",
    kitchenAvailable: false,
    builtUpArea: "",
    carpetArea: "",
    bedrooms: "",
    bathrooms: "",
    balconies: "",
    floorNumber: "",
    totalFloors: "",
    facingDirection: "",
    parking: "",
    propertyAge: "",
    waterSupply: "",
    powerBackup: "",
    gatedCommunity: false,
    washroom: "",
    frontage: "",
    amenities: [],
    photos: [],
    virtualTour: {
        type: "none",
        matterportUrl: "",
        videoUrl: "",
        panoramaImages: [],
    },
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerType: "",
};

export default function PropertyWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [propertyId, setPropertyId] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [pendingDraft, setPendingDraft] = useState(null);

    const dispatch = useDispatch();

    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    // Draft auto-save
    useDraftSave(formData, currentStep, submitted);

    // Check for saved draft on mount
    useEffect(() => {
        const draft = loadDraft();
        if (draft && draft.formData) {
            setPendingDraft(draft);
            setShowDraftModal(true);
        }
    }, []);

    // Auto-scroll to first validation error on step transition failure
    useEffect(() => {
        if (Object.keys(validationErrors).length > 0) {
            const timer = setTimeout(() => {
                const firstErrorEl = document.querySelector('.border-destructive, .text-destructive, [class*="border-destructive"], [class*="text-destructive"]');
                if (firstErrorEl) {
                    firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(firstErrorEl.tagName)) {
                        firstErrorEl.focus({ preventScroll: true });
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [validationErrors]);

    const handleRestoreDraft = () => {
        if (pendingDraft?.formData) {
            // Restore form data (photos will be empty since File objects can't be serialized)
            setFormData({
                ...INITIAL_FORM_DATA,
                ...pendingDraft.formData,
                photos: [], // Photos can't be restored from localStorage
            });
            const restoredStep = pendingDraft.currentStep || 1;
            setCurrentStep(Math.min(restoredStep, 7));
        }
        setShowDraftModal(false);
        setPendingDraft(null);
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setShowDraftModal(false);
        setPendingDraft(null);
    };

    const postPropertyreq = async () => {
        const fd = new FormData();
        
        // Fields to exclude based on listing type
        const rentOnlyFields = ['monthlyRent', 'securityDeposit', 'maintenanceCharge', 'rentNegotiable', 'preferredTenants', 'leaseDuration', 'lockInPeriod', 'brokerage'];
        const buyOnlyFields = ['sellingPrice', 'pricePerSqft', 'possessionStatus', 'bookingAmount', 'loanAvailable', 'priceNegotiable', 'ownershipType', 'reraNumber'];
        
        // For BUY properties, exclude RENT fields. For RENT properties, exclude BUY fields.
        const fieldsToExclude = formData.listingType === LISTING_TYPES.BUY ? rentOnlyFields : buyOnlyFields;
        
        Object.keys(formData).forEach(key => {
            // Skip fields that don't belong to this listing type
            if (fieldsToExclude.includes(key)) {
                return;
            }
            
            if (key === "photos") {
                formData.photos.forEach(p => fd.append("photos", p.file));
            } else if (key === "virtualTour") {
                // Handle virtual tour nested object
                const vt = formData.virtualTour;
                if (vt && vt.type && vt.type !== "none") {
                    fd.append("virtualTourType", vt.type);
                    if (vt.type === "matterport" && vt.matterportUrl) {
                        fd.append("matterportUrl", vt.matterportUrl);
                    }
                    if (vt.type === "video" && vt.videoUrl) {
                        fd.append("videoUrl", vt.videoUrl);
                    }
                    if (vt.type === "panorama" && vt.panoramaImages?.length > 0) {
                        vt.panoramaImages.forEach((pano, idx) => {
                            fd.append("panoramaImages", pano.file);
                            fd.append("panoramaLabels", pano.label || `Scene ${idx + 1}`);
                        });
                    }
                }
            } else if (key === "amenities" && Array.isArray(formData[key])) {
                // Handle amenities array
                if (formData[key].length > 0) {
                    fd.append(key, formData[key].join(','));
                }
            } else {
                // Only append non-empty values
                const value = formData[key];
                if (value !== "" && value !== null && value !== undefined && value !== false) {
                    fd.append(key, String(value));
                }
            }
        });

        // Use listing-type-specific endpoints
        if (formData.listingType === LISTING_TYPES.BUY) {
            const response = await dispatch(postBuyProperty(fd)).unwrap();
            return response;
        } else {
            const response = await dispatch(postRentProperty(fd)).unwrap();
            return response;
        }
    };

    const handleNext = () => {
        const errors = validateStep(currentStep, formData);
        setValidationErrors(errors);

        if (Object.keys(errors).length === 0) {
            if (currentStep < STEPS.length) {
                setCurrentStep(currentStep + 1);
                // Scroll to top of step content
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                handleSubmit();
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setValidationErrors({});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleEditStep = (step) => {
        setCurrentStep(step);
        setValidationErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        try {
            const response = await postPropertyreq();
            console.log("Form submitted:", formData);
            
            // Extract property ID from various possible response formats
            let newPropertyId = null;
            if (response) {
                newPropertyId = response.data?._id || response.property?._id || response._id || response.data?.property?._id;
            }
            if (newPropertyId) setPropertyId(newPropertyId);
            
            // Clear draft on successful submission
            clearDraft();
            setSubmitted(true);
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return <SuccessPage propertyId={propertyId} />;
    }

    const renderStep = () => {
        const commonProps = { formData, setFormData, validationErrors };

        switch (currentStep) {
            case 1:
                return <BasicInfoStep {...commonProps} />;
            case 2:
                return <LocationStep {...commonProps} />;
            case 3:
                return <DetailsStep {...commonProps} />;
            case 4:
                return <PhotosStep {...commonProps} />;
            case 5:
                return <VirtualTourStep {...commonProps} />;
            case 6:
                return <PricingStep {...commonProps} />;
            case 7:
                return <ReviewStep formData={formData} onEditStep={handleEditStep} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
            {/* Draft Restore Modal */}
            {showDraftModal && (
                <DraftRestoreModal
                    draft={pendingDraft}
                    onRestore={handleRestoreDraft}
                    onDiscard={handleDiscardDraft}
                />
            )}

            <div className="max-w-4xl mx-auto pb-20 sm:pb-0">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2">Post Your Property</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].name}
                    </p>
                </div>

                {/* Progress Bar - Mobile optimized */}
                <div className="mb-6 sm:mb-8">
                    {/* Mobile: Show only current step info */}
                    <div className="flex sm:hidden items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {(() => {
                                const CurrentIcon = STEPS[currentStep - 1].icon;
                                return (
                                    <>
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                                            <CurrentIcon size={18} />
                                        </div>
                                        <span className="font-semibold text-foreground">{STEPS[currentStep - 1].name}</span>
                                    </>
                                );
                            })()}
                        </div>
                        <span className="text-sm text-muted-foreground">{currentStep}/{STEPS.length}</span>
                    </div>

                    {/* Desktop: Show all steps */}
                    <div className="hidden sm:flex justify-between items-center mb-4 px-2">
                        {STEPS.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = index < currentStep - 1;
                            const isCurrent = index === currentStep - 1;

                            return (
                                <div key={step.id} className="flex flex-col items-center flex-1 px-1">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isCompleted
                                            ? "bg-success text-success-foreground"
                                            : isCurrent
                                                ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {isCompleted ? <Check size={18} /> : <StepIcon size={18} />}
                                    </div>

                                    <span
                                        className={`text-xs mt-2 text-center ${isCurrent ? "font-semibold text-primary" : "text-muted-foreground"
                                            }`}
                                    >
                                        {step.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full h-1.5 sm:h-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                            style={{
                                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Validation Errors */}
                {Object.keys(validationErrors).length > 0 && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2 sm:gap-3">
                        <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                        <div>
                            <h3 className="font-semibold text-destructive text-sm sm:text-base mb-1">Please fix the following:</h3>
                            <ul className="text-xs sm:text-sm text-destructive/80 space-y-1">
                                {Object.values(validationErrors).map((error, idx) => (
                                    <li key={idx}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Step Content */}
                <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border border-border mb-6 sm:mb-8 bg-card">{renderStep()}</Card>

                {/* Buttons - Desktop (normal flow) */}
                <div className="hidden sm:flex gap-3 sm:gap-4 justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 text-sm sm:text-base"
                    >
                        <ChevronLeft size={18} />
                        <span>Previous</span>
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 text-sm sm:text-base"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">⏳</span> <span>Processing...</span>
                            </>
                        ) : currentStep === STEPS.length ? (
                            <>
                                Submit <Check size={18} />
                            </>
                        ) : (
                            <>
                                Next <ChevronRight size={18} />
                            </>
                        )}
                    </Button>
                </div>

                {/* Buttons - Mobile (sticky bottom) */}
                <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-background/95 backdrop-blur-md border-t border-border p-3 flex gap-3 z-40">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="flex-1 flex items-center justify-center gap-1.5 h-11"
                    >
                        <ChevronLeft size={18} />
                        Previous
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-1.5 h-11"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">⏳</span> Processing...
                            </>
                        ) : currentStep === STEPS.length ? (
                            <>
                                Submit <Check size={18} />
                            </>
                        ) : (
                            <>
                                Next <ChevronRight size={18} />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
