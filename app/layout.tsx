import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "c7_referent",
  description: "Парсинг статей и генерация ответов с помощью AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
