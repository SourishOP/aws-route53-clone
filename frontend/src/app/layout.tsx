import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { FlashbarProvider } from "@/components/FlashbarProvider";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Route 53 Management Console",
  description: "AWS Route 53 clone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <FlashbarProvider>
          <AuthProvider>
            <Shell>{children}</Shell>
          </AuthProvider>
        </FlashbarProvider>
      </body>
    </html>
  );
}
