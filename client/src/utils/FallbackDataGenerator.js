/**
 * Fallback Data Generator utility for missing property information
 * Validates: Requirements 1.2, 4.5, 5.4, 8.5
 * 
 * This utility generates appropriate fallback data when property information
 * is missing, ensuring the UI never displays undefined or null values.
 */

export class FallbackDataGenerator {
    constructor() {
        this.placeholderImages = {
            property: [
                '/property_image/placeholder.jpg',
                '/property_image/placeholder.svg'
            ],
            owner: '/property_image/placeholder-user.jpg',
            logo: '/property_image/placeholder-logo.png'
        };

        this.defaultTexts = {
            title: {
                room: 'Room Available for Rent',
                flat: 'Flat Available for Rent',
                house: 'House Available for Rent',
                pg: 'PG Accommodation Available',
                hostel: 'Hostel Accommodation Available',
                commercial: 'Commercial Space Available',
                default: 'Property Available for Rent'
            },
            description: {
                room: 'Comfortable room available for rent in a prime location.',
                flat: 'Well-maintained flat available for rent with modern amenities.',
                house: 'Spacious house available for rent in a peaceful neighborhood.',
                pg: 'PG accommodation with all necessary facilities.',
                hostel: 'Hostel accommodation with shared facilities.',
                commercial: 'Commercial space suitable for business operations.',
                default: 'Property available for rent in a convenient location.'
            }
        };

        this.defaultAmenities = {
            room: ['Bed', 'Study Table', 'Wardrobe', 'Fan'],
            flat: ['Kitchen', 'Bathroom', 'Balcony', 'Parking'],
            house: ['Garden', 'Parking', 'Kitchen', 'Multiple Bathrooms'],
            pg: ['Meals', 'WiFi', 'Laundry', 'Security'],
            hostel: ['Mess', 'Common Room', 'WiFi', 'Security'],
            commercial: ['Parking', 'Security', 'Power Backup', 'Elevator'],
            default: ['Basic Amenities']
        };

        this.cityDefaults = {
            'mumbai': { securityMultiplier: 3, maintenanceBase: 2000 },
            'delhi': { securityMultiplier: 2.5, maintenanceBase: 1800 },
            'bangalore': { securityMultiplier: 2, maintenanceBase: 1500 },
            'pune': { securityMultiplier: 2, maintenanceBase: 1200 },
            'hyderabad': { securityMultiplier: 1.8, maintenanceBase: 1000 },
            'chennai': { securityMultiplier: 1.8, maintenanceBase: 1000 },
            'default': { securityMultiplier: 2, maintenanceBase: 1000 }
        };
    }

    /**
     * Generates fallback title based on property category and location
     * @param {Object} property - Property data
     * @returns {string} - Generated title
     */
    generateTitle(property = {}) {
        const category = property.category?.toLowerCase() || 'default';
        const city = property.city || 'Prime Location';

        const baseTitle = this.defaultTexts.title[category] || this.defaultTexts.title.default;

        if (property.propertyType) {
            return `${property.propertyType} in ${city}`;
        }

        return `${baseTitle} in ${city}`;
    }

    /**
     * Generates fallback description based on property details
     * @param {Object} property - Property data
     * @returns {string} - Generated description
     */
    generateDescription(property = {}) {
        const category = property.category?.toLowerCase() || 'default';
        const baseDescription = this.defaultTexts.description[category] || this.defaultTexts.description.default;

        let description = baseDescription;

        // Add specific details if available
        if (property.bedrooms && property.bedrooms > 0) {
            description += ` Features ${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}.`;
        }

        if (property.furnishing) {
            const furnishingText = property.furnishing === 'fully' ? 'fully furnished' :
                property.furnishing === 'semi' ? 'semi-furnished' : 'unfurnished';
            description += ` The property is ${furnishingText}.`;
        }

        if (property.builtUpArea && typeof property.builtUpArea === 'number') {
            description += ` Total area is ${property.builtUpArea} sqft.`;
        }

        return description;
    }

    /**
     * Generates fallback images based on property type
     * @param {Object} property - Property data
     * @returns {Array} - Array of placeholder image URLs
     */
    generateImages(property = {}) {
        // Return appropriate placeholder based on property category
        const category = property.category?.toLowerCase();

        // For now, return the default placeholder
        // In the future, you could have category-specific placeholders
        return [...this.placeholderImages.property];
    }

    /**
     * Generates fallback amenities based on property category
     * @param {Object} property - Property data
     * @returns {Array} - Array of default amenities
     */
    generateAmenities(property = {}) {
        const category = property.category?.toLowerCase() || 'default';
        return [...(this.defaultAmenities[category] || this.defaultAmenities.default)];
    }

