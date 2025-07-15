import prisma from '@/lib/prisma';
import {NextRequest, NextResponse} from 'next/server';
import {
    GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY,
    SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER
} from "@/data/constants";
import {verifyAccessToken} from "@/lib/auth";
import {startOfMonth, startOfWeek, startOfYear} from "date-fns";
import {parseDateFromStringddmmyyyy} from "@/lib/conversions";

export async function POST(req: NextRequest) {
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
        return NextResponse.json({ error: 'Forbidden: You do not have view donations data' }, { status: 403 });
    }

    // process Date Range
    const dateRange = req.nextUrl.searchParams.get("dateRange") ?? "all";
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    const today = new Date();
    if (dateRange === "week") {
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    } else if (dateRange === "month") {
        startDate = startOfMonth(today);
    } else if (dateRange === "year") {
        startDate = startOfYear(today);
    } else if (dateRange.includes('-')) {
        const dateRangeDates = dateRange.split('-');
        startDate = parseDateFromStringddmmyyyy(dateRangeDates[0])!;
        endDate = parseDateFromStringddmmyyyy(dateRangeDates[1])!;
    }

    // process Amount Range
    const amountRange = req.nextUrl.searchParams.get("amountRange") ?? "all";
    let startAmount: number = 0;
    let endAmount: number = 2147483647;
    if (amountRange === "≥5L") {
        startAmount = 500000;
    } else if (amountRange === "5L-1L") {
        startAmount = 100000;
        endAmount = 500000;
    } else if (amountRange === "1L-50K") {
        startAmount = 50000;
        endAmount = 100000;
    } else if (amountRange === "1L-10K") {
        startAmount = 10000;
        endAmount = 100000;
    } else if (amountRange === "≤10K") {
        endAmount = 10000;
    } else if (amountRange.includes('-')) {
        const amountRanges = amountRange.replaceAll(',','').split('-');
        startAmount = parseInt(amountRanges[0], 10);
        endAmount = parseInt(amountRanges[1], 10);
    }

    const body = await req.json();
    const { first, rows, sortField, sortOrder, globalFilter } = body;

    const where = {
        ...(globalFilter && {
            OR: [
                { name: { contains: globalFilter, mode: 'insensitive' } },
                { phone: { contains: globalFilter, mode: 'insensitive' } },
                { donation_receipt_number: { contains: globalFilter, mode: 'insensitive' } },
                ...(parseInt(globalFilter, 10) && globalFilter.length < 9
                    ? [{ amount: parseInt(globalFilter, 10) }]
                    : []),
            ],
        }),
        ...(startDate || endDate
            ? {
                date: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate }),
                },
            }
            : {}),
        amount: {
            gte: startAmount,
            lte: endAmount
        },
    };

    const [records, total] = await Promise.all([
        rows <= 0?
            (
                prisma.donations.findMany({
                    where,
                    include: {
                        phone_ref_value: {
                            select: {
                                id: true,
                                name: true
                            },
                        },
                        campaign_id_ref_value: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                    },
                    orderBy: { [sortField ?? 'date']: sortOrder === -1 ? 'desc' : 'asc' },
                    // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
                    // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
                    cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                        SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
                })
            ):
                (
        prisma.donations.findMany({
            where,
            include: {
                phone_ref_value: {
                    select: {
                        id: true,
                        name: true
                    },
                },
                campaign_id_ref_value: {
                    select: {
                        id: true,
                        name: true
                    }
                },
            },
            skip: first,
            take: rows,
            orderBy: { [sortField ?? 'date']: sortOrder === -1 ? 'desc' : 'asc' },
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        })),
        prisma.donations.count({
            where,
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        }),
    ]);

    return NextResponse.json({ success: true, records, total }, {
        status: 200
    });
}
