/**
 * WhatsApp utility functions for generating deep links
 * Uses the wa.me URL scheme which works across all platforms
 */

/**
 * Formats a phone number for WhatsApp by removing non-numeric characters
 * @param {string} phone - The phone number to format
 * @returns {string} - Formatted phone number with only digits and optional leading +
 */
export function formatPhoneForWhatsApp(phone) {
    if (!phone || typeof phone !== 'string') {
        return '';
    }

    // Check if starts with + and preserve it
    const hasPlus = phone.trim().startsWith('+');

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Return with leading + if original had it
    return hasPlus ? `+${digits}` : digits;
}

/**
 * Generates a WhatsApp call/chat link
 * @param {string} phone - The phone number to call
 * @returns {string|null} - WhatsApp deep link URL or null if invalid
 */
export function generateWhatsAppCallLink(phone) {
    const formatted = formatPhoneForWhatsApp(phone);

    if (!formatted || formatted === '+') {
        return null;
    }

    // Remove leading + for wa.me URL (it expects just digits)
    const phoneDigits = formatted.replace(/^\+/, '');

    return `https://wa.me/${phoneDigits}`;
}

/**
 * Generates a WhatsApp message link with pre-filled text
 * @param {string} phone - The recipient's phone number
 * @param {string} message - The pre-filled message text
 * @returns {string|null} - WhatsApp deep link URL with encoded message or null if invalid
 */
export function generateWhatsAppMessageLink(phone, message) {
    const formatted = formatPhoneForWhatsApp(phone);

    if (!formatted || formatted === '+') {
        return null;
    }

    // Remove leading + for wa.me URL
    const phoneDigits = formatted.replace(/^\+/, '');

    // URL encode the message
    const encodedMessage = encodeURIComponent(message || '');

    if (encodedMessage) {
        return `https://wa.me/${phoneDigits}?text=${encodedMessage}`;
    }

    return `https://wa.me/${phoneDigits}`;
}

/**
 * Creates a default inquiry message for a property
 * @param {string} propertyTitle - The title of the property
 * @returns {string} - Pre-filled message text
 */
export function createPropertyInquiryMessage(propertyTitle) {
    if (!propertyTitle || typeof propertyTitle !== 'string' || !propertyTitle.trim()) {
        return "Hi, I'm interested in this property";
    }

    return `Hi, I'm interested in ${propertyTitle.trim()}`;
}

/**
 * Checks if a phone number is valid for WhatsApp
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if the phone number has at least some digits
 */
export function isValidWhatsAppPhone(phone) {
    const formatted = formatPhoneForWhatsApp(phone);
    // Must have at least some digits (not just + or empty)
    return formatted.length > 0 && formatted !== '+';
}
