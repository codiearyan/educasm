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
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <UserProvider>
          <div className="flex min-h-screen flex-col">
            <header className="flex justify-center p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl"> <svg 
              className="w-5 h-5" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg></span>
                </div>
                <span className="text-white text-xl font-semibold">educasm</span>
              </div>
            </header>
            
            <main className="flex-1 relative">
              {children}
            </main>

            <BottomNav />
          </div>
          <ToasterProvider />
        </UserProvider>
      </body>
    </html>
  );
}
