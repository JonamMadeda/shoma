'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { UploadZone } from '@/components/UploadZone';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, BookOpen, CheckCircle2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.set('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const pdf = await res.json();
        toast('PDF uploaded successfully', 'success');
        router.push(`/read/${pdf.id}`);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Upload failed', 'error');
      } finally {
        setUploading(false);
      }
    },
    [router, toast]
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm sm:mb-8 sm:p-7">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-light shadow-sm">
          <Upload className="size-7 text-accent" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Upload a PDF
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted">
          Extract and read your PDF content in a clean, distraction-free layout
            </p>
          </div>
          <div className="rounded-xl bg-surface-muted px-3 py-2 text-xs font-medium text-muted-medium">PDF · up to 50 MB</div>
        </div>
      </div>

      {user ? (
        <>
          <div className="rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-5"><UploadZone onFileSelect={handleFileSelect} isLoading={uploading} /></div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-center shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent-light">
                <FileText className="size-4 text-accent" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-foreground">PDF Only</p>
              <p className="text-[11px] text-muted">Up to 50 MB</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-center shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent-light">
                <BookOpen className="size-4 text-accent" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-foreground">Clean Reader</p>
              <p className="text-[11px] text-muted">Distraction-free</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-center shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent-light">
                <CheckCircle2 className="size-4 text-accent" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-foreground">Instant</p>
              <p className="text-[11px] text-muted">Start reading now</p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface-muted/30 px-6 py-16 text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light shadow-sm">
              <Upload className="h-6 w-6 text-accent" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-base font-semibold text-foreground">Sign in to upload</h2>
          <p className="mt-1.5 max-w-xs text-sm text-muted">
            Create a free account to upload, organize, and read your PDFs anywhere
          </p>
          <Link href="/sign-in" className="mt-6">
            <Button variant="primary" size="md">
              Get started
            </Button>
          </Link>
          <p className="mt-3 text-xs text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-medium text-accent hover:text-accent-hover">
              Sign up
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
