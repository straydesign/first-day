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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body className="antialiased bg-black">
        <MonotoneProvider>
          {children}
        </MonotoneProvider>
        <Toaster />
      </body>
    </html>
  );
}
