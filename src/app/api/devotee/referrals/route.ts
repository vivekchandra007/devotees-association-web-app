import { prisma } from "@/lib/prisma";
import {NextRequest, NextResponse} from "next/server";
import {verifyAccessToken} from "@/lib/auth";
import {
    GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY,
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

        const referredDevotees = await prisma.devotees.findMany({
            where: { referred_by_id: payload },
            select: {
                id: true,
                name: true,
                phone: true,
                created_at: true,
            },
            orderBy: {
                created_at: 'desc'
            },
            cacheStrategy: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        return NextResponse.json(
            { success: true, referredDevotees },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching referred devotees:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch referred devotees' },
            { status: 500 }
        );
    }
}