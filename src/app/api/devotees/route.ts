import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const devotees = await prisma.devotees.findMany();
        Response.json(devotees);
    } catch(error) {
        console.error('Error fetching devotees', error);
        return new Response('Failed to fetch devotees', { status: 500 });
    }
}