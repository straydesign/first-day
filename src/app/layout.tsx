import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";
import { MonotoneProvider } from "@/components/MonotoneContext";
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
  title: "First Day - Goal Achievement App",
  description: "AI-powered 30-day plans to help you achieve any goal. Start your journey today.",
  metadataBase: new URL("https://firstday.life"),
  openGraph: {
    title: "First Day - Goal Achievement App",
    description: "AI-powered 30-day plans to help you achieve any goal.",
    type: "website",
    url: "https://firstday.life",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "First Day — first day of the rest of your life" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "First Day - Goal Achievement App",
    description: "AI-powered 30-day plans to help you achieve any goal.",
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
  "description": "AI-powered 30-day plans to help you achieve any goal. Personalized daily activities, progress tracking, streaks, and achievements.",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "featureList": [
    "AI-generated personalized 30-day goal plans",
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
      <body className="antialiased bg-black">
        <MonotoneProvider>
          {children}
        </MonotoneProvider>
        <Toaster />
      </body>
    </html>
  );
}
