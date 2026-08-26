import * as Clarity from "@microsoft/react-native-clarity";

const GA_MEASUREMENT_ID = "G-R3HC6H1EVW";
const CLARITY_PROJECT_ID = "y8kxrxakco";

let isInitialized = false;

/**
 * Initialize Mobile Analytics (Google Analytics 4 & Microsoft Clarity)
 */
export function initMobileAnalytics() {
  if (isInitialized) return;

  try {
    if (CLARITY_PROJECT_ID) {
      Clarity.initialize(CLARITY_PROJECT_ID);
    }
  } catch (err) {
    console.warn("[Mobile Analytics] Error initializing Clarity:", err);
  }

  isInitialized = true;
}

/**
 * Track Mobile Screen Views across React Navigation transitions
 */
export function trackMobileScreenView(screenName: string) {
  if (!screenName) return;

  // 1. Send Screen View Event to GA4 Measurement Protocol
  try {
    const payload = {
      client_id: "mobile_app_user",
      events: [
        {
          name: "screen_view",
          params: {
            app_name: "Renters Mobile",
            screen_name: screenName,
          },
        },
      ],
    };

    fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=mobile_app`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    ).catch(() => {});
  } catch {
    // Ignore network errors silently
  }

  // 2. Track Screen Name on Microsoft Clarity
  try {
    if (CLARITY_PROJECT_ID) {
      Clarity.setCurrentScreenName(screenName);
    }
  } catch {
    // Ignore if native clarity module is initializing
  }
}
