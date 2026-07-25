import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import HeaderFallback from "@/components/HeaderFallback";

export const metadata: Metadata = {
  title: "quejas.ar — reclamos, experiencias y denuncias",
  description:
    "Plataforma argentina para centralizar reclamos contra empresas con mal servicio, compartir trucos de atención al cliente y denunciar páginas truchas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
          quejas.ar — los posteos reflejan opiniones de sus autores, no de la plataforma.
        </footer>
      </body>
    </html>
  );
}
