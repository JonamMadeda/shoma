'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Library, Upload, User } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const tabs = [
    { href: '/', label: 'Library', icon: Library },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/account', label: 'Account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-md lg:hidden">
      <div className="flex min-h-16 items-center px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-accent" />
              )}
              {tab.href === '/account' ? (
                <div className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  active
                    ? 'bg-accent text-white'
                    : 'bg-surface-muted text-muted'
                }`}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              ) : (
                <tab.icon className="size-5" strokeWidth={active ? 2 : 1.5} />
              )}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
