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
