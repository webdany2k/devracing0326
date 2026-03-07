import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TechPulse MX - Newsletter de Tech, AI & Startups",
  description:
    "Recibe las noticias mas relevantes de tecnologia, inteligencia artificial, tips de desarrollo y el ecosistema startup de Mexico y Silicon Valley.",
  openGraph: {
    title: "TechPulse MX",
    description: "Tu dosis semanal de tech, AI y startups",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
