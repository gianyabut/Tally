import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

// UI text — IBM Plex Sans (400/500/600/700)
export const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ALL numbers, dates, labels, meta — IBM Plex Mono (400/500). Hard rule.
export const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
