import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { siteConfig, githubUrl, isPlaceholder } from "@/config/site";
import {
  SystemProvider,
  systemBootstrapScript,
} from "@/components/system/system-provider";
import "./globals.css";

/* Two families, both self-hosted by next/font: no render-blocking request to
   Google, no layout shift, and only the latin subset is shipped. */
const display = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-stack",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || siteConfig.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.brand}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name, url: siteUrl }],
  creator: siteConfig.name,
  applicationName: siteConfig.brand,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteUrl,
    siteName: siteConfig.brand,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#04050a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /* JSON-LD. Only fields with real values are emitted — no invented
     jobTitle/employer data, and placeholder links are dropped entirely. */
  const sameAs = [
    !isPlaceholder(siteConfig.githubUsername) ? githubUrl : null,
    !isPlaceholder(siteConfig.linkedin) ? siteConfig.linkedin : null,
  ].filter((v): v is string => v !== null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    alternateName: siteConfig.brand,
    url: siteUrl,
    jobTitle: siteConfig.role,
    description: siteConfig.description,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${mono.variable}`}
    >
      <head>
        {/* Runs before paint: restores the effects preference and skips the
            boot overlay for a session that has already seen it. */}
        <script dangerouslySetInnerHTML={{ __html: systemBootstrapScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {/* The provider wraps everything so both the OS shell and the trimmed
            recruiter route share one motion/effects preference. The shell
            itself lives in the (os) route group — see its layout. */}
        <SystemProvider>{children}</SystemProvider>
      </body>
    </html>
  );
}
