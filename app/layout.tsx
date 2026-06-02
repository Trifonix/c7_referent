import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "c7_referent",
  description: "Минимальное приложение Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
