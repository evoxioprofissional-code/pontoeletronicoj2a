import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { InstalacaoProvider } from "@/components/InstalacaoProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "j2aponto — Registro de ponto",
  description: "Registro de ponto por reconhecimento facial e localização.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    title: "j2aponto",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F4F0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <InstalacaoProvider>{children}</InstalacaoProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
