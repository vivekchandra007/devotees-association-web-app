import { prisma } from "@/lib/prisma";
import {NextRequest, NextResponse} from "next/server";
import {verifyAccessToken} from "@/lib/auth";
import {
    GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY,
    SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER
} from "@/data/constants";
import { startOfWeek, startOfMonth, startOfYear } from "date-fns";

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

        const range = req.nextUrl.searchParams.get("range") ?? "all";
        let startDate: Date | undefined;

        const today = new Date();

        if (range === "week") {
            startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        } else if (range === "month") {
            startDate = startOfMonth(today);
        } else if (range === "year") {
            startDate = startOfYear(today);
        }

        console.log(startDate);

        const total = await prisma.donations.aggregate({
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
            where: startDate
                ? {
                    date: {
                        gte: startDate,
                    },
                }
                : {},
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        return NextResponse.json(
            { success: true, totalAmount: total?._sum || 0, count: total?._count || 0 },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching donations:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch donation data' },
            { status: 500 }
        );
    }
}