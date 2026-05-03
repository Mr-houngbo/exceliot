import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ExcelIoT | Intelligence Marché & Recrutement Excel",
  description: "Découvrez les meilleures opportunités Excel analysées et scorées par IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
        {children}
      </body>
    </html>
  );
}
