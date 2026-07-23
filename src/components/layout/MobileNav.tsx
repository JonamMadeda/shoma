'use client';

import { Library, Upload, LogOut, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export function MobileNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const tabs = [
    { href: '/', label: 'Library', icon: Library },
    { href: '/upload', label: 'Upload', icon: Upload },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden">
      {tabs.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              active ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="size-5" strokeWidth={1.5} />
            {tab.label}
          </Link>
        );
      })}
      <button
        onClick={signOut}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <LogOut className="size-5" strokeWidth={1.5} />
        Sign out
      </button>
    </nav>
  );
}
