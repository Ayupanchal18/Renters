/**
 * Profile Completion Utility
 * 
 * Calculates weighted profile completion percentage based on:
 * - Basic Info (35%): name, email, phone, address
 * - Verification (40%): email verified, phone verified
 * - Profile Enhancement (15%): avatar, account type
 * - Privacy Setup (10%): privacy policy, terms accepted
 */

const COMPLETION_ITEMS = [
    // Basic Info - 35% total
    {
        key: 'name',
        label: 'Full Name',
        category: 'Basic Info',
        weight: 10,
        priority: 'required',
        check: (user) => !!(user?.name && user.name.trim())
    },
    {
        key: 'email',
        label: 'Email Address',
        category: 'Basic Info',
        weight: 10,
        priority: 'required',
        check: (user) => !!(user?.email && user.email.trim())
    },
    {
        key: 'phone',
        label: 'Phone Number',
        category: 'Basic Info',
        weight: 10,
        priority: 'required',
        check: (user) => !!(user?.phone && user.phone.trim())
    },
    {
        key: 'address',
        label: 'Address',
        category: 'Basic Info',
        weight: 5,
        priority: 'recommended',
        check: (user) => !!(user?.address && user.address.trim())
    },

    // Verification - 40% total (most important for trust)
    {
        key: 'emailVerified',
        label: 'Email Verification',
        category: 'Verification',
        weight: 20,
        priority: 'required',
        check: (user) => !!user?.emailVerified
    },
    {
        key: 'phoneVerified',
        label: 'Phone Verification',
        category: 'Verification',
        weight: 20,
        priority: 'required',
        check: (user) => !!user?.phoneVerified
    },

    // Profile Enhancement - 15% total
    {
        key: 'avatar',
        label: 'Profile Picture',
        category: 'Profile Enhancement',
        weight: 10,
        priority: 'recommended',
        check: (user) => !!(user?.avatar && user.avatar.trim())
    },
    {
        key: 'userType',
        label: 'Account Type',
        category: 'Profile Enhancement',
        weight: 5,
        priority: 'optional',
        check: (user) => !!(user?.userType && user.userType !== 'buyer')
    },

    // Privacy Setup - 10% total
    {
        key: 'privacyPolicy',
        label: 'Privacy Policy Accepted',
        category: 'Privacy Setup',
        weight: 5,
        priority: 'recommended',
        check: (user) => !!user?.privacyPolicyAcceptedAt
    },
    {
        key: 'terms',
        label: 'Terms Accepted',
        category: 'Privacy Setup',
        weight: 5,
        priority: 'recommended',
        check: (user) => !!user?.termsAcceptedAt
    },
];

const PRIORITY_ORDER = { required: 0, recommended: 1, optional: 2 };
const CATEGORIES = ['Basic Info', 'Verification', 'Profile Enhancement', 'Privacy Setup'];

/**
 * Calculate profile completion with weighted scoring
 * @param {Object} user - User object from auth/API
 * @returns {Object} Completion data with percentage, missing items, and breakdown
 */
export function calculateProfileCompletion(user) {
    if (!user) {
        return {
            total: 100,
            completed: 0,
            percentage: 0,
            missing: [],
            breakdown: [],
            nextStep: null,
            isComplete: false,
            requiredComplete: false
        };
    }

    // Evaluate each item
    const evaluatedItems = COMPLETION_ITEMS.map(item => ({
        ...item,
        isComplete: item.check(user)
    }));

    // Calculate weighted percentage
    const totalWeight = evaluatedItems.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = evaluatedItems
        .filter(item => item.isComplete)
        .reduce((sum, item) => sum + item.weight, 0);

    const percentage = Math.round((completedWeight / totalWeight) * 100);

    // Get missing items sorted by priority and weight
    const missing = evaluatedItems
        .filter(item => !item.isComplete)
        .sort((a, b) => {
            const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.weight - a.weight;
        })
        .map(item => ({
            key: item.key,
            label: item.label,
            category: item.category,
            weight: item.weight,
            priority: item.priority
        }));

    // Category breakdown
    const breakdown = CATEGORIES.map(category => {
        const categoryItems = evaluatedItems.filter(item => item.category === category);
        const categoryTotal = categoryItems.reduce((sum, item) => sum + item.weight, 0);
        const categoryCompleted = categoryItems
            .filter(item => item.isComplete)
            .reduce((sum, item) => sum + item.weight, 0);

        return {
            category,
            total: categoryTotal,
            completed: categoryCompleted,
            percentage: categoryTotal > 0 ? Math.round((categoryCompleted / categoryTotal) * 100) : 0,
            items: categoryItems.map(item => ({
                key: item.key,
                label: item.label,
                isComplete: item.isComplete,
                weight: item.weight,
                priority: item.priority
            }))
        };
    });

    // Check if all required items are complete
    const requiredComplete = evaluatedItems
        .filter(item => item.priority === 'required')
        .every(item => item.isComplete);

    return {
        total: totalWeight,
        completed: completedWeight,
        percentage,
        missing,
        breakdown,
        nextStep: missing[0] || null,
        isComplete: percentage === 100,
        requiredComplete
    };
}

/**
 * Get completion status text based on percentage
 * @param {number} percentage - Completion percentage
 * @returns {string} Status text
 */
export function getCompletionStatusText(percentage) {
    if (percentage === 100) return "Profile complete!";
    if (percentage >= 80) return "Almost there!";
    if (percentage >= 60) return "Good progress";
    if (percentage >= 40) return "Keep going";
    return "Let's get started";
}

/**
 * Get completion color class based on percentage
 * @param {number} percentage - Completion percentage
 * @returns {string} Tailwind gradient class
 */
export function getCompletionColor(percentage) {
    if (percentage >= 80) return "from-success to-success/80";
    if (percentage >= 50) return "from-warning to-warning/80";
    return "from-secondary to-secondary/80";
}
