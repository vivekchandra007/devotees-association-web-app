import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from "@/lib/auth";
import { z } from 'zod';

const updateDevoteeNoteSchema = z.object({
    internal_note: z.string(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const devoteeId = verifyAccessToken(token);
    if (!devoteeId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const targetDevoteeId = parseInt(id, 10);

    if (isNaN(targetDevoteeId)) {
        return NextResponse.json({ error: 'Invalid devotee ID' }, { status: 400 });
    }

    // Role check: Only certain roles can add notes? ideally any logged in user who can view the dashboard can add notes?
    // Let's check permissions. Usually if they can edit/view, they can add note.
    // For now assuming any authenticated user (who passes existing UI checks) can add a note.

    try {
        const body = await req.json();
        const validation = updateDevoteeNoteSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
        }

        const { internal_note } = validation.data;

        const updatedDevotee = await prisma.devotees.update({
            where: { id: targetDevoteeId },
            data: {
                internal_note,
                updated_by: devoteeId,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ success: true, devotee: updatedDevotee });

    } catch (error) {
        console.error("Error updating devotee note:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
