// /api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' });
  try {
    res.cookies.set('refresh_token', '', {
      maxAge: 0,
      path: '/',
      expires: new Date(0)
    });
  } catch {
    // If there is an error while clearing the cookie, just ignore it
  }
  return res;
}