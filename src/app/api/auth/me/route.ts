// Get User Info (Protected)

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = auth.split(' ')[1];
    const devoteeId = verifyAccessToken(token);

    const devotee = await prisma.devotees.findUnique({ where: { id: devoteeId } });
    if (!devotee) throw new Error();

    return NextResponse.json({ devotee });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}