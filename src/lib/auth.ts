import { neon } from '@neondatabase/serverless';

const AUTH_URL = 'https://ep-long-bonus-auxz3ndn.neonauth.c-10.us-east-1.aws.neon.tech/neondb/auth';

async function callAuthApi(
  path: string,
  body: Record<string, unknown>,
  token?: string
): Promise<{ data?: unknown; error?: string; status: number }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  };
  if (token) {
    headers['Cookie'] = `__Secure-neon-auth.session_token=${token}`;
  }

  try {
    const res = await fetch(`${AUTH_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = res.ok ? await res.json() : null;
    let error: string | undefined;
    if (!res.ok) {
      try {
        const errBody = await res.json();
        error = errBody.message || errBody.code || `Request failed (${res.status})`;
      } catch {
        error = `Request failed (${res.status})`;
      }
    }
    return { data, error, status: res.status };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Network error', status: 500 };
  }
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

export async function signUp(params: SignUpParams): Promise<{
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  const { data, error } = await callAuthApi('/sign-up/email', { ...params });
  if (error) return { error };
  const res = data as { token: string; user: AuthUser };
  return { user: res.user, token: res.token };
}

export interface SignInParams {
  email: string;
  password: string;
}

export async function signIn(params: SignInParams): Promise<{
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  const { data, error } = await callAuthApi('/sign-in/email', { ...params });
  if (error) return { error };
  const res = data as { token: string; user: AuthUser };
  return { user: res.user, token: res.token };
}

export async function getSession(token: string): Promise<{ user?: AuthUser; error?: string }> {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const rows = await sql`
      SELECT u.id, u.name, u.email, u."emailVerified", u.image, u.role
      FROM neon_auth.session s
      JOIN neon_auth.user u ON u.id = s."userId"
      WHERE s.token = ${token} AND s."expiresAt" > NOW()
      LIMIT 1
    `;
    if (rows.length === 0) return { error: 'Session expired or invalid' };
    const row = rows[0];
    return {
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: row.emailVerified,
        image: row.image,
        role: row.role,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Session check failed' };
  }
}
