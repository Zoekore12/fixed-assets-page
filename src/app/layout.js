
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Fixed Assets Management System",
  description:
    "Fixed Assets Management System for asset registration, tracking, maintenance, and valuation.",
    icons: {
    icon: "/fixed-assets-favicon.svg",
    shortcut: "/fixed-assets-favicon.svg",
    apple: "/fixed-assets-favicon.svg",
  },
  openGraph: {
    title: "Fixed Assets Management System",
    description:
      "Fixed Assets Management System for asset registration, tracking, maintenance, and valuation.",
    url: "https://fixed-assets-page.vercel.app",
    siteName: "Fixed Assets Management System",
    images: [
      {
        url: "/fixed-assets-favicon.png",
        width: 1200,
        height: 630,
        alt: "Fixed Assets Management System",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fixed Assets Management System",
    description:
      " Fixed Assets Management System for asset registration, tracking, maintenance, and valuation.",
    images: ["/fixed-assets-favicon.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full suppressHydrationWarning">{children}</body>
    </html>
  );
}
