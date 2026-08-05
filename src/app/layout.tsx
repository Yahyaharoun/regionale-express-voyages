import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { QueryProvider } from "@/providers/QueryProvider";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "REGIONALE EXPRESS VOYAGES SARL | L'excellence du transport au Cameroun",
  description: "Sécurité absolue, confort premium et ponctualité rigoureuse. Découvrez le nouveau standard du transport de personnes et de colis au Cameroun.",
  keywords: ["Transport", "Cameroun", "Voyage", "Colis", "Express", "Yaoundé", "Mbalmayo"],
  openGraph: {
    type: "website",
    locale: "fr_CM",
    url: "https://www.rex-voyage.cm",
    title: "REGIONALE EXPRESS VOYAGE",
    description: "L'excellence du transport interurbain et de l'expédition de colis au Cameroun.",
    siteName: "REGIONALE EXPRESS VOYAGE",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "REGIONALE EXPRESS VOYAGE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "REGIONALE EXPRESS VOYAGE",
    description: "L'excellence du transport interurbain et de l'expédition de colis au Cameroun.",
    images: ["/images/og-image.jpg"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "REX Voyage",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} font-sans h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden w-full">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ConfirmProvider>
              {children}
              <OfflineIndicator />
              <Toaster position="top-right" />
            </ConfirmProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
