import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/lib/prisma';
import {verifyAccessToken} from "@/lib/auth";
import {
    GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY,
    SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER
} from "@/data/constants";
import { startOfWeek, startOfMonth, startOfYear } from "date-fns";
import {parseDateFromStringddmmyyyy} from "@/lib/conversions";

type GroupedDonation = {
    phone?: string | undefined;
    _sum?: {
        amount: number | null;
    };
    _count?: number;
};

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

        // Step 1: Lookup devotee names by phone numbers
        const donations = await prisma.donations.findMany({
            select: {
                phone: true,
                name: true,
            },
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        // Step 2: Group donations by phone and get total amount per phone
        const groupedDonations = await prisma.donations.groupBy({
            by: ['phone'],
            _sum: {
                amount: true,
            },
            _count: true,
            where: startDate || endDate
                ? {
                    date: {
                        ...(startDate && { gte: startDate }),
                        ...(endDate && { lte: endDate }),
                    },
                }
                : {},
            orderBy: {
                _sum: {
                    amount: 'desc',
                },
            },
            take: 10,
            // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
            // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
            cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });

        const phones = groupedDonations.map((d: GroupedDonation) => d.phone!).filter(Boolean);

        // Step 3: Lookup devotee names by phone numbers
        const devotees = (phones && Array.isArray(phones) && phones.length > 0) ?
            await prisma.devotees.findMany({
                where: {
                    phone: { in: phones },
                },
                select: {
                    phone: true,
                    name: true,
                    id: true,
                },
                // for ADMIN ( > 3), serve from a SHORTER cache coz they can modify donations data
                // for NON ADMIN ( <= 3), serve from a LONGER cache coz they themselves can't modify donations data
                cacheStrategy: loggedIndevotee.system_role_id <=3 ?
                    SPECIFIC_PRISMA_ACCELERATE_CACHE_STRATEGY_LONGER: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
            })
            :
            [];

        // Step 4: Merge name/id into donation data
        const phoneToDevoteeMap = Object.fromEntries(
            devotees.map((d) => [d.phone, { name: d.name, id: d.id }])
        );

        // Step 5: Merge name/id into donations data
        const phoneToDonationsMap = Object.fromEntries(
            donations.map((d) => [d.phone, { name: d.name }])
        );

        const enrichedData = groupedDonations.map((donation: GroupedDonation) => ({
            phone: donation.phone,
            name: donation.phone? (phoneToDonationsMap[donation.phone]?.name || null) : null,
            totalAmount: donation._sum?.amount ?? 0,
            donationCount: donation._count,
            devoteeId: donation.phone? (phoneToDevoteeMap[donation.phone]?.id || null) : null,
        }));

        return NextResponse.json({ success: true, topDevotees: enrichedData });
    } catch (error) {
        console.error('Error fetching donations:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch donation data' },
            { status: 500 }
        );
    }
}