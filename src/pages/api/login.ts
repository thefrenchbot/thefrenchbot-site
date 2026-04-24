import type { APIRoute } from 'astro';
import { createHash } from 'crypto';

export const prerender = false;

function makeToken(secret: string): string {
  return createHash('sha256').update(secret + ':tfb-dashboard').digest('hex');
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const data = await request.formData();
  const password = data.get('password')?.toString() ?? '';

  const DASHBOARD_PASSWORD = import.meta.env.DASHBOARD_PASSWORD;
  const SESSION_SECRET = import.meta.env.SESSION_SECRET || DASHBOARD_PASSWORD;

  if (!DASHBOARD_PASSWORD || password !== DASHBOARD_PASSWORD) {
    return redirect('/dashboard?error=1', 302);
  }

  cookies.set('tfb_session', makeToken(SESSION_SECRET), {
    httpOnly: true,           // inaccessible au JavaScript
    secure: import.meta.env.PROD, // HTTPS uniquement en production
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,     // 8 heures
  });

  return redirect('/dashboard', 302);
};
