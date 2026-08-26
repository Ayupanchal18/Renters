/**
 * Similar Properties Routes
 * Implements multi-tier weighted similarity recommendation algorithm & fallbacks
 */

import { Router } from "express";
import { Property } from "../models/Property.js";
import mongoose from "mongoose";

const router = Router();

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
    if (!str) return "";
    const specialChars = ['\\', '.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']'];
    let result = String(str);
    for (const char of specialChars) {
        result = result.split(char).join('\\' + char);
    }
    return result;
}

/**
 * Indian City Coordinates Dictionary for distance calculation
 */
const CITY_COORDINATES = {
    "ahmedabad": { lat: 23.0225, lng: 72.5714 },
    "vadodara": { lat: 22.3072, lng: 73.1812 },
    "surat": { lat: 21.1702, lng: 72.8311 },
    "rajkot": { lat: 22.3039, lng: 70.8022 },
    "gandhinagar": { lat: 23.2156, lng: 72.6369 },
    "mumbai": { lat: 19.0760, lng: 72.8777 },
    "pune": { lat: 18.5204, lng: 73.8567 },
    "delhi": { lat: 28.7041, lng: 77.1025 },
    "noida": { lat: 28.5355, lng: 77.3910 },
    "gurgaon": { lat: 28.4595, lng: 77.0266 },
    "indore": { lat: 22.7196, lng: 75.8577 },
    "bhopal": { lat: 23.2599, lng: 77.4126 },
    "bangalore": { lat: 12.9716, lng: 77.5946 },
    "bengaluru": { lat: 12.9716, lng: 77.5946 },
    "hyderabad": { lat: 17.3850, lng: 78.4867 },
    "chennai": { lat: 13.0827, lng: 80.2707 },
    "kolkata": { lat: 22.5726, lng: 88.3639 },
    "jaipur": { lat: 26.9124, lng: 75.7873 },
    "chandigarh": { lat: 30.7333, lng: 76.7794 },
    "lucknow": { lat: 26.8467, lng: 80.9462 }
};

function extractCityBase(cityStr) {
    if (!cityStr) return "";
    return cityStr.split(",")[0].toLowerCase().trim();
}

function getCoordinates(property) {
    if (property.location && Array.isArray(property.location.coordinates) && property.location.coordinates.length === 2) {
        const [lng, lat] = property.location.coordinates;
        if (lat !== 0 || lng !== 0) return { lat: Number(lat), lng: Number(lng) };
    }
    if (property.mapLocation && typeof property.mapLocation === "string") {
        const parts = property.mapLocation.split(",").map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] };
        }
    }
    const cityBase = extractCityBase(property.city);
    if (cityBase && CITY_COORDINATES[cityBase]) {
        return CITY_COORDINATES[cityBase];
    }
    return null;
}

