import type { Metadata } from "next";
import { PrimeReactProvider } from 'primereact/api';
import { Geist, Geist_Mono, Bonheur_Royale, Bilbo_Swash_Caps } from "next/font/google";
import Image from "next/image";
import "@/styles/globals.css";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import TopNavBar from "@/components/TopNavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bonheurRoyale = Bonheur_Royale({
  subsets: ['latin'],
  weight: '400', // Bonheur Royale has only one weight
  variable: '--font-bonheur',
  display: 'swap',
});

const bilbo = Bilbo_Swash_Caps({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bilbo",
});

export const metadata: Metadata = {
  title: "Devotees' Association",
  description: "Devotees' Association",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bonheurRoyale.variable} ${bilbo.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense>
          <AuthProvider>
            <PrimeReactProvider value={{ ripple: true }}>
              <TopNavBar />
              {children}
            </PrimeReactProvider>
          </AuthProvider>
        </Suspense>
        <Footer />
        <Image
          className="absolute -z-10 top-0 left-0 w-full h-full object-cover"
          src="/mahaprabhu5.jpg"
          alt="Devotees' Association background image"
          sizes="100v"
          fill
          priority
        />
      </body>
    </html>
  );
}
