import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "../styles/globals.css";
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"], 
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense>
          <AuthProvider>{children}</AuthProvider>
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
