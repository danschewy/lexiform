import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Gothic_A1 } from "next/font/google";
const gothic = Gothic_A1({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "LexiForm",
  description: "Create and manage forms with AI assistance",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={
          "bg-[url('/background.jpg')] bg-repeat backdrop-blur-md " +
          gothic.className
        }
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
