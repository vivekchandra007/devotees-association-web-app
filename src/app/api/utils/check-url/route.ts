import axios from "axios";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url || typeof url !== 'string') return Response.json({ error: 'Missing URL' }, { status: 400 });

    try {
        const response = await axios.head(url);
        return Response.json({ exists: true, status: response.status }, { status: 200 });
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404) {
                return Response.json({ exists: false, status }, { status: 200 });
            } else {
                return Response.json({ exists: false, error: error.message }, { status: 500 });
            }
        } else {
            return Response.json({ exists: false, error: 'Unknown error' }, { status: 500 });
        }
    }
}