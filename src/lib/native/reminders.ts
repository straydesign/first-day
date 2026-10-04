/**
 * The daily reminder: one local notification each evening, scheduled on the
 * device. No server and no push token. iOS app only — the web has no way to
 * deliver it, so Settings hides the control there.
 */
import { LocalNotifications } from "@capacitor/local-notifications";
import { COPY } from "@/content/copy";

const REMINDER_ID = 1;
const REMINDER_HOUR = 19;

/** Asks for permission if needed. Resolves false when the user says no. */
export async function enableDailyReminder(): Promise<boolean> {
  const { display } = await LocalNotifications.requestPermissions();
  if (display !== "granted") return false;

  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: COPY.settings.notifications.pushTitle,
        body: COPY.settings.notifications.pushBody,
        schedule: { on: { hour: REMINDER_HOUR, minute: 0 }, allowWhileIdle: true },
      },
    ],
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
}
