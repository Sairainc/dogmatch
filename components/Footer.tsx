'use client';

import { Home, Heart, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        <Link href="/discovery" className={`flex flex-col items-center ${isActive('/discovery') ? 'text-pink-500' : 'text-gray-500'}`}>
          <Home size={24} />
          <span className="text-xs mt-1">ディスカバリー</span>
        </Link>
        <Link href="/hot-likes" className={`flex flex-col items-center ${isActive('/hot-likes') ? 'text-pink-500' : 'text-gray-500'}`}>
          <Heart size={24} />
          <span className="text-xs mt-1">ホットLike</span>
        </Link>
        <Link href="/chat" className={`flex flex-col items-center ${isActive('/chat') ? 'text-pink-500' : 'text-gray-500'}`}>
          <MessageCircle size={24} />
          <span className="text-xs mt-1">チャット</span>
        </Link>
        <Link href="/profile" className={`flex flex-col items-center ${isActive('/profile') ? 'text-pink-500' : 'text-gray-500'}`}>
          <User size={24} />
          <span className="text-xs mt-1">プロフィール</span>
        </Link>
      </div>
    </footer>
  );
} 