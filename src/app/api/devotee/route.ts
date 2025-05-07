import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust to your prisma client
import { verifyAccessToken } from '@/lib/auth'; // your JWT verification function
import { devoteeSchema } from '@/schema/devoteeFormSchema';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAccessToken(token); // get devoteeId from token
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = devoteeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.id !== payload) {
      // TODO: either it be devotee himself or a role_id > 1 i.e. a leader or admin who can make changes to some devotee's data
      return NextResponse.json({ error: 'Forbidden: Mismatched devotee ID' }, { status: 403 });
    }

    const updatedDevotee = await prisma.devotees.update({
      where: { id: parsed.data.id },
      data: {
        ...parsed.data
      },
    });

    return NextResponse.json({ success: true, devotee: updatedDevotee }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}