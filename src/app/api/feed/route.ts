import axios from 'axios';
import {NextRequest, NextResponse} from "next/server";

export async function GET() {
    try {
       const res = await axios.get(`https://api.telegram.org/bot${process.env.FEED_BOT_TOKEN}/getUpdates`);
        if (res.status === 200 && res.data && res.data.ok && res.data.result && Array.isArray(res.data.result) && res.data.result.length > 1) {
            res.data.result.shift();
            const messages = res.data.result.filter( (result: { message: { text: string; }; }) => result.message && result.message.text);
            const messageTexts = messages.map((message: { message: { message_id: number, text: string; } } ) => {
                return {
                    id: message.message.message_id,
                    text: message.message.text,
                }
            });
            return NextResponse.json(
                { success: true, messages: messageTexts },
                { status: 200 }
            );
        } else {
            throw new Error();
        }
    } catch (error) {
        console.error('Error posting message to our feed', error);
        return NextResponse.json(
            { success: false, message: 'Error posting message to our feed.' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const message = body.post.text;
        const res = await axios.post(`https://api.telegram.org/bot${process.env.FEED_BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.FEED_CHANNEL_ID,
            text: message,
            parse_mode: 'HTML'
        });
        if (res.status === 200 && res.data && res.data.ok) {
            return NextResponse.json(
                { success: true, data: res.data },
                { status: 200 }
            );
        } else {
            throw new Error();
        }
    } catch (error) {
        console.error('Error posting message to our feed', error);
        return NextResponse.json(
            { success: false, message: 'Error posting message to our feed.' },
            { status: 500 }
        );
    }
}