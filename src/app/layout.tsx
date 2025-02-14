import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Layout } from "@/components/layout/layout";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { UserProvider } from "@/components/providers/user-provider";
import { BottomNav } from '@/components/layout/bottom-nav';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Educasm",
  description: "Your AI-powered learning companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-gray-100 min-h-screen`}>
        <UserProvider>
          <main className="min-h-screen bg-background pb-20">
            <div className="flex justify-center p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📚</span>
                </div>
                <span className="text-white text-xl font-semibold">educasm</span>
              </div>
            </div>
            {children}
          </main>
          <ToasterProvider />
          <BottomNav />
        </UserProvider>
      </body>
    </html>
  );
}
