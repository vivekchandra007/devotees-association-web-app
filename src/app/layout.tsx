import type { Metadata } from "next";
import { PrimeReactProvider } from 'primereact/api';
import { Geist, Geist_Mono, Bonheur_Royale, Bilbo_Swash_Caps } from "next/font/google";
import Image from "next/image";
import "@/styles/globals.css";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import TopNavBar from "@/components/TopNavBar";
import { ScrollTop } from "primereact/scrolltop";

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
  title: 'HareKrishna.app – where Your Devotion meets Our Association',
  description: 'Connect with devotees, access inspiring content, and join the ISKCON community with this Hare Krishna app. Your spiritual journey begins here!',
  keywords: [
    'Hare Krishna', 'Hare Krishna App', 'Hare Krishna Official App',
    'ISKCON Official App', 'ISKCON Global App', 'Bhakti App',
    'Devotee Association', 'Devotees Association', 'Association of Devotees',
    'Radha Krishna Temple', 'ISKCON Pune', 'Spiritual App', 'Spiritual Youtube',
    'Online Prayers', 'Serve Krishna', 'Bhagavad Gita', 'Shrimad Bhagavatam', 'Shrimad Bhagwad Gita',
    'Devotional Videos', 'Radha Krishna Bhakti', 'Krishna Consciousness',
    'HareKrishna.app', 'Join ISKCON', 'Devotee App', 'Register at ISKCON'
  ],
  metadataBase: new URL('https://harekrishna.app'),
  openGraph: {
    title: 'HareKrishna.app – where Your Devotion meets Our Association',
    description: 'Your spiritual home to connect with devotees and offer prema-bhakti-sevā to Shri Shri Radha Krishna.',
    url: 'https://harekrishna.app',
    siteName: 'HareKrishna.app',
    type: 'website',
    images: [
      {
        url: 'https://harekrishna.app/metadata/og-cover.jpg', // Replace with your OG image path
        width: 1200,
        height: 630,
        alt: 'HareKrishna.app Logo with tagline – where Your Devotion meets Our Association',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HareKrishna.app – Where Devotion Finds Association',
    description: 'Join the global family of devotees and serve Shri Shri Radha Krishna with love.',
    images: ['https://harekrishna.app/metadata/og-cover.jpg'],
    site: '@HareKrishnaApp', // Add if you have a Twitter
  },
  icons: {
    icon: '/metadata/favicon.ico',
    apple: '/metadata/apple-touch-icon.png',
  },
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
              <div className="sticky z-10 top-0">
                <TopNavBar />
              </div>
              <div className="grid items-center m-auto justify-items-center min-h-screen">
                {children}
              </div>
              <ScrollTop />
            </PrimeReactProvider>
          </AuthProvider>
        </Suspense>
        <Footer />
        <Image
          className="absolute -z-10 top-0 left-0 w-full h-full object-cover"
          src="/mahaprabhu5.jpg"
          alt="mahaprabhu background image"
          sizes="100v"
          fill
          priority
        />
      </body>
    </html>
  );
}
