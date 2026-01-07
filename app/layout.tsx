import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Life OS",
  description: "Manage your life",
  manifest: "/manifest.json",
  // Thêm đoạn này để hiện icon trên thanh trình duyệt
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png", // Icon cho iPhone
  },
};

export const viewport = {
  themeColor: "#6366f1",      // Màu thanh status bar điện thoại
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,            // Chặn zoom ngón tay (cho giống app thật)
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
