/**
 * OAuth for the web and the iOS shell, behind one call.
 *
 * Google refuses sign-in inside an embedded WKWebView, so in the app the
 * provider page opens in an in-app Safari sheet and comes back through the
 * life.firstday.app:// URL scheme (registered in ios/App/App/Info.plist and in
 * Supabase's redirect allow-list). The web keeps the plain redirect flow.
 */
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { createClient } from "@/lib/supabase/client";

export type OAuthProvider = "google" | "apple";

export const NATIVE_AUTH_CALLBACK = "life.firstday.app://auth-callback";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export async function signInWithProvider(provider: OAuthProvider): Promise<{ error: Error | null }> {
  const supabase = createClient();

  if (!isNativeApp()) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    return { error };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: NATIVE_AUTH_CALLBACK, skipBrowserRedirect: true },
  });
  if (error) return { error };
  if (!data.url) return { error: new Error("No sign-in URL returned") };

  await Browser.open({ url: data.url, presentationStyle: "popover" });
  return { error: null };
}

/**
 * Finishes a native sign-in when Safari hands the callback back to the app.
 * Returns an unsubscribe. A no-op on the web.
 */
export function listenForNativeAuthCallback(onError: (error: Error) => void): () => void {
  if (!isNativeApp()) return () => {};

  const subscription = App.addListener("appUrlOpen", async ({ url }) => {
    if (!url.startsWith(NATIVE_AUTH_CALLBACK)) return;
    await Browser.close().catch(() => undefined);

    const code = new URL(url).searchParams.get("code");
    if (!code) {
      onError(new Error("Sign-in was cancelled"));
      return;
    }
    const { error } = await createClient().auth.exchangeCodeForSession(code);
    if (error) onError(error);
  });

  return () => {
    void subscription.then((s) => s.remove());
  };
}
