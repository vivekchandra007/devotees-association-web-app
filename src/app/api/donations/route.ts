import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    if (!searchParams || searchParams.size === 0) {
        return getAllDonations();
    }

    // Get the phone number from query parameters
    const query = searchParams.get('query') || '';
    if (!query) {
        return getAllDonations();
    }
    try {
        const donations = await prisma.donations.findMany({
            where: {
                OR: [
                    {
                        id: {
                            contains: query,
                        }
                    },
                    {
                        phone: {
                            contains: query,
                        }
                    },
                    {
                        name: {
                            contains: query,
                        }
                    },
                    {
                        donation_receipt_number: {
                            contains: query,
                        }
                    },
                    {
                        amount: parseInt(query, 10) || 0, // Convert query to number if it's a valid number
                    }
                ]
            },
            include: {
                phone_ref_value: {
                    select: {
                        id: true,
                        name: true
                    },
                },
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
                phone_ref_value: {
                    select: {
                        id: true,
                        name: true
                    },
                },
            },
            orderBy: {
                date: 'desc'
            },
            take: 10000, // Limit the results to 100
        });
        return Response.json(donations, { status: 200 });
    } catch (error) {
        console.error('Error fetching donations', error);
        return new Response('Failed to fetch donations', { status: 500 });
    }
}
