import axios from "axios";
import prisma from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import _ from "lodash";

export async function POST(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const body = await request.json()
    const referralCode:number | null = Number.parseInt(body.ref?.slice(11));
    const source:number | undefined = body.source;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifiedPhoneAccesstoken = authHeader.split(' ')[1];

    try {
        const response = await axios.post(process.env.MSG91_SERVER_VERIFY_URL!, {
            "authkey": process.env.MSG91_SERVER_AUTH_KEY,
            "access-token": verifiedPhoneAccesstoken
        }, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        });

        if (response.status === 200 && response.data.type === "success" && response.data.message) {
            // if the MSG verification is successful, phone number will be present in the response.data.message
            // insert this verified phone number in DB if it doesn't exist already or fetch other details from "devotees" table corresponding to this phone number, if it already exists. 
            return insertOrFetchDevotee(response.data.message, referralCode, source);
            //return Response.json(response.data, { status: 200 });
        } else {
            console.error("Error verifying MSG91 access token", response.data);
            return Response.json({ error: "Error verifying MSG91 access token. Please refresh page and try again." }, { status: 401 });
        }
    } catch (error) {
        console.error("Error verifying MSG91 access token", error)
        return Response.json({ error: "Error verifying MSG91 access token" }, { status: 401 });
    }
}

async function insertOrFetchDevotee(phoneNumber: string, referralCode: number|null, source: number|undefined) {
    try {
        let devotee = await prisma.devotees.findFirst({
            where: { phone: phoneNumber },
        });

        if (!devotee) {
            const data = {
                phone: phoneNumber,
                phone_verified: true,
                phone_whatsapp: phoneNumber,
            };
            _.set(data,"status", "active");
            if (source) {
                _.set(data,"source_id", source);
            }
            if (referralCode) {
                _.set(data,"referred_by_id", source);
            }
            devotee = await prisma.devotees.create({ data });
        }

        const accessToken = signAccessToken(devotee.id);
        const refreshToken = signRefreshToken(devotee.id);
        const res = NextResponse.json({ accessToken }, { status: 200 });
        res.cookies.set('refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 12 * 30 * 24 * 60 * 60, // 1 year i.e. 12 months i.e. 30 days i.e. 24 hours i.e. 60 minutes i.e. 60 seconds
        });
        return res;
    } catch (error) {
        console.error("Error inserting or fetching devotee:", error);
        return Response.json({ error: "Failed to register and get details. Please refresh page and try again." }, { status: 500 });
    }
}
