/**
 * Centralized Analytics Utility
 * Handles non-blocking asynchronous initialization and tracking for:
 * 1. Google Analytics 4 (GA4)
 * 2. Microsoft Clarity
 */

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

    // 2. Initialize Microsoft Clarity if Project ID is present
    if (CLARITY_PROJECT_ID && !window.clarity) {
        try {
            (function (c, l, a, r, i, t, y) {
                c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
                t = l.createElement(r);
                t.async = 1;
                t.src = "https://www.clarity.ms/tag/" + i;
                y = l.getElementsByTagName(r)[0];
                y.parentNode.insertBefore(t, y);
            })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
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
