'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useDarkMode } from '@/components/DarkModeProvider';
import { LogOut, User, Mail, Calendar, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useDarkMode();

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-8 sm:py-12">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your account settings
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-lg font-bold text-white shadow-md shadow-accent/20">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground">
                {user.name || 'User'}
              </p>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Account Details
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-muted">
                <User className="size-4 text-muted" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-muted">Name</p>
                <p className="text-sm font-medium text-foreground">{user.name || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-muted">
                <Mail className="size-4 text-muted" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-muted">Email</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-muted">
                <Calendar className="size-4 text-muted" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-muted">Member since</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Appearance
          </h2>
          <div className="flex gap-2">
            {([
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ]).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                  theme === value
                    ? 'border-accent bg-accent-light text-accent'
                    : 'border-border text-muted hover:bg-surface-muted'
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Sign Out
          </h2>
          <p className="mb-4 text-sm text-muted">
            Sign out of your account on this device.
          </p>
          <Button
            variant="danger"
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="size-4" strokeWidth={1.5} />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}