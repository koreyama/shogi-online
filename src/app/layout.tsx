import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asobi Lounge",
  description: "オンラインで遊べるゲームサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
