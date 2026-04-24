import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('tfb_session', { path: '/' });
  return redirect('/dashboard', 302);
};
