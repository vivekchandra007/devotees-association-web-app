import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust to your prisma client
import { verifyAccessToken } from '@/lib/auth'; // your JWT verification function
import { devoteeSchema } from '@/schema/devoteeFormSchema';
import { convertDateStringIntoDateObject } from '@/lib/conversions';
import {
  GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY,
  SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_SHORTER
} from "@/data/constants";

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

    let body = await req.json();
    body = convertDateStringIntoDateObject(body);
    const parsed = devoteeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.id !== payload) {
      // If it is not devotee himself then a system_role_id > 2 i.e. a leader or admin who can make changes to some devotee's data
      const loggedIndevotee = await prisma.devotees.findUnique({
        where: { id: payload },
        select: {
          name: true,
          system_role_id: true,
        },
        cacheStrategy: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
      });
      if (!loggedIndevotee?.system_role_id || loggedIndevotee?.system_role_id <= 2) {
        return NextResponse.json({ error: 'Forbidden: You do not have privileges to update details of this devotee.' }, { status: 403 });
      }
    }
    // cast out "id" from data so that no one can update the id through this query
    const {id, ...dataWithoutId} = parsed.data;
    if (dataWithoutId && id) {
      const updatedDevotee = await prisma.devotees.update({
        where: { id },
        data: dataWithoutId,
      });
      return NextResponse.json({ success: true, devotee: updatedDevotee }, { status: 200 });
    } else {
      throw new Error();
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (!searchParams || searchParams.size === 0) {
      return Response.json({ error: 'Query Params are missing in api request' }, { status: 400 });
    }

    // Get the search term from query parameters
    const devoteeId = Number.parseInt(searchParams.get('devoteeId')!);
    if (!devoteeId) {
      return Response.json({ error: 'id of the devotee is required' }, { status: 400 });
    }

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
            description: true,
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
      cacheStrategy: SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_SHORTER
    });

    if (!devotee) throw new Error();

    return NextResponse.json({ devotee });
  } catch {
    return NextResponse.json({ error: 'Server error or Invalid query param' }, { status: 500 });;
  }
}