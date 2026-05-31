import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { getSession } from "@/lib/auth";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Infinity Admission — AI College Admission Counselling & Predictor",
  description:
    "Predict your college from your JEE, NEET, CLAT, CAT, CUET, COMEDK or WBJEE rank. Filter by budget, location & 12th marks, then get AI-powered admission counselling.",
  keywords: [
    "college predictor",
    "JEE Main predictor",
    "NEET college predictor",
    "CLAT predictor",
    "CAT predictor",
    "admission counselling",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = getSession();
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <Navbar user={user} />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
