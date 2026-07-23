import type { Metadata } from "next";
import { Merriweather } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/hooks/useToast";
import { PwaProvider } from "@/components/PwaProvider";
import "./globals.css";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "shoma — PDF Reader",
  description: "Upload a PDF and read its content in a clean, distraction-free layout.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "shoma", statusBarStyle: "default" },
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
    <html lang="en" className={`${merriweather.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white">
        <AuthProvider>
          <ToastProvider>
            {children}
            <PwaProvider />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
