'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { UploadZone } from '@/components/UploadZone';

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
    <div className="mx-auto max-w-lg py-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-slate-800">
          Upload a PDF
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Drag and drop a PDF file or click to browse
        </p>
      </div>

      {user ? (
        <UploadZone onFileSelect={handleFileSelect} isLoading={uploading} />
      ) : (
        <p className="text-center text-sm text-slate-400">Sign in to upload PDFs</p>
      )}
    </div>
  );
}
