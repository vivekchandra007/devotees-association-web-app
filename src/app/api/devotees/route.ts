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

export async function POST(request: Request) {
  const body = await request.json();
  const { phone } = body;

  try {
    const newDevotee = await prisma.devotees.create({
      data: {
        phone
      },
    });
    return new Response(JSON.stringify(newDevotee), { status: 201 });
  } catch (error) {
    console.error("Error creating devotee:", error);
    return new Response("Failed to create devotee", { status: 500 });
  }
}