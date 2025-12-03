import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY, NO_PRISMA_ACCELERATE_CACHE_STRATEGY } from "@/data/constants";
import { Prisma } from "@prisma/client";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    if (!searchParams || searchParams.size === 0) {
        return Response.json({ error: 'Query Params are missing in api request' }, { status: 400 });
    }

    // Get the search term from query parameters
    const query = searchParams.get('query') || '';
    if (!query) {
        return Response.json({ error: 'Search Query is required' }, { status: 400 });
    }
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyAccessToken(token); // get devoteeId from token
        if (!payload) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
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
            return Response.json({ error: 'Forbidden: You do not have view donations reports/ charts' }, { status: 403 });
        }
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
                leader_id: true,
                leader_id_ref_value: {
                    select: {
                        name: true,
                    },
                },
                system_role_id: true,
                system_role_id_ref_value: {
                    select: {
                        name: true,
                    },
                },
                _count: {
                    select: {
                        other_devotees_devotees_leader_idTodevotees: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            },
            take: 100, // Limit the results to 100,
            // for LEADER and above ( >= 3), serve from a SHORTER cache coz they can modify other devotees data
            // for NON LEADER ( < 3), serve from a LONGER cache coz they themselves can't modify other devotees data
            cacheStrategy: loggedIndevotee.system_role_id < 3 ? GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY : NO_PRISMA_ACCELERATE_CACHE_STRATEGY
        });
        return Response.json(devotees, { status: 200 });
    } catch (error) {
        console.error('Error fetching system roles:', error);
        return new Response('Failed to fetch system roles', { status: 500 });
    }
}
