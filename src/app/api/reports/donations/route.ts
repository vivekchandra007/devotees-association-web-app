import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type GroupedDonation = {
    phone?: string | undefined;
    _sum?: {
        amount: number | null;
    };
    _count?: number;
};

export async function GET() {
    try {
        // Step 1: Lookup devotee names by phone numbers
        const donations = await prisma.donations.findMany({
            select: {
                phone: true,
                name: true,
            },
        });

        // Step 2: Group donations by phone and get total amount per phone
        const groupedDonations = await prisma.donations.groupBy({
            by: ['phone'],
            _sum: {
                amount: true,
            },
            _count: true,
            orderBy: {
                _sum: {
                    amount: 'desc',
                },
            },
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

        return NextResponse.json({ success: true, data: enrichedData });
    } catch (error) {
        console.error('Error fetching donations:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch donation data' },
            { status: 500 }
        );
    }
}