import axios from 'axios';
import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {verifyAccessToken} from "@/lib/auth";
import {GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY} from "@/data/constants";

export async function GET(req: NextRequest) {
    try {
        // const res = await axios.get(`https://api.telegram.org/bot${process.env.FEED_BOT_TOKEN}/getUpdates`);
        const fileId = req.nextUrl.searchParams.get("fileId") ?? null;
        if (!fileId) {
            // get recent max 21 feed messages
            const messages = await prisma.feed_messages.findMany({
                select: {
                    text: true,
                    media_type: true,
                    media_file_id: true,
                    updated_at: true,
                    updated_by: true,
                    updated_by_ref_value: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    updated_at: 'desc'
                },
                take: 21,
                cacheStrategy: GLOBAL_PRISMA_ACCELERATE_CACHE_STRATEGY
            });
            return NextResponse.json(
                { success: true, messages },
                { status: 200 }
            );
        } else {
            // means user is requesting a file media url to download it (image, video, gif)
            let fileUrl = null;
            const fileDetailsResponse = await axios.post(`https://api.telegram.org/bot${process.env.FEED_BOT_TOKEN}/getFile`, {
                file_id: fileId
            });
            if (fileDetailsResponse.status === 200 && fileDetailsResponse.data && fileDetailsResponse.data.ok && fileDetailsResponse.data.result) {
                const fileInfo = fileDetailsResponse.data.result;
                const filePath = fileInfo.file_path; // e.g., "photos/file_0.jpg" or "videos/file_1.mp4"
                fileUrl = `https://api.telegram.org/file/bot${process.env.FEED_BOT_TOKEN}/${filePath}`;
                return NextResponse.json(
                    { success: true, url: fileUrl },
                    { status: 200 }
                );
            } else {
                throw new Error("File Not Found");
            }
        }
    } catch (error) {
        console.error('Error getting feed messages or media file URL', error);
        return NextResponse.json(
            { success: false, message: 'Error getting feed messages or media file URL' },
            { status: 500 }
        );
    }
}

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

        const post = await req.formData();;
        const text = post.get('text')?.toString() || '';
        const file = post.get('media') as File | null;
        if (!text && !file) {
            throw new Error();
        }
        let res;
        if (!file) {
            res = await axios.post(`https://api.telegram.org/bot${process.env.FEED_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.FEED_CHANNEL_ID,
                text: text,
                parse_mode: 'HTML'
            });
        } else {
            const formData = new FormData();
            formData.append('chat_id', process.env.FEED_CHANNEL_ID!);
            formData.append('caption', text);
            if (file.type.startsWith('video')) {
                formData.append('video', file);
                res = await axios.post(`https://api.telegram.org/bot${process.env.FEED_BOT_TOKEN}/sendVideo`, formData);
            } else if (file.type.startsWith('image')) {
                formData.append('photo', file);
                res = await axios.post(`https://api.telegram.org/bot${process.env.FEED_BOT_TOKEN}/sendPhoto`, formData);
            }
        }
        if (res && res.status === 200 && res.data && res.data.ok && res.data.result && res.data.result.message_id) {
            const result = res.data.result;
            console.log(result);
            await prisma.feed_messages.create({
                data: {
                    message_id: result.message_id,
                    chat_id: result.chat.id,
                    text: text,
                    media_type: file?.type, // fill in if you used sendPhoto/sendVideo
                    media_file_id: result.photo ? result.photo[result.photo.length - 1].file_id : result.video.file_id, // fill in if applicable
                    tags: result.text ? extractTags(result.text) : [],
                    created_by: payload ?? null, //payload contains token, which when decrypted reveals logged in user's devotee ID
                    updated_by: payload ?? null, //payload contains token, which when decrypted reveals logged in user's devotee ID
                }
            });
            return NextResponse.json(
                { success: true, id: result.message_id },
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

function extractTags(text: string): string[] {
    const regex = /#(\w+)/g
    const tags = []
    let match
    while ((match = regex.exec(text)) !== null) {
        tags.push(match[1].toLowerCase())
    }
    return tags
}