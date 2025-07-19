import { prisma } from "@/lib/prisma";
import {NextRequest, NextResponse} from "next/server";
import {verifyAccessToken} from "@/lib/auth";
import {
    GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY,
    SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER
} from "@/data/constants";

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyAccessToken(token); // get devoteeId from token
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const loggedIndevotee = await prisma.devotees.findUnique({
            where: { id: payload },
            select: {
                name: true,
                system_role_id: true,
            },
            cacheStrategy: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });
        if (!loggedIndevotee?.system_role_id || loggedIndevotee?.system_role_id === 1) {
            return NextResponse.json({ error: 'Forbidden: You do not have view donations reports/ charts' }, { status: 403 });
        }

        const total = await prisma.devotees.count({
                // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
                // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
                cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                    SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
            }
        );
        const active = await prisma.devotees.count({
            where: { status: 'active' },
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        const volunteers = await prisma.devotees.count({
            where: { system_role_id: 2 },
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        const leaders = await prisma.devotees.count({
            where: { system_role_id: 3 },
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        return NextResponse.json(
            {
                success: true,
                total: total || 0,
                active: active || 0,
                volunteers: volunteers || 0,
                leaders: leaders || 0
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching devotees insights:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch devotees data' },
            { status: 500 }
        );
    }
}