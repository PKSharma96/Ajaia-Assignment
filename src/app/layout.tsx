import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ajaia Docs",
  description: "A lightweight collaborative document editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Browser extensions often add attributes to <html>/<body> before React loads; ignore those mismatches.
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
