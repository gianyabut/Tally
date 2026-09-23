import type { Metadata, Viewport } from "next";
import { themeNoFlashScript } from "@/lib/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tally — every day off, counted",
  description:
    "Leave & holiday-work tracker for small teams. Set credits, file leaves, log holiday work with proof, export a yearly HR report.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-t="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
        {/* Load Plex exactly as the design does (Google Fonts stylesheet), so the
            browser receives the same font build — next/font's build-time copy
            renders glyphs 1px lower on Windows. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
