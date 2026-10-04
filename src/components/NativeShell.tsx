"use client";
/**
 * iOS-shell behavior, mounted once in the root layout. A no-op on the web.
 *
 * - Tags <html> with `native` so globals.css can drop web-only behavior
 *   (rubber-band scroll, link callouts, tap flashes).
 * - Light status-bar text over the black app.
 * - Opens every external link in an in-app Safari sheet. A plain
 *   target=_blank in WKWebView hands the URL to iOS and throws the user out of
 *   the app with no way back.
 */
import { useEffect } from "react";
import { Browser } from "@capacitor/browser";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativeApp } from "@/lib/native/auth";

function externalHref(target: EventTarget | null): string | null {
  const link = (target as Element | null)?.closest?.("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return null;
  const url = new URL(link.href, window.location.href);
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return url.origin === window.location.origin ? null : url.href;
}

export function NativeShell() {
  useEffect(() => {
    if (!isNativeApp()) return;

    document.documentElement.classList.add("native");
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);

    const onClick = (event: MouseEvent) => {
      const href = externalHref(event.target);
      if (!href) return;
      event.preventDefault();
      void Browser.open({ url: href, presentationStyle: "popover" });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
