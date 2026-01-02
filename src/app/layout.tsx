import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";
import SiteChatBot from "@/components/SiteChatBot";
import { ChatVisibilityProvider } from "@/contexts/ChatVisibilityContext";

export const metadata: Metadata = {
  title: "Asobi Lounge - オンラインボードゲームプラットフォーム",
  description: "オンラインで遊べるゲームサイト",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" translate="no">
      <body className="notranslate" suppressHydrationWarning={true} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ChatVisibilityProvider>
          {children}
          <Footer />
          <SiteChatBot />
        </ChatVisibilityProvider>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1427891350129033"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
