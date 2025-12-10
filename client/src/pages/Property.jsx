import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Share2, ChevronDown, MapPin, Phone, Mail, Calendar, CheckCircle, MessageSquare } from 'lucide-react'

import { Button } from "../components/ui/button";
import ImageCarousel from "../components/property/image-carousel";
import PropertyDetails from "../components/property/property-details";
import PropertyLocation from "../components/property/property-location";
import OwnerContact from "../components/property/owner-contact";
import NearbyRecommendations from "../components/property/nearby-recommendations";
import Navbar from '../components/Navbar';
import image from "../../public/property_image/luxury-apartment-living-room.png";
import image1 from "../../public/property_image/modern-bedroom-with-city-view.jpg";
import image2 from "../../public/property_image/spacious-kitchen-with-marble-counters.jpg";
import image3 from "../../public/property_image/luxurious-bathroom.jpg";
import profilePhoto from "../../public/property_image/professional-headshot.png";
import livingroom from "../../public/property_image/cozy-eclectic-living-room.png";
import bedroom from "../../public/property_image/cozy-bedroom.png";
import kitchen from "../../public/property_image/modern-minimalist-kitchen.png";
import { useDispatch } from "react-redux";
import { getPropertyByID } from "../redux/slices/propertySlice";

// -------------------------------
// MOCK PROPERTY DATA
// -------------------------------
const mockProperty = {
    _id: "1",
    title: "Luxurious Modern Apartment",
    price: 125000,
    address: {
        line: "123 Premium Boulevard",
        city: "San Francisco",
        pincode: "94102",
    },
    images: [
        image,
        image1,
        image2,
        image3,
    ],
    description:
        "Stunning modern apartment in the heart of downtown with panoramic city views, premium finishes, and state-of-the-art amenities.",
    beds: 3,
    baths: 2,
    sqft: 2200,
    type: "Apartment",
    category: "Premium Residential",
    furnishing: "Fully Furnished",
    locality: "Downtown District",
    landmark: "Near Central Park",
    availability: "Immediate",
    maintenanceCharges: 500,
    securityDeposit: 25000,
    postedDate: "2024-11-10",
    verificationStatus: "Verified",
    owner: {
        _id: "owner1",
        name: "Sarah Anderson",
        email: "sarah@example.com",
        phone: "+1 (555) 123-4567",
        avatar: profilePhoto,
    },
    geolocation: {
        lat: 37.7749,
        lng: -122.4194,
    },
    roomPhotos: [
        { name: "Living Room", image: livingroom },
        { name: "Bedroom", image: bedroom },
        { name: "Kitchen", image: kitchen },
    ],
};

