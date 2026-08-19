import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { pdfs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('shooma_session')?.value;
  if (!token) return null;
  const { user, error } = await getSession(token);
  if (error || !user) return null;
  return user;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [pdf] = await db()
      .select()
      .from(pdfs)
      .where(eq(pdfs.id, id));

    if (!pdf) return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    if (pdf.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(pdf);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { folderId } = await request.json();

    const [pdf] = await db()
      .select({ userId: pdfs.userId })
      .from(pdfs)
      .where(eq(pdfs.id, id));

    if (!pdf) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pdf.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db().update(pdfs).set({ folderId: folderId || null }).where(eq(pdfs.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to move PDF' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [pdf] = await db()
      .select({ userId: pdfs.userId })
      .from(pdfs)
      .where(eq(pdfs.id, id));

    if (!pdf) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pdf.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db().delete(pdfs).where(eq(pdfs.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete PDF' }, { status: 500 });
  }
}
