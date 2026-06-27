import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Calculadora Tributária para Oficinas e Autopeças | Q&M Consultoria",
  description:
    "Oficinas, autopeças e centros automotivos: descubra em 2 minutos quanto sua empresa pode parar de pagar de imposto. Diagnóstico gratuito.",
  openGraph: {
    title: "Calculadora Tributária — Oficinas & Autopeças",
    description:
      "Em 2 minutos, descubra quanto seu CNPJ pode economizar mensalmente. Gratuito.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans min-h-screen flex flex-col">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
