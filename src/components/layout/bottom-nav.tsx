'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, GamepadIcon } from 'lucide-react';

export const BottomNav = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-gray-800">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around py-3">
          <Link
            href="/"
            className={`flex flex-col items-center space-y-1 transition-colors
              ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <HelpCircle className="w-6 h-6" />
            <span className="text-xs">Explore</span>
          </Link>

          <Link
            href="/playground"
            className={`flex flex-col items-center space-y-1 transition-colors
              ${isActive('/playground') ? 'text-primary' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <GamepadIcon className="w-6 h-6" />
            <span className="text-xs">Playground</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}; 