    /**
     * Generates fallback owner information
     * @param {Object} property - Property data
     * @returns {Object} - Generated owner information
     */
    generateOwnerInfo(property = {}) {
        return {
            ownerName: 'Property Owner',
            ownerPhone: null,
            ownerEmail: null,
            ownerPhoto: this.placeholderImages.owner,
            verificationStatus: 'unverified',
            _isGenerated: true
        };
    }

    /**
     * Generates fallback financial information based on property details
     * @param {Object} property - Property data
     * @returns {Object} - Generated financial information
     */
    generateFinancialInfo(property = {}) {
        const city = property.city?.toLowerCase() || 'default';
        const cityDefaults = this.cityDefaults[city] || this.cityDefaults.default;

        let securityDeposit = 0;
        let maintenanceCharge = cityDefaults.maintenanceBase;

        // Calculate security deposit based on rent if available
        if (property.monthlyRent && property.monthlyRent > 0) {
            securityDeposit = Math.round(property.monthlyRent * cityDefaults.securityMultiplier);
        }

        // Adjust maintenance based on property type
        if (property.category) {
            switch (property.category.toLowerCase()) {
                case 'house':
                    maintenanceCharge *= 1.5;
                    break;
                case 'commercial':
                    maintenanceCharge *= 2;
                    break;
                case 'room':
                case 'pg':
                case 'hostel':
                    maintenanceCharge *= 0.5;
                    break;
            }
        }

        return {
            securityDeposit: Math.round(securityDeposit),
            maintenanceCharge: Math.round(maintenanceCharge),
            _isGenerated: true
        };
    }

    /**
     * Generates fallback property specifications
     * @param {Object} property - Property data
     * @returns {Object} - Generated specifications
     */
    generateSpecifications(property = {}) {
        const category = property.category?.toLowerCase();
        let bedrooms = null;
        let bathrooms = 1;
        let builtUpArea = 'Not specified';

        // Generate reasonable defaults based on category
        switch (category) {
            case 'room':
                bedrooms = null; // Rooms don't have separate bedrooms
                bathrooms = null; // May share bathroom
                builtUpArea = 150;
                break;
            case 'flat':
                bedrooms = 1;
                bathrooms = 1;
                builtUpArea = 600;
                break;
            case 'house':
                bedrooms = 2;
                bathrooms = 2;
                builtUpArea = 1200;
                break;
            case 'pg':
            case 'hostel':
                bedrooms = null;
                bathrooms = null; // Shared facilities
                builtUpArea = 100;
                break;
            case 'commercial':
                bedrooms = null;
                bathrooms = 1;
                builtUpArea = 800;
                break;
            default:
                bedrooms = 1;
                bathrooms = 1;
                builtUpArea = 500;
        }

        return {
            bedrooms,
            bathrooms,
            builtUpArea,
            _isGenerated: true
        };
    }

    /**
     * Generates fallback address information
     * @param {Object} property - Property data
     * @returns {Object} - Generated address information
     */
    generateAddressInfo(property = {}) {
        const city = property.city || 'Unknown City';

        return {
            address: `Location in ${city}`,
            city: city,
            mapLocation: null, // No coordinates available
            _isGenerated: true
        };
    }

    /**
     * Generates fallback availability information
     * @param {Object} property - Property data
     * @returns {Object} - Generated availability information
     */
    generateAvailabilityInfo(property = {}) {
        // Default to available immediately
        const availableFrom = new Date().toISOString();

        return {
            availableFrom,
            _isGenerated: true
        };
    }

