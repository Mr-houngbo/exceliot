import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExcelIoT Intelligence | Le Cabinet de Recrutement Excel",
  description: "Plateforme intelligente de détection d'opportunités Excel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
