import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signIn, signUp, getSession } from '@/lib/auth';

const SESSION_COOKIE = 'shoma_session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ auth: string[] }> }
) {
  const { auth } = await params;
  const path = auth.join('/');

  if (path === 'sign-up/email') {
    const body = await request.json();
    const result = await signUp(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return NextResponse.json({ user: result.user });
  }

  if (path === 'sign-in/email') {
    const body = await request.json();
    const result = await signIn(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return NextResponse.json({ user: result.user });
  }

  if (path === 'sign-out') {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ auth: string[] }> }
) {
  const { auth } = await params;
  const path = auth.join('/');

  if (path === 'session') {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }
    const result = await getSession(token);
    if (result.error) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: result.user });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
