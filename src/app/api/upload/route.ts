import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { pdfs } from '@/db/schema';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('shoma_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, error: authError } = await getSession(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    const [pdf] = await db()
      .insert(pdfs)
      .values({
        userId: user.id,
        title: file.name.replace(/\.pdf$/i, ''),
        filename: file.name,
        fileSize: file.size,
        content: base64,
      })
      .returning({ id: pdfs.id, title: pdfs.title, filename: pdfs.filename, fileSize: pdfs.fileSize, createdAt: pdfs.createdAt });

    return NextResponse.json(pdf, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
