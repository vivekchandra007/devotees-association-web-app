import prisma from '@/lib/prisma';
import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from "@prisma/client";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { first, rows, sortField, sortOrder, globalFilter } = body;

    const where = globalFilter ? {
            OR: [
                { name: { contains: globalFilter, mode: 'insensitive' as Prisma.QueryMode } },
                { phone: { contains: globalFilter, mode: 'insensitive' as Prisma.QueryMode } },
                { donation_receipt_number: { contains: globalFilter, mode: 'insensitive' as Prisma.QueryMode } },
                { amount: globalFilter.length < 9 && parseInt(globalFilter, 10)? parseInt(globalFilter, 10) : 0 }
            ]
        }
        : {};

    const [records, total] = await Promise.all([
        prisma.donations.findMany({
            where,
            include: {
                phone_ref_value: {
                    select: {
                        id: true,
                        name: true
                    },
                },
            },
            skip: first,
            take: rows,
            orderBy: { [sortField ?? 'date']: sortOrder === -1 ? 'desc' : 'asc' },
        }),
        prisma.donations.count({ where }),
    ]);

    return NextResponse.json({ success: true, records, total }, {
        status: 200
    });
}
