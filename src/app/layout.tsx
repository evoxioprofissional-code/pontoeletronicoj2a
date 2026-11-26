import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { InstalacaoProvider } from "@/components/InstalacaoProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
  themeColor: "#F4F6F7",
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
    <html lang="pt-BR" className={sans.variable}>
      <body className="min-h-screen font-sans antialiased">
        <InstalacaoProvider>{children}</InstalacaoProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