function calculateDistanceKm(coord1, coord2) {
    if (!coord1 || !coord2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
    const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * (Math.PI / 180)) *
        Math.cos(coord2.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

/**
 * GET /api/properties/:identifier/similar
 * Calculate similar properties based on weighted similarity scoring and fallbacks
 */
router.get("/:identifier/similar", async (req, res) => {
    try {
        const { identifier } = req.params;
        const limit = Math.min(Number(req.query.limit) || 8, 16);

        let targetProperty;

        if (mongoose.Types.ObjectId.isValid(identifier)) {
            targetProperty = await Property.findOne({
                _id: identifier,
                isDeleted: false
            }).lean();
        }

        if (!targetProperty) {
            targetProperty = await Property.findOne({
                slug: identifier,
                isDeleted: false
            }).lean();
        }

        if (!targetProperty) {
            return res.status(404).json({
                success: false,
                message: "Target property not found for recommendation"
            });
        }

        const listingType = targetProperty.listingType || "rent";
        const currentId = targetProperty._id;
        const targetCity = targetProperty.city || "";
        const targetLocality = targetProperty.locality || "";
        const targetCategory = targetProperty.category || "";
        const targetPropertyType = targetProperty.propertyType || "";
        const targetPrice = listingType === "buy" ? (targetProperty.sellingPrice || 0) : (targetProperty.monthlyRent || 0);
        const targetCoords = getCoordinates(targetProperty);

        // Fetch active candidate properties of the same listing type (excluding target)
        const baseFilter = {
            _id: { $ne: currentId },
            isDeleted: false,
            status: "active",
            $or: [
                { listingType: listingType },
                { listingType: { $exists: false } }
            ]
        };

        let candidateQuery = Property.find(baseFilter).populate("ownerId", "name email phone isVerified").lean();
        let candidates = await candidateQuery.exec();

        const targetCityBase = extractCityBase(targetCity);
        const targetLocalityBase = targetLocality.toLowerCase().trim();

        // Score candidates based on location proximity, distance, budget, specs
        const scoredCandidates = candidates.map(candidate => {
            let score = 0;
            const matchReasons = [];

            const candCityBase = extractCityBase(candidate.city);
            const candLocalityBase = (candidate.locality || "").toLowerCase().trim();
            const candSociety = (candidate.society || candidate.buildingName || "").toLowerCase().trim();
            const targetSociety = (targetProperty.society || targetProperty.buildingName || "").toLowerCase().trim();

            const isSameSociety = targetSociety && candSociety && (
                candSociety === targetSociety ||
                candSociety.includes(targetSociety) ||
                targetSociety.includes(candSociety)
            );

            const isSameLocality = targetLocalityBase && candLocalityBase && (
                candLocalityBase === targetLocalityBase ||
                candLocalityBase.includes(targetLocalityBase) ||
                targetLocalityBase.includes(candLocalityBase)
            );

            const isSameCity = candCityBase && targetCityBase && (
                candCityBase === targetCityBase ||
                candCityBase.includes(targetCityBase) ||
                targetCityBase.includes(candCityBase) ||
                (candidate.address && candidate.address.toLowerCase().includes(targetCityBase))
            );

            // Calculate distance if available
            const candCoords = getCoordinates(candidate);
            const distanceKm = (targetCoords && candCoords) ? calculateDistanceKm(targetCoords, candCoords) : null;

            // 1. Location & Society Proximity (Priority #1)
            if (isSameSociety) {
                score += 150;
                matchReasons.push("Same Society");
            } else if (isSameLocality) {
                score += 120;
                matchReasons.push("Same Locality");
            } else if (isSameCity) {
                score += 90;
                matchReasons.push(`In ${candidate.city || targetCity}`);
            } else if (distanceKm !== null) {
                // For properties outside same city: score higher if closer in distance (nearest to farthest)
                const distanceScore = Math.max(0, 50 - Math.floor(distanceKm / 20));
                score += distanceScore;
                matchReasons.push(`${distanceKm} km away`);
            } else {
                score -= 30;
            }

            // 2. Budget Proximity (Priority #2)
            const candidatePrice = listingType === "buy" ? (candidate.sellingPrice || 0) : (candidate.monthlyRent || 0);
            if (targetPrice > 0 && candidatePrice > 0) {
                const diffRatio = Math.abs(candidatePrice - targetPrice) / targetPrice;
                if (diffRatio <= 0.15) {
                    score += 50;
                    matchReasons.push("Similar Budget");
                } else if (diffRatio <= 0.30) {
                    score += 30;
                    matchReasons.push("Similar Budget");
                } else if (diffRatio <= 0.50) {
                    score += 15;
                }
            }

            // 3. Category & Property Type Match
            if (targetCategory && candidate.category && candidate.category.toLowerCase() === targetCategory.toLowerCase()) {
                score += 15;
                if (!matchReasons.includes("Same Locality")) {
                    matchReasons.push(`Similar ${candidate.category}`);
                }
            }
            if (targetPropertyType && candidate.propertyType && candidate.propertyType.toLowerCase() === targetPropertyType.toLowerCase()) {
                score += 10;
            }

            // 4. Specs Match
            if (targetProperty.bedrooms && candidate.bedrooms === targetProperty.bedrooms) {
                score += 10;
            }
            if (targetProperty.furnishing && candidate.furnishing === targetProperty.furnishing) {
                score += 5;
            }

            // Primary Match Reason Label
            let primaryReason;
            if (isSameSociety) primaryReason = "Same Society";
            else if (isSameLocality) primaryReason = "Same Locality";
            else if (isSameCity) primaryReason = `In ${candidate.city || targetCity}`;
            else if (distanceKm !== null) primaryReason = `${distanceKm} km away (${candidate.city || "Nearby"})`;
            else if (matchReasons.includes("Similar Budget")) primaryReason = "Similar Budget";
            else primaryReason = matchReasons[0] || (candidate.city ? `In ${candidate.city}` : "Recommended");

            return {
                ...candidate,
                similarityScore: score,
                distanceKm: distanceKm,
                isSameCity: isSameCity || isSameLocality || isSameSociety,
                matchReason: primaryReason,
                matchReasons: matchReasons
            };
        });

        // Sort by similarityScore descending, then distance ascending, then creation date
        scoredCandidates.sort((a, b) => {
            if (b.similarityScore !== a.similarityScore) {
                return b.similarityScore - a.similarityScore;
            }
            if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
                return a.distanceKm - b.distanceKm;
            }
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        // Top results
        let results = scoredCandidates.slice(0, limit);

        res.json({
            success: true,
            data: {
                targetPropertyId: currentId,
                total: results.length,
                items: results
            }
        });

    } catch (err) {
        console.error("GET /api/properties/:identifier/similar error:", err);
        res.status(500).json({
            success: false,
            error: "Server error fetching similar properties",
            message: err.message
        });
    }
});

export default router;
