import type { Metadata } from "next";
import { Merriweather } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/hooks/useToast";
import { PwaProvider } from "@/components/PwaProvider";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import "./globals.css";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "shooma — PDF Reader",
  description: "Upload a PDF and read its content in a clean, distraction-free layout.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "shooma", statusBarStyle: "default" },
  other: { "theme-color": "#6366f1" },
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/icon.svg", sizes: "any" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${merriweather.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-white dark:bg-background">
        <AuthProvider>
          <ToastProvider>
            <DarkModeProvider>
              {children}
              <PwaProvider />
            </DarkModeProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
