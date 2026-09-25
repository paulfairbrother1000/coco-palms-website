type AnalyticsParameters = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, parameters?: AnalyticsParameters) => void;
  }
}

// Analytics must never interrupt a quotation, booking request or enquiry.
export function trackEvent(eventName: string, parameters: AnalyticsParameters = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", eventName, parameters);
  } catch {
    // Ad blockers and tracking restrictions must not affect the guest journey.
  }
}
