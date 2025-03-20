import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://vibe.samihindi.com"),
  title: {
    default: "Vibe Games | Interactive 3D Games",
    template: "%s | Vibe Games",
  },
  description:
    "Explore immersive 3D games including Quantum Drift and Ocean Voyager with advanced physics and dynamic environments",
  keywords: [
    "gaming",
    "3D games",
    "quantum physics",
    "ocean simulation",
    "next.js",
    "three.js",
    "web games",
  ],
  authors: [{ name: "Vibe Games Team" }],
  creator: "Vibe Games Team",
  publisher: "Vibe Games",
  category: "Gaming",
  applicationName: "Vibe Games",
  openGraph: {
    title: "Vibe Games | Interactive 3D Gaming Experience",
    description:
      "Explore immersive 3D games with advanced physics including Quantum Drift and Ocean Voyager",
    url: "/",
    siteName: "Vibe Games",
    images: [
      {
        url: "/images/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Vibe Games Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Games | Interactive 3D Gaming Experience",
    description:
      "Explore immersive 3D games with advanced physics including Quantum Drift and Ocean Voyager",
    images: ["/images/og-image.svg"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Vibe Games",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        {children}
      </body>
    </html>
  );
}
