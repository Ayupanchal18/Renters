/**
 * Centralized SEO Configuration
 * 
 * This file contains all SEO-related configuration values used across the application.
 * Update these values to customize SEO behavior for the Renters platform.
 * 
 * Requirements: 1.1, 1.2
 */

const seoConfig = {
    // Site identity
    siteName: 'Renters',
    siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://renters.com',

    // Default meta values
    defaultTitle: 'Renters',
    defaultDescription: 'Find rooms, flats, houses & halls for rent',
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

    // Page-specific SEO defaults
    pages: {
        home: {
            title: 'Find Your Perfect Rental',
            description: 'Discover rooms, flats, houses & halls for rent. Browse thousands of verified listings and find your ideal home today.',
        },
        listings: {
            title: 'Property Listings',
            description: 'Browse all available rental properties. Filter by location, price, and property type to find your perfect match.',
        },
        about: {
            title: 'About Us',
            description: 'Learn about Renters - your trusted platform for finding rental properties. Our mission is to make renting simple and transparent.',
        },
        contact: {
            title: 'Contact Us',
            description: 'Get in touch with the Renters team. We\'re here to help with any questions about our rental platform.',
        },
        faqs: {
            title: 'Frequently Asked Questions',
            description: 'Find answers to common questions about renting properties, listing your property, and using the Renters platform.',
        },
    },
};

export default seoConfig;
