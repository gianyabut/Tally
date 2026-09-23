import type { Metadata, Viewport } from "next";
import { plexSans, plexMono } from "@/lib/fonts";
import { themeNoFlashScript } from "@/lib/theme/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <html
      lang="en"
      data-t="dark"
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
