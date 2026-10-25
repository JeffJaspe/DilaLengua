import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Español — learn Spanish, page by page", template: "%s · Español" },
  description: "Learn Spanish from zero, one fun page at a time. Built for Filipino learners.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FFD23F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=DM+Sans:opsz,wght@9..40,400..700&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-[#f7c52c] antialiased">
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-sun sm:border-x-3 sm:border-ink">{children}</div>
      </body>
    </html>
  );
}
