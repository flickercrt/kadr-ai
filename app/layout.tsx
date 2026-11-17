import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { brand, brandStyle, localeStorageKey } from "@/config/site";
import { LocaleProvider } from "@/components/locale-provider";
import { MaintenanceBanner } from "@/components/maintenance-banner";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:43123"),
  title: {
    default: `${brand.nameAr} — ${brand.tagline.ar}`,
    template: `%s · ${brand.nameAr}`,
  },
  description: brand.description.ar,
  applicationName: brand.name,
  icons: { icon: "/icon.svg" },
};

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
