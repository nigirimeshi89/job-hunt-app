import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// ThemeProvider のインポートは削除しました

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "就活管理アプリ",
  description: "就活のスケジュールを管理するアプリ",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* ThemeProvider を削除してスッキリさせました */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}