import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust to your prisma client
import { verifyAccessToken } from '@/lib/auth'; // your JWT verification function
import _ from "lodash";
import {convertDateStringIntoDateObject} from "@/lib/conversions";
import {devoteeBulkInsertSchema} from "@/schema/devoteeBulkSchema";

// type Donation = Prisma.donationsGetPayload<{}>; 

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyAccessToken(token); // get devoteeId from token
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const devotees = body.devotees;
        if (!body || !devotees || !Array.isArray(devotees) || devotees.length <= 0) {
            return NextResponse.json({ error: 'No devotees found to bulk upload' }, { status: 401 });
        }
        
        for (let i = devotees.length - 1; i >= 0; i--) {
            let devotee = devotees[i];
            devotee = convertDateStringIntoDateObject(devotee);
            const taxPan = _.get(devotee, 'tax_pan', undefined);
            if (taxPan?.length > 10) {
                delete devotee["tax_pan"];
            }
            const parsed = devoteeBulkInsertSchema.safeParse(devotee);
            if (!parsed.success) {
                devotees.splice(i, 1); // ✅ Safe to delete in reverse
                continue;
            }
            devotee = parsed.data;
            if (!devotee) {
                devotees.splice(i, 1); // ✅ Safe to delete in reverse
                continue;
            }
            devotees[i] = devotee;
        }

        const loggedIndevotee = await prisma.devotees.findUnique({
            where: { id: payload },
            select: {
                name: true,
                system_role_id: true,
            },
        });
        if (!loggedIndevotee?.system_role_id || loggedIndevotee?.system_role_id <= 3) {
            return NextResponse.json({ error: 'Forbidden: You do not have privileges to bulk upload devotees data' }, { status: 403 });
        }

        const result = await prisma.devotees.createMany({
            data: devotees,
            skipDuplicates: true // Optional: skips records with duplicate IDs
        });
        console.log(`${result.count} devotees bulk inserted by ${loggedIndevotee.name}.`);
        return NextResponse.json({ success: true, message: `${result.count} devotees inserted.` }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Server error while inserting devotees. Check request payload and it\'s format' }, { status: 500 });
    }
}