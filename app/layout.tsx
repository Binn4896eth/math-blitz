import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Math Games",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen text-gray-900">
        {children}
      </body>
    </html>
  );
}
