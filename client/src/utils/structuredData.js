/**
 * Structured Data Generator Utilities
 * Generates JSON-LD schema markup for SEO
 * 
 * @see https://schema.org/RealEstateListing
 * @see https://schema.org/Organization
 * @see https://schema.org/BreadcrumbList
 */

/**
 * Default site configuration for structured data
 */
const siteConfig = {
    siteName: 'Renters',
    siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://renters.com',
    defaultDescription: 'Find rooms, flats, houses & halls for rent',
    defaultImage: '/property_image/placeholder-logo.png',
    contactEmail: 'contact@renters.com',
    contactPhone: '+91-XXXXXXXXXX'
};

/**
 * Generates RealEstateListing schema for a property
 * 
 * @param {Object} property - Property object from database
 * @param {string} property.title - Property title
 * @param {string} property.description - Property description
 * @param {string} property.slug - URL slug for the property
 * @param {string[]} property.photos - Array of photo URLs
 * @param {string} property.city - City name
 * @param {string} property.address - Full address
 * @param {number} property.monthlyRent - Monthly rent price
 * @param {string} property.category - Property category (room, flat, house, etc.)
 * @param {string} property.propertyType - Specific property type
 * @param {number} property.bedrooms - Number of bedrooms
 * @param {number} property.bathrooms - Number of bathrooms
 * @param {number} property.builtUpArea - Built up area in sq ft
 * @param {string} property.availableFrom - Availability date
 * @param {string} property.status - Property status
 * @returns {Object} JSON-LD RealEstateListing schema
 */
export function generatePropertySchema(property) {
    if (!property) {
        console.warn('generatePropertySchema: No property provided');
        return null;
    }

    const baseUrl = siteConfig.siteUrl;
    const propertyUrl = `${baseUrl}/properties/${property.slug || property._id}`;

    // Get the first valid image or use default
    const primaryImage = property.photos?.[0] || siteConfig.defaultImage;
    const images = property.photos?.length > 0
        ? property.photos
        : [siteConfig.defaultImage];

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: property.title || 'Property Listing',
        description: property.description || siteConfig.defaultDescription,
        url: propertyUrl,
        image: images,
        datePosted: property.createdAt,
        dateModified: property.updatedAt
    };

    // Add address information
    if (property.city || property.address) {
        schema.address = {
            '@type': 'PostalAddress',
            streetAddress: property.address || '',
            addressLocality: property.city || '',
            addressCountry: 'IN'
        };
    }

    // Add price/offer information
    if (property.monthlyRent) {
        schema.offers = {
            '@type': 'Offer',
            price: property.monthlyRent,
            priceCurrency: 'INR',
            availability: property.status === 'active'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            validFrom: property.availableFrom
        };
    }

    // Add property details
    if (property.bedrooms || property.bathrooms || property.builtUpArea) {
        schema.additionalProperty = [];

        if (property.bedrooms) {
            schema.additionalProperty.push({
                '@type': 'PropertyValue',
                name: 'Bedrooms',
                value: property.bedrooms
            });
        }

        if (property.bathrooms) {
            schema.additionalProperty.push({
                '@type': 'PropertyValue',
                name: 'Bathrooms',
                value: property.bathrooms
            });
        }

        if (property.builtUpArea) {
            schema.additionalProperty.push({
                '@type': 'PropertyValue',
                name: 'Area',
                value: property.builtUpArea,
                unitText: 'sq ft'
            });
        }

        if (property.propertyType) {
            schema.additionalProperty.push({
                '@type': 'PropertyValue',
                name: 'Property Type',
                value: property.propertyType
            });
        }

        if (property.furnishing) {
            schema.additionalProperty.push({
                '@type': 'PropertyValue',
                name: 'Furnishing',
                value: property.furnishing
            });
        }
    }

    return schema;
}

/**
 * Generates BreadcrumbList schema for navigation hierarchy
 * 
 * @param {Array<{name: string, url: string}>} items - Array of breadcrumb items
 * @returns {Object} JSON-LD BreadcrumbList schema
 */
export function generateBreadcrumbs(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        console.warn('generateBreadcrumbs: No items provided');
        return null;
    }

    const baseUrl = siteConfig.siteUrl;

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
        }))
    };
}

/**
 * Generates Organization schema for the homepage
 * 
 * @param {Object} options - Optional overrides for organization data
 * @param {string} options.name - Organization name
 * @param {string} options.description - Organization description
 * @param {string} options.logo - Logo URL
 * @param {string} options.url - Website URL
 * @param {string} options.email - Contact email
 * @param {string} options.phone - Contact phone
 * @param {Object} options.socialProfiles - Social media profile URLs
 * @returns {Object} JSON-LD Organization schema
 */
export function generateOrganization(options = {}) {
    const baseUrl = siteConfig.siteUrl;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: options.name || siteConfig.siteName,
        description: options.description || siteConfig.defaultDescription,
        url: options.url || baseUrl,
        logo: options.logo || `${baseUrl}${siteConfig.defaultImage}`,
        contactPoint: {
            '@type': 'ContactPoint',
            email: options.email || siteConfig.contactEmail,
            telephone: options.phone || siteConfig.contactPhone,
            contactType: 'customer service'
        }
    };

    // Add social profiles if provided
    if (options.socialProfiles) {
        schema.sameAs = Object.values(options.socialProfiles).filter(Boolean);
    }

    return schema;
}

/**
 * Generates WebSite schema with SearchAction for sitelinks search box
 * 
 * @param {Object} options - Optional overrides
 * @returns {Object} JSON-LD WebSite schema
 */
export function generateWebsiteSchema(options = {}) {
    const baseUrl = siteConfig.siteUrl;

    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: options.name || siteConfig.siteName,
        url: options.url || baseUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${baseUrl}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
        }
    };
}

/**
 * Generates LocalBusiness schema for location-based pages
 * 
 * @param {Object} options - Business information
 * @param {string} options.name - Business name
 * @param {string} options.city - City name
 * @param {string} options.address - Full address
 * @returns {Object} JSON-LD LocalBusiness schema
 */
export function generateLocalBusiness(options = {}) {
    const baseUrl = siteConfig.siteUrl;

    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: options.name || `${siteConfig.siteName} - ${options.city || 'Local'}`,
        url: options.url || baseUrl,
        address: {
            '@type': 'PostalAddress',
            streetAddress: options.address || '',
            addressLocality: options.city || '',
            addressCountry: 'IN'
        }
    };
}

export default {
    generatePropertySchema,
    generateBreadcrumbs,
    generateOrganization,
    generateWebsiteSchema,
    generateLocalBusiness
};
