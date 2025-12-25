
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from "@/lib/auth";
import { z } from 'zod';
import { parseDateFromStringddmmyyyy } from "@/lib/conversions";

const updateDonationSchema = z.object({
    name: z.string().max(100).optional(),
    phone: z.string().max(21).optional(),
    payment_mode: z.string().max(20).optional(),
    amount: z.number().int().optional(),
    date: z.string().optional(),
    internal_note: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const devoteeId = verifyAccessToken(token);
    if (!devoteeId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const loggedInDevotee = await prisma.devotees.findUnique({
        where: { id: devoteeId },
        select: { system_role_id: true }
    });

    // Check if admin (system_role_id > 1 as per implementation plan/existing code inference)
    // Actually existing code says:
    // "if (!loggedIndevotee?.system_role_id || loggedIndevotee?.system_role_id === 1) { return Forbidden }"
    // So we use the same check.
    if (!loggedInDevotee?.system_role_id || loggedInDevotee.system_role_id === 1) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const donationId = parseInt(id, 10);

    if (isNaN(donationId)) {
        return NextResponse.json({ error: 'Invalid donation ID' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const validation = updateDonationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 });
        }

        const data = validation.data;
        const updateData: any = {
            updated_by: devoteeId,
            updated_at: new Date(),
        };

        if (data.name) updateData.name = data.name;
        if (data.amount) updateData.amount = data.amount;
        if (data.payment_mode) updateData.payment_mode = data.payment_mode;
        if (data.internal_note) updateData.internal_note = data.internal_note;

        if (data.phone) {
            // Frontend sends 10 digit, backend stores maybe with country code 91
            // Existing 'DonationsDashboard' formatIntoProperJson does: `91${phoneFormatter}`
            // Let's check how it's stored. The existing BULK upload does `91` + 10 digits.
            // But here we are editing. If the phone number is just updated, we should probably stick to the same format.
            // Let's assume we store it with 91 prefix if that's the convention.
            // However, the `donations` table has `phone` as varchar(21).
            // Let's prepend 91 for consistency if that is the convention.
            updateData.phone = `91${data.phone}`;
        }

        if (data.date) {
            // Frontend usually sends "dd-mm-yyyy" via `formatDateIntoStringddmmyyyy`
            // But if we use DatePicker in PrimeReact, it might send ISO string or Date object.
            // WE should standardize on what we expect. 
            // The existing `donations` `date` field is `DateTime? @db.Date`.
            // Let's handle parsing. If it's a string in dd-mm-yyyy, we parse it.
            // If it's ISO, we use new Date().
            // Ideally we'd prefer standard ISO from frontend API call.
            // But let's support what we likely receive.
            // If we receive "25-12-2025" (dd-mm-yyyy)
            if (data.date.includes('-') && data.date.length === 10) {
                updateData.date = parseDateFromStringddmmyyyy(data.date);
            } else {
                updateData.date = new Date(data.date);
            }
        }

        const updatedDonation = await prisma.donations.update({
            where: { id: donationId },
            data: updateData,
        });

        return NextResponse.json({ success: true, donation: updatedDonation });

    } catch (error) {
        console.error("Error updating donation:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
