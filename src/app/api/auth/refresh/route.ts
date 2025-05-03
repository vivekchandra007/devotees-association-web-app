import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;

  if (!refreshToken) return Response.json({ error: 'No refresh token' }, { status: 401 });

  try {
    const devoteeId = verifyRefreshToken(refreshToken);
    const newAccessToken = signAccessToken(devoteeId);
    const newRefreshToken = signRefreshToken(devoteeId);

    const res = NextResponse.json({ accessToken: newAccessToken });
    res.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 12 * 30 * 24 * 60 * 60, // 1 year i.e. 12 months i.e. 30 days i.e. 24 hours i.e. 60 minutes i.e. 60 seconds
    });
    return res;
  } catch {
    return Response.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}