import Clarity from "@microsoft/clarity";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-R3HC6H1EVW";
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID || "y8kxrxakco";

let isInitialized = false;

/**
 * Initialize Google Analytics 4 & Microsoft Clarity asynchronously
 */
export function initAnalytics() {
    if (isInitialized || typeof window === "undefined") return;

    // 1. Initialize Google Analytics 4 if Measurement ID is present
    if (GA_MEASUREMENT_ID && !window.gtag) {
        try {
            const script = document.createElement("script");
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };

            window.gtag("js", new Date());
            // Disable default automatic page view so React Router handles pageview events cleanly without double-counting
            window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
        } catch (err) {
            console.warn("[Analytics] Error initializing Google Analytics:", err);
        }
    }

    // 2. Initialize Microsoft Clarity using official @microsoft/clarity package
    if (CLARITY_PROJECT_ID) {
        try {
            Clarity.init(CLARITY_PROJECT_ID);
        } catch (err) {
            console.warn("[Analytics] Error initializing Microsoft Clarity:", err);
        }
    }

    isInitialized = true;
}

/**
 * Track SPA Page Views across React Router transitions
 * @param {string} path - URL path + query string
 */
export function trackPageView(path) {
    if (typeof window === "undefined") return;

    const currentPath = path || (window.location.pathname + window.location.search);

    // Track GA4 Pageview
    if (GA_MEASUREMENT_ID && window.gtag) {
        window.gtag("config", GA_MEASUREMENT_ID, {
            page_path: currentPath,
            page_location: window.location.href,
        });
    }

    // Track Clarity Pageview Event
    if (CLARITY_PROJECT_ID && typeof window.clarity === "function") {
        window.clarity("set", "page", currentPath);
    }
}

/**
 * Track Custom Events (e.g. Property Search, Contact Request, Lead Submission)
 * @param {string} action - Event name (e.g. 'search_property', 'submit_lead')
 * @param {object} params - Key-value pair payload
 */
export function trackEvent(action, params = {}) {
    if (typeof window === "undefined") return;

    if (GA_MEASUREMENT_ID && window.gtag) {
        window.gtag("event", action, params);
    }

    if (CLARITY_PROJECT_ID && typeof window.clarity === "function") {
        window.clarity("event", action);
    }
}
