import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

export const metadata: Metadata = {
  title: "Chotu Restro AI — Modern Restaurant Operating System",
  description: "Minimalist, AI-powered restaurant management platform: POS, KDS, Mobile QR menu, and Chotu voice assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-[#110E0D] text-stone-100 antialiased min-h-screen flex flex-col selection:bg-[#E07A5F] selection:text-white"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
