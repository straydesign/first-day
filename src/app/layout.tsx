import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Day - Goal Achievement App",
  description: "AI-powered 30-day plans to help you achieve any goal. Start your journey today.",
  openGraph: {
    title: "First Day - Goal Achievement App",
    description: "AI-powered 30-day plans to help you achieve any goal.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
