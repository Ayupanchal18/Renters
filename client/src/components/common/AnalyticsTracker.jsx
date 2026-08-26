import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, trackPageView } from "../../utils/analytics";

/**
 * AnalyticsTracker Component
 * Zero-render component mounted inside BrowserRouter to listen for location changes
 * and dispatch GA4 & Microsoft Clarity page view events.
 */
export default function AnalyticsTracker() {
    const location = useLocation();

    // 1. Initialize GA4 & Clarity on initial component mount
    useEffect(() => {
        initAnalytics();
    }, []);

    // 2. Track Pageviews whenever React Router route/pathname or search params change
    useEffect(() => {
        const fullPath = location.pathname + location.search;
        trackPageView(fullPath);
    }, [location.pathname, location.search]);

    return null;
}
