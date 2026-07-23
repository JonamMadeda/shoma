import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { pdfs } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
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

    const all = await db()
      .select({ id: pdfs.id, title: pdfs.title, filename: pdfs.filename, fileSize: pdfs.fileSize, createdAt: pdfs.createdAt })
      .from(pdfs)
      .where(eq(pdfs.userId, user.id))
      .orderBy(desc(pdfs.createdAt));

    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch PDFs' }, { status: 500 });
  }
}
