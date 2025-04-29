import prisma from '@/lib/prisma';
export const dynamic = 'force-static';

export async function GET() {
    try {
        const systemRoles = await prisma.system_roles.findMany();
        return Response.json(systemRoles);
    } catch(error) {
        console.error('Error fetching system roles:', error);
        return new Response('Failed to fetch system roles', { status: 500 });
    }
}