    /**
     * Generates complete fallback property data
     * @param {Object} partialProperty - Partial property data
     * @returns {Object} - Complete property with fallbacks
     */
    generateCompleteProperty(partialProperty = {}) {
        const property = { ...partialProperty };

        // Generate missing core information
        if (!property.title) {
            property.title = this.generateTitle(property);
            property._hasGeneratedTitle = true;
        }

        if (!property.description) {
            property.description = this.generateDescription(property);
            property._hasGeneratedDescription = true;
        }

        // Generate missing images
        if (!property.photos || !Array.isArray(property.photos) || property.photos.length === 0) {
            property.photos = this.generateImages(property);
            property._hasGeneratedImages = true;
        }

        // Generate missing amenities
        if (!property.amenities || !Array.isArray(property.amenities) || property.amenities.length === 0) {
            property.amenities = this.generateAmenities(property);
            property._hasGeneratedAmenities = true;
        }

        // Generate missing owner information
        if (!property.ownerName) {
            const ownerInfo = this.generateOwnerInfo(property);
            Object.assign(property, ownerInfo);
            property._hasGeneratedOwner = true;
        }

        // Generate missing financial information
        if (property.securityDeposit === null || property.securityDeposit === undefined ||
            property.maintenanceCharge === null || property.maintenanceCharge === undefined) {
            const financialInfo = this.generateFinancialInfo(property);
            if (property.securityDeposit === null || property.securityDeposit === undefined) {
                property.securityDeposit = financialInfo.securityDeposit;
                property._hasGeneratedSecurityDeposit = true;
            }
            if (property.maintenanceCharge === null || property.maintenanceCharge === undefined) {
                property.maintenanceCharge = financialInfo.maintenanceCharge;
                property._hasGeneratedMaintenanceCharge = true;
            }
        }

        // Generate missing specifications
        const specs = this.generateSpecifications(property);
        if (property.bedrooms === null || property.bedrooms === undefined) {
            property.bedrooms = specs.bedrooms;
            property._hasGeneratedBedrooms = true;
        }
        if (property.bathrooms === null || property.bathrooms === undefined) {
            property.bathrooms = specs.bathrooms;
            property._hasGeneratedBathrooms = true;
        }
        if (property.builtUpArea === null || property.builtUpArea === undefined) {
            property.builtUpArea = specs.builtUpArea;
            property._hasGeneratedArea = true;
        }

        // Generate missing address information
        if (!property.address) {
            const addressInfo = this.generateAddressInfo(property);
            property.address = addressInfo.address;
            property._hasGeneratedAddress = true;
        }

        // Generate missing availability information
        if (!property.availableFrom) {
            const availabilityInfo = this.generateAvailabilityInfo(property);
            property.availableFrom = availabilityInfo.availableFrom;
            property._hasGeneratedAvailability = true;
        }

        // Set default values for other fields
        if (property.negotiable === null || property.negotiable === undefined) {
            property.negotiable = false;
        }

        if (!property.furnishing) {
            property.furnishing = 'not specified';
            property._hasGeneratedFurnishing = true;
        }

        if (!property.propertyType) {
            property.propertyType = this.capitalizeFirstLetter(property.category || 'property');
            property._hasGeneratedPropertyType = true;
        }

        return property;
    }

    /**
     * Checks if property has any generated fallback data
     * @param {Object} property - Property data
     * @returns {boolean} - True if property has generated data
     */
    hasGeneratedData(property) {
        const generatedFlags = [
            '_hasGeneratedTitle',
            '_hasGeneratedDescription',
            '_hasGeneratedImages',
            '_hasGeneratedAmenities',
            '_hasGeneratedOwner',
            '_hasGeneratedSecurityDeposit',
            '_hasGeneratedMaintenanceCharge',
            '_hasGeneratedBedrooms',
            '_hasGeneratedBathrooms',
            '_hasGeneratedArea',
            '_hasGeneratedAddress',
            '_hasGeneratedAvailability',
            '_hasGeneratedFurnishing',
            '_hasGeneratedPropertyType'
        ];

        return generatedFlags.some(flag => property[flag] === true);
    }

    /**
     * Gets list of generated fields for a property
     * @param {Object} property - Property data
     * @returns {Array} - Array of generated field names
     */
    getGeneratedFields(property) {
        const generatedFields = [];
        const flagToFieldMap = {
            '_hasGeneratedTitle': 'title',
            '_hasGeneratedDescription': 'description',
            '_hasGeneratedImages': 'photos',
            '_hasGeneratedAmenities': 'amenities',
            '_hasGeneratedOwner': 'owner information',
            '_hasGeneratedSecurityDeposit': 'security deposit',
            '_hasGeneratedMaintenanceCharge': 'maintenance charge',
            '_hasGeneratedBedrooms': 'bedrooms',
            '_hasGeneratedBathrooms': 'bathrooms',
            '_hasGeneratedArea': 'built-up area',
            '_hasGeneratedAddress': 'address',
            '_hasGeneratedAvailability': 'availability date',
            '_hasGeneratedFurnishing': 'furnishing status',
            '_hasGeneratedPropertyType': 'property type'
        };

        Object.entries(flagToFieldMap).forEach(([flag, fieldName]) => {
            if (property[flag] === true) {
                generatedFields.push(fieldName);
            }
        });

        return generatedFields;
    }

    /**
     * Capitalizes first letter of a string
     * @param {string} text - Text to capitalize
     * @returns {string} - Capitalized text
     */
    capitalizeFirstLetter(text) {
        if (!text || typeof text !== 'string') return 'Property';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
}

// Export singleton instance for convenience
export const fallbackDataGenerator = new FallbackDataGenerator();

// Export class for custom instances
export default FallbackDataGenerator;