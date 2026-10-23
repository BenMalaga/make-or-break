import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { RegisterSW } from "@/components/pwa/register-sw";

const sans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const mono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Make or Break - learn to make things and break things",
    template: "%s - Make or Break",
  },
  description:
    "A free, open-source platform to learn how technology works, by building it (code, AI, hardware, science) and by taking it apart (security and networking). No experience assumed.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "Make or Break",
  appleWebApp: {
    capable: true,
    title: "Make or Break",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#181825" },
    { media: "(prefers-color-scheme: light)", color: "#eff1f5" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <RegisterSW />
      </body>
    </html>
  );
}
