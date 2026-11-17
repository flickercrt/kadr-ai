import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { brand, brandStyle, localeStorageKey } from "@/config/site";
import { LocaleProvider } from "@/components/locale-provider";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import { readSeo, absoluteUrl } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await readSeo();
  const url = absoluteUrl("/");
  return {
    metadataBase: new URL(url),
    title: {
      default: seo.title,
      template: `%s · ${brand.nameAr}`,
    },
    description: seo.description,
    keywords: seo.keywords.split(",").map((item) => item.trim()).filter(Boolean),
    applicationName: brand.name,
    alternates: { canonical: url },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      siteName: brand.nameAr,
      locale: "ar_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: brand.colors.background,
  width: "device-width",
  initialScale: 1,
};

const boot = `(function(){try{var l=localStorage.getItem(${JSON.stringify(localeStorageKey)});if(l==="en"){document.documentElement.lang="en";document.documentElement.dir="ltr";}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${arabic.variable} h-full antialiased`}
      style={brandStyle}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        <LocaleProvider>
          <MaintenanceBanner />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
