import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { folders, pdfs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('shoma_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { user, error: authError } = await getSession(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const [folder] = await db()
      .select({ userId: folders.userId })
      .from(folders)
      .where(eq(folders.id, id));

    if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (folder.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db().update(pdfs).set({ folderId: null }).where(eq(pdfs.folderId, id));
    await db().delete(folders).where(eq(folders.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
