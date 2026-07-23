import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const sessions = await sql`SELECT id, token, "userId", "expiresAt" FROM neon_auth.session LIMIT 10`;
console.log('Sessions:', JSON.stringify(sessions, null, 2));

const users = await sql`SELECT id, name, email FROM neon_auth.user LIMIT 10`;
console.log('Users:', JSON.stringify(users, null, 2));
