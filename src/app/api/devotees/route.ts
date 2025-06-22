import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    if (!searchParams || searchParams.size === 0) {
        return Response.json({ error: 'Query Params are missing in api request' }, { status: 400 });
    }
    
    // Get the search term from query parameters
    const query = searchParams.get('query') || '';
    console.log('query', query);
    if (!query) {
        return Response.json({ error: 'Search Query is required' }, { status: 400 });
    }
    try {
        const devotees = await prisma.devotees.findMany({
            where: {
                OR: [
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
                        email: {
                            contains: query,
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
                system_role_id: true,
                system_role_id_ref_value: {
                    select: {
                        name: true,
                    },
                }
            },
            orderBy: {
                name: 'asc'
            },
            take: 10, // Limit the results to 10
        });
        return Response.json(devotees, { status: 200 });
    } catch (error) {
        console.error('Error fetching system roles:', error);
        return new Response('Failed to fetch system roles', { status: 500 });
    }
}
