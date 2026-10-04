/**
 * Haptic taps for the moments that matter. Silent on the web and on devices
 * without a Taptic Engine — the plugin call is skipped or fails quietly, and a
 * missing buzz is never worth an error.
 */
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNativeApp } from "./auth";

export function tapLight(): void {
  if (isNativeApp()) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
}

export function tapSuccess(): void {
  if (isNativeApp()) void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
}
