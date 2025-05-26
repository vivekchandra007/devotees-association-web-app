import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    if (!searchParams || searchParams.size === 0) {
        return getAllDonations();
    }

    // Get the phone number from query parameters
    const phone = searchParams.get('phone') || '';
    if (!phone) {
        return getAllDonations();
    }
    try {
        const donations = await prisma.donations.findMany({
            where: {
                phone: phone
            },
            select: {
                id: true,
                donation_receipt_number: true,
                name: true,
                payment_mode: true,
                amount: true,
                collected_by: true,
                status: true,
                date: true
            },
            orderBy: {
                date: 'desc'
            },
            take: 50, // Limit the results to 50
        });
        return Response.json(donations, { status: 200 });
    } catch (error) {
        console.error('Error fetching donations', error);
        return new Response('Failed to fetch donations', { status: 500 });
    }
}

async function getAllDonations() {
    try {
        const donations = await prisma.donations.findMany({
            include: {
                devotees: {
                    select: {
                        id: true,
                        name: true
                    },
                },
            },
            orderBy: {
                date: 'desc'
            },
            take: 100, // Limit the results to 100
        });
        return Response.json(donations, { status: 200 });
    } catch (error) {
        console.error('Error fetching donations', error);
        return new Response('Failed to fetch donations', { status: 500 });
    }
}
