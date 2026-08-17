'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Library, Upload, LogOut } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const tabs = [
    { href: '/', label: 'Library', icon: Library },
    { href: '/upload', label: 'Upload', icon: Upload },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center px-2 pb-[env(safe-area-inset-bottom)]">
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
              <tab.icon className="size-5" strokeWidth={active ? 2 : 1.5} />
              {tab.label}
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted transition-colors hover:text-muted-medium"
        >
          <LogOut className="size-5" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </nav>
  );
}