import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";
import { MonotoneProvider } from "@/components/MonotoneContext";
import { PersistentCanvasMount } from "@/components/3d-shell/PersistentCanvasMount";
import { DomBridgeSource } from "@/components/3d-shell/DomBridge";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#cc5533",
};

export const metadata: Metadata = {
  title: "First Day — your 7-day sprint, in 2 seconds",
  description: "Type a goal, watch your week assemble. Daily activities, streaks, and the dopamine to keep going.",
  metadataBase: new URL("https://firstday.life"),
  openGraph: {
    title: "First Day — your 7-day sprint, in 2 seconds",
    description: "Type a goal, watch your week assemble. Daily activities, streaks, and the dopamine to keep going.",
    type: "website",
    url: "https://firstday.life",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "First Day — first day of the rest of your life" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "First Day — your 7-day sprint, in 2 seconds",
    description: "Type a goal, watch your week assemble. Daily activities, streaks, and the dopamine to keep going.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "First Day",
  "url": "https://firstday.life",
  "description": "AI-powered 7-day sprints to help you achieve any goal. Personalized daily activities, progress tracking, streaks, and achievements.",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "featureList": [
    "AI-generated personalized 7-day goal sprints",
    "Daily activity tracking with reflections",
    "XP system, streaks, and achievement badges",
    "Curated resources (videos, articles, books)",
    "Multiple simultaneous goal management",
    "Calendar view for progress overview",
  ],
  "creator": {
    "@type": "Organization",
    "name": "Stray Web Design",
    "url": "https://straywebdesign.co",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased tile-substrate">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <PersistentCanvasMount />
        <MonotoneProvider>
          <main id="main-content" className="relative z-10">
            <DomBridgeSource>{children}</DomBridgeSource>
          </main>
        </MonotoneProvider>
        <Toaster />
      </body>
    </html>
  );
}
