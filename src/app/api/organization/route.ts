import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY, NO_PRISMA_ACCELERATE_CACHE_STRATEGY } from "@/data/constants";

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyAccessToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check if the user has permission (Volunteer or above)
        const loggedInDevotee = await prisma.devotees.findUnique({
            where: { id: payload },
            select: { system_role_id: true },
            cacheStrategy: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        if (!loggedInDevotee?.system_role_id || loggedInDevotee.system_role_id < 2) {
            return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
        }

        // Fetch all devotees with necessary fields for the org chart
        const devotees = await prisma.devotees.findMany({
            select: {
                id: true,
                name: true,
                leader_id: true,
                system_role_id: true,
                gender: true,
                phone: true,
                system_role_id_ref_value: {
                    select: {
                        name: true
                    }
                },
                spiritual_level_id_ref_value: {
                    select: {
                        title_male: true,
                        title_female: true,
                        title_other: true
                    }
                }
            },
            cacheStrategy: NO_PRISMA_ACCELERATE_CACHE_STRATEGY // Disable cache to ensure real-time updates
        });

        return NextResponse.json({ success: true, devotees });
    } catch (error) {
        console.error('Error fetching organization data:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
