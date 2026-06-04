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
      <body className="min-h-screen bg-[#0b0f1a] text-slate-100 antialiased">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="animate-float absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="animate-float-delayed absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}
