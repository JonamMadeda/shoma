import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { folders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('shoma_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { user, error: authError } = await getSession(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const all = await db()
      .select()
      .from(folders)
      .where(eq(folders.userId, user.id))
      .orderBy(desc(folders.createdAt));

    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('shoma_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { user, error: authError } = await getSession(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const [folder] = await db()
      .insert(folders)
      .values({ userId: user.id, name: name.trim() })
      .returning();

    return NextResponse.json(folder, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
