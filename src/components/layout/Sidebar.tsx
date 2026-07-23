'use client';

import { BookOpen, Upload, LogOut, Library } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-slate-50">
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-5">
        <BookOpen className="size-5 text-slate-700" strokeWidth={1.5} />
        <span className="font-serif text-lg font-semibold tracking-tight text-slate-800">
          shoma
        </span>
      </div>

      {user && (
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            aria-label="Sign out"
          >
            <LogOut className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}

      <nav className="flex flex-1 flex-col p-3">
        <Link
          href="/"
          className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
          }`}
        >
          {pathname === '/' && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-slate-800" />
          )}
          <Library className="size-4" strokeWidth={1.5} />
          Library
        </Link>

        <div className="mt-auto pt-3">
          <Link
            href="/upload"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === '/upload'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="size-4" strokeWidth={1.5} />
            Upload PDF
          </Link>
        </div>
      </nav>
    </aside>
  );
}
