'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { BookOpen, Library, Upload, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside aria-label="Sidebar" className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-border bg-sidebar">
      <div className="p-5 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-accent shadow-md shadow-accent/25 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-accent/30 group-hover:scale-105">
            <BookOpen className="size-4.5 text-white" strokeWidth={2} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              shooma
            </span>
            <p className="text-[11px] text-muted">PDF Reader</p>
          </div>
        </Link>
      </div>

      <div className="mx-4 border-b border-border" />

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
        <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-faint">Workspace</p>
        <Link
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            pathname === '/'
              ? 'bg-accent text-white shadow-sm shadow-accent/25'
              : 'text-muted hover:bg-surface-muted hover:text-foreground'
          )}
        >

          <Library className="size-4" strokeWidth={1.5} />
          Library
        </Link>
        <Link
          href="/upload"
          aria-current={pathname === '/upload' ? 'page' : undefined}
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            pathname === '/upload'
              ? 'bg-accent text-white shadow-sm shadow-accent/25'
              : 'text-muted hover:bg-surface-muted hover:text-foreground'
          )}
        >

          <Upload className="size-4" strokeWidth={1.5} />
          Upload
        </Link>
      </nav>

      {user && (
        <div className="border-t border-border p-3">
          <Link
            href="/account"
            aria-label="Account settings"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
              pathname === '/account'
                ? 'bg-accent-light'
                : 'bg-white shadow-xs hover:shadow-sm dark:bg-surface-muted'
            )}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-sm font-bold text-white shadow-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-[11px] text-muted">Account</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-faint" strokeWidth={1.5} />
          </Link>
        </div>
      )}
    </aside>
  );
}
