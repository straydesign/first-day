import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

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
  themeColor: "#0d9488",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "First Day - Goal Achievement App",
    description: "AI-powered 30-day plans to help you achieve any goal.",
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
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable} ${bebasNeue.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
