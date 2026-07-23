'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { LogOut, User, Upload } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-end gap-3 px-4">

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/upload"
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <Upload className="size-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Upload PDF</span>
              </Link>
              <span className="hidden sm:block text-sm text-slate-400 truncate max-w-[120px] ml-1">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <LogOut className="size-4" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
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
