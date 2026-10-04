/**
 * One-time OK before any goal text leaves the device for plan generation
 * (App Store 5.1.2(i): name the third party and get consent first). Gated at
 * the single choke point, api.plan.generateSprint, so no path can skip it.
 *
 * window.confirm renders as a native iOS alert inside the app.
 */
import { COPY } from "@/content/copy";

const CONSENT_KEY = "fd_plan_consent_v1";

export function ensurePlanConsent(): void {
  try {
    if (window.localStorage.getItem(CONSENT_KEY)) return;
  } catch {
    // Storage blocked: ask every time rather than assume.
  }
  if (!window.confirm(COPY.confirms.planConsent)) {
    throw new Error(COPY.toasts.planConsentDeclined);
  }
  try {
    window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
  } catch {
    // Storage blocked: the OK still holds for this request.
  }
}
