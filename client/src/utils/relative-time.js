/**
 * Converts a date to a human-readable relative time string
 * @param {string|Date} date - The date to convert
 * @returns {string} - Relative time string like "Listed 2 days ago"
 */
export function getRelativeTimeString(date) {
    if (!date) return 'Listed recently';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    
    // Handle invalid dates
    if (isNaN(diffMs)) return 'Listed recently';
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Future dates
    if (diffMs < 0) return 'Listed recently';
    
    // Less than a day
    if (diffDays === 0) {
        return 'Listed today';
    }
    
    // Yesterday
    if (diffDays === 1) {
        return 'Listed yesterday';
    }
    
    // Less than a week
    if (diffDays < 7) {
        return `Listed ${diffDays} days ago`;
    }
    
    // Less than a month
    if (diffWeeks < 4) {
        return diffWeeks === 1 ? 'Listed 1 week ago' : `Listed ${diffWeeks} weeks ago`;
    }
    
    // Less than a year
    if (diffMonths < 12) {
        return diffMonths === 1 ? 'Listed 1 month ago' : `Listed ${diffMonths} months ago`;
    }
    
    // More than a year
    return diffYears === 1 ? 'Listed 1 year ago' : `Listed ${diffYears} years ago`;
}

/**
 * Get a short relative time string (without "Listed" prefix)
 * @param {string|Date} date - The date to convert
 * @returns {string} - Short relative time like "2 days ago"
 */
export function getShortRelativeTime(date) {
    const full = getRelativeTimeString(date);
    return full.replace('Listed ', '');
}
