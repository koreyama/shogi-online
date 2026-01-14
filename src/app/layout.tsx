import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";
import { ChatVisibilityProvider } from "@/contexts/ChatVisibilityContext";

const siteUrl = "https://asobi-lounge.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Asobi Lounge - 無料オンラインボードゲーム",
    template: "%s | Asobi Lounge",
  },
  description: "将棋、チェス、リバーシ、麻雀、五目並べなど20種類以上のボードゲーム・カードゲームを完全無料で遊べるオンラインゲームサイト。AI対戦や友達とのオンライン対戦に対応。登録不要、ブラウザだけで今すぐプレイ！",
  keywords: [
    "オンラインゲーム",
    "ボードゲーム",
    "将棋",
    "チェス",
    "リバーシ",
    "オセロ",
    "麻雀",
    "五目並べ",
    "無料ゲーム",
    "ブラウザゲーム",
    "オンライン対戦",
    "AI対戦",
    "マンカラ",
    "バックギャモン",
    "チェッカー",
    "コネクト4",
    "マインスイーパー",
  ],
  authors: [{ name: "ZANGE", url: "https://twitter.com/GeZAN477888" }],
  creator: "ZANGE",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "Asobi Lounge",
    title: "Asobi Lounge - 無料オンラインボードゲーム",
    description: "将棋、チェス、リバーシなど20種類以上のゲームを無料で遊べる。AI対戦・オンライン対戦対応。登録不要！",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Asobi Lounge - 無料オンラインボードゲーム",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Asobi Lounge - 無料オンラインボードゲーム",
    description: "将棋、チェス、リバーシなど20種類以上のゲームを無料で遊べる。",
    creator: "@GeZAN477888",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  other: {
    google: "notranslate",
  },
};

import GlobalChatWrapper from "@/components/GlobalChatWrapper";

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
          <GlobalChatWrapper />
          <Footer />
        </ChatVisibilityProvider>

        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1427891350129033"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body >
    </html >
  );
}
