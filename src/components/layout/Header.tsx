'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { LogOut, User, Upload } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-end gap-3 px-4">

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/upload"
                className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                <Upload className="size-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Upload PDF</span>
              </Link>
              <span className="hidden sm:block text-sm text-muted truncate max-w-[120px] ml-1">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <LogOut className="size-4" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <User className="size-4" strokeWidth={1.5} />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
