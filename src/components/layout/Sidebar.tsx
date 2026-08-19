'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { BookOpen, Library, Upload, Plus, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-border bg-sidebar">
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

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href="/"
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            pathname === '/'
              ? 'bg-accent text-white shadow-sm shadow-accent/25'
              : 'text-muted hover:bg-surface-muted hover:text-foreground'
          )}
        >
          <span
            className={cn(
              'absolute inset-y-0 left-0 w-1 rounded-r-full bg-white transition-opacity duration-200',
              pathname === '/' ? 'opacity-100' : 'opacity-0'
            )}
          />
          <Library className="size-4" strokeWidth={1.5} />
          Library
        </Link>
        <Link
          href="/upload"
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            pathname === '/upload'
              ? 'bg-accent text-white shadow-sm shadow-accent/25'
              : 'text-muted hover:bg-surface-muted hover:text-foreground'
          )}
        >
          <span
            className={cn(
              'absolute inset-y-0 left-0 w-1 rounded-r-full bg-white transition-opacity duration-200',
              pathname === '/upload' ? 'opacity-100' : 'opacity-0'
            )}
          />
          <Upload className="size-4" strokeWidth={1.5} />
          Upload
        </Link>

        <div className="my-2 border-b border-border" />

        <Link
          href="/upload"
          className="flex items-center gap-2.5 rounded-xl border border-dashed border-accent/30 bg-accent-light/50 px-3 py-2.5 text-sm font-medium text-accent transition-all duration-200 hover:border-accent/50 hover:bg-accent-light hover:shadow-sm hover:shadow-accent/10 active:scale-[0.98]"
        >
          <Plus className="size-4" strokeWidth={2} />
          New Upload
        </Link>
      </nav>

      {user && (
        <div className="border-t border-border p-3">
          <Link
            href="/account"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
              pathname === '/account'
                ? 'bg-accent-light'
                : 'bg-white shadow-xs hover:shadow-sm'
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