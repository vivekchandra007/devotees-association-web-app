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

    const devotee = await prisma.devotees.findUnique({ 
      where: { id: devoteeId },
      include: {
        system_role_id_ref_value: {
          select: {
            name: true,
          },
        },
        spiritual_level_id_ref_value: {
          select: {
            title_male: true,
            title_female: true,
            title_other: true
          }
        },
        source_id_ref_value: {
          select: {
            name: true,
            description: true
          }
        },
        counsellor_id_ref_value: {
          select: {
            id: true,
            name: true
          }
        },
        referred_by_id_ref_value: {
          select: {
            id: true,
            name: true
          }
        }
      }, 
    });
    if (!devotee) throw new Error();

    return NextResponse.json({ devotee });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}