export default function PropertyPage({ params }) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [propertyData, setPropertyData] = useState({});
    const navigate = useNavigate()


    const { slug } = useParams()
    const dispatch = useDispatch()

    const obj = {
        key: slug
    }

    const fetchPropertyData = async () => {

        try {
            const response = await dispatch(getPropertyByID(obj))
            const data = response?.payload
            console.log(data)
            setPropertyData(data)
        } catch (error) {
            console.log(error)
        }

    }

    useEffect(() => {
        fetchPropertyData()
    }, [])


    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: mockProperty.title,
                text: `Check out this amazing property:${mockProperty.title}`,
                url: window.location.href,
            });
        }
    };

    const daysPosted = Math.floor(
        (new Date().getTime() -
            new Date(mockProperty.postedDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    function formatDate(timestamp) {
        const date = new Date(timestamp);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    function capitalizeFirstLetter(text) {
        if (!text) return "";
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }



    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
                {/* Back Navigation */}
                <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 pb-2">
                    <button className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-amber-700 transition-colors hover:bg-amber-50 px-3 py-2 rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                </div>

                <main className="max-w-7xl mx-auto px-3 sm:px-4 pb-8">
                    {/* Main 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                        {/* LEFT: Gallery */}
                        <div className="lg:col-span-3">
                            <ImageCarousel
                                images={mockProperty.images}
                                propertyTitle={mockProperty.title}
                            />
                        </div>

                        {/* RIGHT: Info */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Title Section */}
                            <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                            {capitalizeFirstLetter(propertyData.title)}
                                        </h1>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleShare}
                                            className="p-2 hover:bg-amber-50 rounded-lg text-slate-600 hover:text-amber-700"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => setIsFavorited(!isFavorited)}
                                            className="p-2 hover:bg-red-50 rounded-lg"
                                        >
                                            <Heart
                                                className={`w-4 h-4${isFavorited
                                                    ? "fill-red-500 text-red-500"
                                                    : "text-slate-600 hover:text-red-500"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                                    <MapPin className="w-3 h-3" />
                                    <span>{propertyData.address}</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="badge-amber">{capitalizeFirstLetter(propertyData.category)}</span>
                                    <span className="badge-blue">{capitalizeFirstLetter(propertyData.furnishing)}</span>

                                    <span className="badge-gray flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(propertyData.createdAt)}
                                    </span>

                                    {propertyData.verificationStatus === "Verified" && (
                                        <span className="badge-green flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Price Highlight */}
                            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white rounded-xl p-4 shadow-md">
                                <p className="text-xs font-semibold opacity-90 mb-1 uppercase tracking-wide">
                                    Monthly Rent
                                </p>
                                <p className="text-3xl font-bold">
                                    ${propertyData.monthlyRent}
                                </p>
                                <p className="text-xs opacity-75 mt-2">
                                    +${propertyData.maintenanceCharge}/month maintenance
                                </p>
                            </div>

                            {/* Quick Facts */}
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold mb-3">Quick Facts</h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="fact-card blue">
                                        <p className="fact-value">{propertyData.bedrooms}</p>
                                        <p className="fact-label">Bedrooms</p>
                                    </div>

                                    <div className="fact-card green">
                                        <p className="fact-value">{propertyData.bathrooms}</p>
                                        <p className="fact-label">Bathrooms</p>
                                    </div>

                                    <div className="fact-card purple">
                                        <p className="fact-value">
                                            {propertyData.builtUpArea}
                                        </p>
                                        <p className="fact-label">Sq. Feet</p>
                                    </div>

                                    <div className="fact-card orange">
                                        <p className="fact-value">{formatDate(propertyData.availableFrom)}</p>
                                        <p className="fact-label">Status</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
                                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg h-10 text-sm">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Request Viewing
                                </Button>

                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-10 text-sm">
                                    Schedule Tour
                                </Button>
                            </div>

                            {/* Owner Card */}
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold mb-3">Owner</h3>

                                <div className="flex items-center gap-3 mb-3">
                                    <img
                                        src={mockProperty.owner.avatar}
                                        alt={capitalizeFirstLetter(propertyData.ownerName)}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-200"
                                    />

                                    <div className="min-w-0">
                                        <p className="font-semibold">{capitalizeFirstLetter(propertyData.ownerName)}</p>
                                        <p className="text-xs text-slate-600">Verified Owner</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <a
                                        href={`tel:${propertyData.ownerPhone}`}
                                        className="contact-link blue"
                                    >
                                        <Phone className="icon-blue" />
                                        <div>
                                            {/* <p className="contact-small">Call</p> */}
                                            <p className="contact-value">{capitalizeFirstLetter(propertyData.ownerPhone)}</p>
                                        </div>
                                    </a>

                                    <a
                                        href={`mailto:${capitalizeFirstLetter(propertyData.ownerEmail)}`}
                                        className="contact-link amber"
                                    >
                                        <Mail className="icon-amber" />
                                        <div>
                                            {/* <p className="contact-small">Email</p> */}
                                            <p className="contact-value truncate">
                                                {capitalizeFirstLetter(propertyData.ownerEmail)}
                                            </p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom sections */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                        <div className="lg:col-span-3 space-y-4">
                            <PropertyDetails property={propertyData} />
                            <PropertyLocation property={propertyData} />
                        </div>

                        <div className="lg:col-span-2">
                            <NearbyRecommendations location={propertyData.locality} />
                        </div>
                    </div>
                </main>
            </div>
        </>

    );
}