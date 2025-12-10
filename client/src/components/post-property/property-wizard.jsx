import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, Check, MapPin, Home, Building2, DollarSign, Camera, User, AlertCircle } from 'lucide-react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";

import StepCategory from "../post-property/step-category";
import StepBasicDetails from "../post-property/step-basic-details";
import StepLocation from "../post-property/step-location";
import StepPricing from "../post-property/step-pricing";
import StepPropertySpecific from "../post-property/step-property-specific";
import StepAmenities from "../post-property/step-amenities";
import StepPhotos from "../post-property/step-photos";
import StepOwnerDetails from "../post-property/step-owner-details";
import SuccessPage from "../post-property/success-page";
import { useDispatch } from "react-redux";
import { postProperty } from "../../redux/slices/propertySlice";

const STEPS = [
    { id: 1, name: "Category", icon: Home },
    { id: 2, name: "Details", icon: Building2 },
    { id: 3, name: "Location", icon: MapPin },
    { id: 4, name: "Pricing", icon: DollarSign },
    { id: 5, name: "Specifics", icon: Home },
    { id: 6, name: "Amenities", icon: Check },
    { id: 7, name: "Photos", icon: Camera },
    { id: 8, name: "Owner", icon: User },
];

export default function PropertyWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const dispatch = useDispatch()

    const [formData, setFormData] = useState({
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


    // const postPropertyreq = async () => {
    //     try {
    //         const response = await dispatch(postProperty(formData))
    //         const data = response.data;
    //         console.log("response Data", data)
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }
    const postPropertyreq = async () => {
        const fd = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === "photos") {
                formData.photos.forEach(p => fd.append("photos", p.file));
            } else {
                fd.append(key, formData[key]);
            }
        });

        try {
            const response = await dispatch(postProperty(fd));
            console.log(response);
        } catch (error) {
            console.log(error);
        }
    };




    const validateStep = (step) => {
        const errors = {};

        switch (step) {
            case 1:
                if (!formData.category) errors.category = "Please select a property category";
                break;

            case 2:
                if (!formData.title) errors.title = "Title is required";
                if (!formData.propertyType) errors.propertyType = "Property type is required";
                if (!formData.furnishing) errors.furnishing = "Furnishing status is required";
                if (!formData.availableFrom) errors.availableFrom = "Available from date is required";
                break;

            case 3:
                if (!formData.city) errors.city = "City is required";
                if (!formData.address) errors.address = "Address is required";
                break;

            case 4:
                if (!formData.monthlyRent) errors.monthlyRent = "Monthly rent is required";
                break;

            case 8:
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
        postPropertyreq()
        setIsSubmitting(true);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        console.log("Form submitted:", formData);

        setSubmitted(true);
        setIsSubmitting(false);
    };

    if (submitted) {
        return <SuccessPage />;
    }

    const renderStep = () => {
        const commonProps = { formData, setFormData, validationErrors };

        switch (currentStep) {
            case 1:
                return <StepCategory {...commonProps} />;
            case 2:
                return <StepBasicDetails {...commonProps} />;
            case 3:
                return <StepLocation {...commonProps} />;
            case 4:
                return <StepPricing {...commonProps} />;
            case 5:
                return <StepPropertySpecific {...commonProps} />;
            case 6:
                return <StepAmenities {...commonProps} />;
            case 7:
                return <StepPhotos {...commonProps} />;
            case 8:
                return <StepOwnerDetails {...commonProps} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Post Your Property</h1>
                    <p className="text-slate-600">
                        Step {currentStep} of {STEPS.length} • Complete all details to list your property
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        {STEPS.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = index < currentStep - 1;
                            const isCurrent = index === currentStep - 1;

                            return (
                                <div key={step.id} className="flex flex-col items-center flex-1">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300${isCompleted
                                            ? "bg-emerald-500 text-white"
                                            : isCurrent
                                                ? "bg-blue-600 text-white scale-110 shadow-lg"
                                                : "bg-slate-200 text-slate-600"
                                            }`}
                                    >
                                        {isCompleted ? <Check size={20} /> : <StepIcon size={20} />}
                                    </div>

                                    <span
                                        className={`text-xs mt-2 text-center${isCurrent ? "font-semibold text-blue-600" : "text-slate-500"
                                            }`}
                                    >
                                        {step.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
                            style={{
                                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Validation Errors */}
                {Object.keys(validationErrors).length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-red-800 mb-1">Please fix the following:</h3>
                            <ul className="text-sm text-red-700 space-y-1">
                                {Object.values(validationErrors).map((error, idx) => (
                                    <li key={idx}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Step Content */}
                <Card className="p-6 sm:p-8 shadow-lg border-0 mb-8 animate-fade-in">{renderStep()}</Card>

                {/* Buttons */}
                <div className="flex gap-4 justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-6"
                    >
                        <ChevronLeft size={20} />
                        Previous
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">⏳</span> Processing...
                            </>
                        ) : currentStep === STEPS.length ? (
                            <>
                                Submit Listing <Check size={20} />
                            </>
                        ) : (
                            <>
                                Next <ChevronRight size={20} />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
