import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS shell. The web app ships bundled (ios-web, built by scripts/build-ios.mjs)
 * so it opens offline and isn't a repackaged website. Native-only behavior
 * lives in the plugins; everything a design tweak touches stays web code.
 */
const config: CapacitorConfig = {
  appId: "life.firstday.app",
  appName: "First Day",
  webDir: "ios-web",
  ios: {
    contentInset: "never",
    backgroundColor: "#000000",
  },
  plugins: {
    SplashScreen: { launchShowDuration: 0, backgroundColor: "#000000" },
  },
};

export default config;
