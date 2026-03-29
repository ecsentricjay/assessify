import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createOrganizationSchema, SITE_URL } from "@/lib/seo/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Assessify - Online Assessment Platform for JAMB, WAEC, NECO | Nigeria",
  description: "Premium online assessment platform for students preparing for JAMB, WAEC, NECO exams. Practice past questions, get AI-powered grading, track continuous assessment scores, and earn referral commissions.",
  keywords: [
    "CBT platform",
    "online assessment",
    "JAMB practice",
    "WAEC preparation",
    "NECO exam",
    "past questions",
    "continuous assessment",
    "online exam",
    "student assessment",
    "educational platform",
    "Nigeria",
  ],
  icons: {
    icon: '/images/logo/assessify-favicon.ico',
    apple: '/images/logo/assessify-logo-icon.png',
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: SITE_URL,
    siteName: "Assessify",
    title: "Assessify - Online Assessment Platform for JAMB, WAEC, NECO",
    description: "Premium continuous assessment management with AI-powered grading, 1000+ past questions, and secure exam conditions.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Assessify - Assessment Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Assessify - Online Assessment Platform",
    description: "Practice JAMB, WAEC, NECO with 1000+ past questions. AI-powered grading & continuous assessment tracking.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // Replace with your actual code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = createOrganizationSchema();

  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for third-party services */}
        <link rel="dns-prefetch" href="https://supabase.co" />
        <link rel="dns-prefetch" href="https://resend.com" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={SITE_URL} />
        
        {/* JSON-LD Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
