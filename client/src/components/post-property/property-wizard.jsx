import { useState } from "react";
import { ChevronRight, ChevronLeft, Check, MapPin, Home, Building2, DollarSign, Camera, User, AlertCircle, ShoppingBag } from 'lucide-react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";

import StepListingType from "../post-property/step-listing-type";
import StepCategory from "../post-property/step-category";
import StepBasicDetails from "../post-property/step-basic-details";
import StepLocation from "../post-property/step-location";
import StepRentPricing from "../post-property/step-rent-pricing";
import StepBuyPricing from "../post-property/step-buy-pricing";
import StepPropertySpecific from "../post-property/step-property-specific";
import StepAmenities from "../post-property/step-amenities";
import StepPhotos from "../post-property/step-photos";
import StepOwnerDetails from "../post-property/step-owner-details";
import SuccessPage from "../post-property/success-page";
import { useDispatch } from "react-redux";
import { postRentProperty, postBuyProperty } from "../../redux/slices/propertySlice";
import { LISTING_TYPES } from "@shared/propertyTypes";

const STEPS = [
    { id: 1, name: "Listing Type", icon: ShoppingBag },
    { id: 2, name: "Category", icon: Home },
    { id: 3, name: "Details", icon: Building2 },
    { id: 4, name: "Location", icon: MapPin },
    { id: 5, name: "Pricing", icon: DollarSign },
    { id: 6, name: "Specifics", icon: Home },
    { id: 7, name: "Amenities", icon: Check },
    { id: 8, name: "Photos", icon: Camera },
    { id: 9, name: "Owner", icon: User },
];

export default function PropertyWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const dispatch = useDispatch()

    const [formData, setFormData] = useState({
        listingType: "",
        category: "",
        title: "",
        propertyType: "",
        furnishing: "",
        availableFrom: "",
        city: "",
        address: "",
        mapLocation: "",
        monthlyRent: "",
        securityDeposit: "",
        maintenanceCharge: "",
        negotiable: false,
        rentNegotiable: false,
        preferredTenants: "any",
        leaseDuration: "",
        sellingPrice: "",
        pricePerSqft: "",
        possessionStatus: "ready",
        bookingAmount: "",
        loanAvailable: true,
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
        washroom: "",
        frontage: "",
        amenities: [],
        photos: [],
        ownerName: "",
        ownerPhone: "",
        ownerEmail: "",
        ownerType: "",
    });

    const postPropertyreq = async () => {
        const fd = new FormData();
        
        // Fields to exclude based on listing type
        const rentOnlyFields = ['monthlyRent', 'securityDeposit', 'maintenanceCharge', 'rentNegotiable', 'preferredTenants', 'leaseDuration'];
        const buyOnlyFields = ['sellingPrice', 'pricePerSqft', 'possessionStatus', 'bookingAmount', 'loanAvailable'];
        
        // For BUY properties, exclude RENT fields. For RENT properties, exclude BUY fields.
        const fieldsToExclude = formData.listingType === LISTING_TYPES.BUY ? rentOnlyFields : buyOnlyFields;
        
        Object.keys(formData).forEach(key => {
            // Skip fields that don't belong to this listing type
            if (fieldsToExclude.includes(key)) {
                return;
            }
            
            if (key === "photos") {
                formData.photos.forEach(p => fd.append("photos", p.file));
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

    const validateStep = (step) => {
        const errors = {};

        switch (step) {
            case 1:
                if (!formData.listingType) errors.listingType = "Please select a listing type (Rent or Buy)";
                break;

            case 2:
                if (!formData.category) errors.category = "Please select a property category";
                break;

            case 3:
                if (!formData.title) errors.title = "Title is required";
                if (!formData.propertyType) errors.propertyType = "Property type is required";
                if (!formData.furnishing) errors.furnishing = "Furnishing status is required";
                if (!formData.availableFrom) errors.availableFrom = "Available from date is required";
                break;

            case 4:
                if (!formData.city) errors.city = "City is required";
                if (!formData.address) errors.address = "Address is required";
                break;

            case 5:
                if (formData.listingType === LISTING_TYPES.RENT) {
                    if (!formData.monthlyRent) errors.monthlyRent = "Monthly rent is required";
                } else if (formData.listingType === LISTING_TYPES.BUY) {
                    if (!formData.sellingPrice) errors.sellingPrice = "Selling price is required";
                }
                break;

            case 9:
                if (!formData.ownerName) errors.ownerName = "Owner name is required";
                if (!formData.ownerPhone) errors.ownerPhone = "Phone number is required";
                if (!formData.ownerEmail) errors.ownerEmail = "Email is required";
                if (!formData.ownerType) errors.ownerType = "Please specify if you are owner or broker";
                break;
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < STEPS.length) {
                setCurrentStep(currentStep + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setValidationErrors({});
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        try {
            await postPropertyreq();
            console.log("Form submitted:", formData);
            setSubmitted(true);
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return <SuccessPage />;
    }

    const renderStep = () => {
        const commonProps = { formData, setFormData, validationErrors };

        switch (currentStep) {
            case 1:
                return <StepListingType {...commonProps} />;
            case 2:
                return <StepCategory {...commonProps} />;
            case 3:
                return <StepBasicDetails {...commonProps} />;
            case 4:
                return <StepLocation {...commonProps} />;
            case 5:
                // Conditionally render pricing step based on listing type
                if (formData.listingType === LISTING_TYPES.BUY) {
                    return <StepBuyPricing {...commonProps} />;
                }
                return <StepRentPricing {...commonProps} />;
            case 6:
                return <StepPropertySpecific {...commonProps} />;
            case 7:
                return <StepAmenities {...commonProps} />;
            case 8:
                return <StepPhotos {...commonProps} />;
            case 9:
                return <StepOwnerDetails {...commonProps} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2">Post Your Property</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Step {currentStep} of {STEPS.length}
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

                {/* Buttons */}
                <div className="flex gap-3 sm:gap-4 justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 text-sm sm:text-base"
                    >
                        <ChevronLeft size={18} />
                        <span className="hidden xs:inline">Previous</span>
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 text-sm sm:text-base"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Processing...</span>
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
