/**
 * Centralized SEO Configuration
 * 
 * This file contains all SEO-related configuration values used across the application.
 * Update these values to customize SEO behavior for the Renters platform.
 * 
 * Requirements: 1.1, 1.2, 9.3, 9.4
 */

const seoConfig = {
    // Site identity
    siteName: 'Renters',
    siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://renters.com',

    // Default meta values
    defaultTitle: 'Renters',
    defaultDescription: 'Find rooms, flats, houses & halls for rent or sale',
    defaultImage: '/property_image/placeholder-logo.png',

    // Social media handles
    twitterHandle: '@renters',

    // Title format template
    titleTemplate: '%s | Renters',

    // Open Graph defaults
    openGraph: {
        type: 'website',
        locale: 'en_US',
    },

    // Twitter Card defaults
    twitter: {
        cardType: 'summary_large_image',
    },

    // Meta description constraints
    descriptionLength: {
        min: 150,
        max: 160,
    },

    // Property title formats based on listing type (Requirements 9.3, 9.4)
    propertyTitleFormats: {
        // Format: "{BHK} {Type} for Rent in {Location}" (Requirement 9.3)
        rent: (property) => {
            const bhk = property.bedrooms ? `${property.bedrooms}BHK` : '';
            const type = property.propertyType || property.category || 'Property';
            const location = property.city || 'India';
            return `${bhk} ${type} for Rent in ${location}`.trim().replace(/\s+/g, ' ');
        },
        // Format: "{BHK} {Type} for Sale in {Location}" (Requirement 9.4)
        buy: (property) => {
            const bhk = property.bedrooms ? `${property.bedrooms}BHK` : '';
            const type = property.propertyType || property.category || 'Property';
            const location = property.city || 'India';
            return `${bhk} ${type} for Sale in ${location}`.trim().replace(/\s+/g, ' ');
        }
    },

    // Property description formats based on listing type
    propertyDescriptionFormats: {
        rent: (property) => {
            const bhk = property.bedrooms ? `${property.bedrooms}BHK` : '';
            const type = property.propertyType || property.category || 'property';
            const location = property.city || 'India';
            const rent = property.monthlyRent
                ? `₹${property.monthlyRent.toLocaleString('en-IN')}/month`
                : '';
            const furnishing = property.furnishing || '';

            return `${furnishing ? furnishing.charAt(0).toUpperCase() + furnishing.slice(1) + ' ' : ''}${bhk} ${type} available for rent in ${location}${rent ? ` at ${rent}` : ''}. Browse verified rental listings on Renters.`
                .trim()
                .replace(/\s+/g, ' ');
        },
        buy: (property) => {
            const bhk = property.bedrooms ? `${property.bedrooms}BHK` : '';
            const type = property.propertyType || property.category || 'property';
            const location = property.city || 'India';
            const price = property.sellingPrice
                ? `₹${(property.sellingPrice / 100000).toFixed(2)} Lakh`
                : '';
            const possession = property.possessionStatus === 'ready'
                ? 'Ready to move'
                : property.possessionStatus === 'under_construction'
                    ? 'Under construction'
                    : '';

            return `${possession ? possession + ' ' : ''}${bhk} ${type} for sale in ${location}${price ? ` at ${price}` : ''}. Find your dream home on Renters.`
                .trim()
                .replace(/\s+/g, ' ');
        }
    },

    // Page-specific SEO defaults
    pages: {
        home: {
            title: 'Find Your Perfect Property',
            description: 'Discover rooms, flats, houses & halls for rent or sale. Browse thousands of verified listings and find your ideal home today.',
        },
        listings: {
            title: 'Property Listings',
            description: 'Browse all available properties. Filter by location, price, and property type to find your perfect match.',
        },
        rentListings: {
            title: 'Properties for Rent',
            description: 'Browse all available rental properties. Filter by location, monthly rent, and property type to find your perfect rental home.',
        },
        buyListings: {
            title: 'Properties for Sale',
            description: 'Browse all available properties for sale. Filter by location, price range, and property type to find your dream home.',
        },
        about: {
            title: 'About Us',
            description: 'Learn about Renters - your trusted platform for finding rental and sale properties. Our mission is to make property search simple and transparent.',
        },
        contact: {
            title: 'Contact Us',
            description: 'Get in touch with the Renters team. We\'re here to help with any questions about our property platform.',
        },
        faqs: {
            title: 'Frequently Asked Questions',
            description: 'Find answers to common questions about renting, buying properties, listing your property, and using the Renters platform.',
        },
    },
};

/**
 * Generate SEO meta title for a property based on listing type
 * Requirements: 9.3, 9.4
 * 
 * @param {Object} property - Property object
 * @param {string} property.listingType - 'rent' or 'buy'
 * @param {number} property.bedrooms - Number of bedrooms
 * @param {string} property.propertyType - Property type
 * @param {string} property.city - City name
 * @returns {string} SEO-optimized title
 */
export function generatePropertyMetaTitle(property) {
    if (!property) return seoConfig.defaultTitle;

    const listingType = property.listingType || 'rent';
    const formatFn = seoConfig.propertyTitleFormats[listingType];

    if (formatFn) {
        return formatFn(property);
    }

    return property.title || seoConfig.defaultTitle;
}

/**
 * Generate SEO meta description for a property based on listing type
 * 
 * @param {Object} property - Property object
 * @returns {string} SEO-optimized description
 */
export function generatePropertyMetaDescription(property) {
    if (!property) return seoConfig.defaultDescription;

    const listingType = property.listingType || 'rent';
    const formatFn = seoConfig.propertyDescriptionFormats[listingType];

    if (formatFn) {
        const description = formatFn(property);
        // Truncate to max length if needed
        if (description.length > seoConfig.descriptionLength.max) {
            return description.substring(0, seoConfig.descriptionLength.max - 3) + '...';
        }
        return description;
    }

    return property.description || seoConfig.defaultDescription;
}

/**
 * Generate canonical URL for a property based on listing type
 * Requirements: 9.1, 9.2
 * 
 * @param {Object} property - Property object
 * @returns {string} Canonical URL
 */
export function generatePropertyCanonicalUrl(property) {
    if (!property) return seoConfig.siteUrl;

    const listingType = property.listingType || 'rent';
    const slug = property.slug || property._id;

    // Generate /rent/{slug} or /buy/{slug} URLs (Requirements 9.1, 9.2)
    return `${seoConfig.siteUrl}/${listingType}/${slug}`;
}

export default seoConfig;
