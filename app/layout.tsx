import "./globals.css";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Math Blitz",
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: "https://imgur.com/a/TOceCaM",
        button: {
          title: "Launch Math Blitz",
          action: {
            type: "launch_miniapp",
            name: "Math Blitz",
            url: "https://math-blitz-nine.vercel.app/",
            splashImageUrl: "https://imgur.com/a/TOceCaM",
            splashBackgroundColor: "#4d56f8ff",
          },
        },
      }),
    },
  };
}


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
