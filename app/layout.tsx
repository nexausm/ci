import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui";
import { DevConsoleFilter } from "@/components/docs/dev-console-filter";
import { RootProvider } from "fumadocs-ui/provider/next";

export const metadata: Metadata = {
  title: "Cloud Invoice by Nexaus",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/InterVariable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-muted/30 min-h-full">
        <RootProvider search={{ enabled: false }}>{children}</RootProvider>
        <Toaster richColors position="top-right" />
        <DevConsoleFilter />
      </body>
    </html>
  );
}
