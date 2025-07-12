import { prisma } from "@/lib/prisma";
import {NextRequest, NextResponse} from "next/server";
import {verifyAccessToken} from "@/lib/auth";
import {
    GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY,
    SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER
} from "@/data/constants";
import { startOfWeek, startOfMonth, startOfYear } from "date-fns";
import {parseDateFromStringddmmyyyy} from "@/lib/conversions";

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
        let endDate: Date | undefined;

        const today = new Date();

        if (range === "week") {
            startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        } else if (range === "month") {
            startDate = startOfMonth(today);
        } else if (range === "year") {
            startDate = startOfYear(today);
        } else if (range.includes('-')) {
            const rangeDates = range.split('-');
            startDate = parseDateFromStringddmmyyyy(rangeDates[0])!;
            endDate = parseDateFromStringddmmyyyy(rangeDates[1])!;
        }

        const result = await prisma.donations.groupBy({
            by: ["date"],
            _sum: {
                amount: true,
            },
            where: startDate || endDate
                ? {
                    date: {
                        ...(startDate && { gte: startDate }),
                        ...(endDate && { lte: endDate }),
                    },
                }
                : {},
            orderBy: {
                date: "asc",
            },
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        return NextResponse.json(
            {
                success: true,
                data: result.map((r) => ({
                    // @ts-expect-error "it is from a nested column value of aggregate function"
                    date: r.date,
                    // @ts-expect-error "it is from a nested column value of aggregate function"
                    amount: r._sum.amount ?? 0,
                }))
            },
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