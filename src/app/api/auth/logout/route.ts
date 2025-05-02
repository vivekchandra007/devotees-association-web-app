// /api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set('refresh_token', '', {
    maxAge: 0,
    path: '/',
  });
  return res;
}