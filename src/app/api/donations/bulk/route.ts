import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust to your prisma client
import { verifyAccessToken } from '@/lib/auth'; // your JWT verification function
import _ from "lodash";
import { parseDateFromStringddmmyyyy } from "@/lib/conversions";
import { donationSchema } from "@/schema/donationSchema";
import { GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY } from "@/data/constants";

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

        const skippedDonations: string[] = [];

        for (let i = donations.length - 1; i >= 0; i--) {
            const parsed = donationSchema.safeParse(donations[i]);
            if (!parsed.success) {
                return NextResponse.json({ error: `Donation Data Validation failed for ${_.get(donations[i], "phone", '')}`, details: parsed.error.flatten() }, { status: 400 });
            }
            if (!parsed.data) {
                skippedDonations.push(donations[i]["donation_receipt_number"]);
                donations.splice(i, 1); // ✅ Safe to delete in reverse
            } else {
                _.set(donations[i], "date", parseDateFromStringddmmyyyy(_.get(donations[i], "date")));
            }
        }

        const loggedIndevotee = await prisma.devotees.findUnique({
            where: { id: payload },
            select: {
                name: true,
                system_role_id: true,
            },
            cacheStrategy: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
        });
        if (!loggedIndevotee?.system_role_id || loggedIndevotee?.system_role_id <= 3) {
            return NextResponse.json({ error: 'Forbidden: You do not have privileges to bulk upload donation' }, { status: 403 });
        }

        const result = await prisma.donations.createMany({
            data: donations,
            skipDuplicates: true // Optional: skips records with duplicate IDs
        });

        // Bulk create new devotees from the donation data
        const uniqueDevoteesMap = new Map();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const donation of (donations as any[])) {
            if (donation.phone && !uniqueDevoteesMap.has(donation.phone)) {
                uniqueDevoteesMap.set(donation.phone, {
                    name: donation.name,
                    phone: donation.phone,
                    phone_whatsapp: donation.phone,
                    status: 'inactive',
                    source_id: 2,
                    created_by: payload,
                    updated_by: payload
                });
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newDevotees = Array.from(uniqueDevoteesMap.values()) as any[];
        let devoteeResultCount = 0;

        if (newDevotees.length > 0) {
            const devoteeResult = await prisma.devotees.createMany({
                data: newDevotees,
                skipDuplicates: true
            });
            devoteeResultCount = devoteeResult.count;
        }

        const duplicateMessage = donations.length > result.count ? ` ${donations.length - result.count} donations skipped because they already exist (duplicate).` : '';
        const skippedMessage = skippedDonations.length > 0 ? ` ${skippedDonations.length} donations skipped because of invalid data in them. Correct them in sheet and re-upload. Their donation receipt numbers are: ${skippedDonations.flat()}` : ''
        const devoteeMessage = devoteeResultCount > 0 ? ` ${devoteeResultCount} new devotees created.` : '';

        console.log(`${result.count} donations bulk inserted by ${loggedIndevotee?.name}.${duplicateMessage} ${skippedMessage}${devoteeMessage}`);
        // Successful insert and success message in response
        return NextResponse.json({
            success: true,
            message: `${result.count} donations inserted.${duplicateMessage} ${skippedMessage}${devoteeMessage}`
        }, {
            status: 200
        });
    } catch {
        return NextResponse.json({ error: 'Server error while inserting donations. Check request payload and it\'s format' }, { status: 500 });
    }
}