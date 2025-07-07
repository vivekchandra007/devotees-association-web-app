import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import {GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY} from "@/data/constants";
import {Prisma} from "@prisma/client";

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
                            mode: 'insensitive' as Prisma.QueryMode
                        }
                    },
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive' as Prisma.QueryMode
                        }
                    },
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive' as Prisma.QueryMode
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
            take: 100, // Limit the results to 100,
            cacheStrategy: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });
        return Response.json(devotees, { status: 200 });
    } catch (error) {
        console.error('Error fetching system roles:', error);
        return new Response('Failed to fetch system roles', { status: 500 });
    }
}
