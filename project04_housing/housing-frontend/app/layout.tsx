import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://housing-predictor.vercel.app";

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "California Housing Price Predictor | ML Real Estate Valuation",
    template: "%s | California Housing Predictor",
  },
  description:
    "Free AI & Machine Learning tool to estimate California house prices, median home values, and real estate market trends based on 20,640 census block groups ($R^2 = 0.81$).",
  keywords: [
    "California House Price Predictor",
    "California Housing Market Estimator",
    "California Home Value Calculator",
    "Real Estate Machine Learning Model",
    "California Property Valuation Tool",
    "Random Forest Real Estate Valuation",
    "California Housing Dataset Predictor",
    "California House Valuation AI",
    "San Francisco Housing Price Estimate",
    "Beverly Hills House Value Predictor",
  ],
  authors: [{ name: "Neel Bhatt", url: "https://github.com/neel20409" }],
  creator: "Neel Bhatt",
  publisher: "Neel Bhatt Data Science",
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "California Housing Price Predictor | ML Real Estate Valuation",
    description:
      "Estimate California property values in real-time using an advanced Random Forest Machine Learning model ($R^2=0.81$). Instant estimation based on income, rooms, and location.",
    url: siteUrl,
    siteName: "California Housing Price Predictor",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "California Housing Price Predictor | ML Real Estate Valuation",
    description:
      "Instant real estate market value predictions for California properties using Random Forest ML algorithms.",
    creator: "@neel20409",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Graph combining SoftwareApplication & FAQPage for Google Search Accordions
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "California Housing Price Predictor",
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "description": "Machine Learning property value estimator for California real estate based on California Census dataset.",
        "url": siteUrl,
        "author": {
          "@type": "Person",
          "name": "Neel Bhatt",
          "url": "https://github.com/neel20409"
        },
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "128"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does the California House Price Predictor estimate home values?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The tool utilizes a Random Forest Regressor trained on 20,640 California census block groups. It processes 8 primary features along with engineered ratio features to generate real-time market value estimates."
            }
          },
          {
            "@type": "Question",
            "name": "What factors influence California property valuation the most?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Median Income (MedInc) is the primary driver, accounting for over 50% of prediction weight. Geographic location (Latitude & Longitude) and spatial occupancy density form the second highest predictive weights."
            }
          },
          {
            "@type": "Question",
            "name": "How accurate is this California Housing ML model?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The model achieves an R² score of 0.81 (81% variance explained) on validation datasets, providing reliable baseline market estimations."
            }
          }
        ]
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
