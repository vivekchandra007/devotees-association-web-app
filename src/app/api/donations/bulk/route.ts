import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust to your prisma client
import { verifyAccessToken } from '@/lib/auth'; // your JWT verification function
import _ from "lodash";

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
        const donations = body.donations;
        if (!body || !donations || !Array.isArray(donations) || donations.length <= 0) {
            return NextResponse.json({ error: 'No donations found to bulk upload' }, { status: 401 });
        }

        console.log(donations.length);
        
        for (let i = donations.length - 1; i >= 0; i--) {
            const donation = donations[i];
            //const parsed = donationSchema.safeParse(donation);
            // if (!parsed.success) {
            //     return NextResponse.json({ error: 'Donation Data Validation failed', details: parsed.error.flatten() }, { status: 400 });
            // }
            // donation = parsed.data;
            if (!donation || !donation.id) {
                donations.splice(i, 1); // ✅ Safe to delete in reverse
            } else {
                _.set(donations[i], "date", new Date(_.get(donations[i], "date")));
            }
        }

        console.log(donations.length);
        console.log(donations[0]);

        const loggedIndevotee = await prisma.devotees.findUnique({
            where: { id: payload },
            select: {
                name: true,
                role_id: true,
            },
        });
        if (!loggedIndevotee?.role_id || loggedIndevotee?.role_id <= 3) {
            return NextResponse.json({ error: 'Forbidden: You do not have privileges to bulk upload donation' }, { status: 403 });
        }

        const result = await prisma.donations.createMany({
            data: donations,
            skipDuplicates: true // Optional: skips records with duplicate IDs
        });
        console.log(`${result.count} donations inserted.`);
        return NextResponse.json({ success: true, message: `${result.count} donations inserted.` }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}