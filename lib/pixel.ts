declare global {
  interface Window {
    fbq?: (
      action: "init" | "track" | "trackCustom" | "consent",
      eventNameOrId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function pixelEnabled(): boolean {
  return Boolean(META_PIXEL_ID);
}

export function newEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Contact";

export function trackEvent(
  event: StandardEvent,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined") return;
  if (!window.fbq) return;
  if (eventId) {
    window.fbq("track", event, params, { eventID: eventId });
  } else {
    window.fbq("track", event, params);
  }
}
