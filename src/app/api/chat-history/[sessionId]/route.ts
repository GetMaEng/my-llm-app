/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { chatHistoriesTable } from "@/src/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getServerUser } from "@/src/lib/auth/server";

export const dynamic = 'force-dynamic';

// GET /api/chat-history/[sessionId] - โหลด messages ทั้งหมดจาก session
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId } = await params;
        
        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        // ตรวจสอบว่า session นี้เป็นของ user คนนี้หรือไม่
        const userId = user.id.toString();

        // ดึง messages ทั้งหมดจาก session นี้ (กรองด้วย user_id)
        const messages = await db
            .select()
            .from(chatHistoriesTable)
            .where(and(
                eq(chatHistoriesTable.sessionId, sessionId),
                eq(chatHistoriesTable.userId, userId)
            ))
            .orderBy(asc(chatHistoriesTable.createdAt));
        
        // ถ้าไม่มี messages แปลว่า session ไม่ใช่ของ user คนนี้ หรือไม่มี session นี้
        if (messages.length === 0) {
            return NextResponse.json({ error: 'Session not found or forbidden' }, { status: 403 });
        }

        // แปลง messages เป็น format ที่ UI ต้องการ
        // กรองเฉพาะ human และ ai messages (ไม่รวม tool messages และ ai ที่มี tool_calls)
        const formattedMessages = messages
            .map((msg) => {
                try {
                    // msg.message เป็น object อยู่แล้ว ไม่ต้อง JSON.parse
                    const parsed = msg.message as any;
                    
                    // กรองเฉพาะ human messages
                    if (parsed.type === 'human') {
                        return {
                            id: msg.id.toString(),
                            role: 'user',
                            content: parsed.content || '',
                            createdAt: msg.createdAt,
                        };
                    }
                    
                    // กรองเฉพาะ ai messages ที่ไม่มี tool_calls หรือ tool_calls เป็น array ว่าง
                    if (parsed.type === 'ai') {
                        const toolCalls = parsed.tool_calls || [];
                        if (Array.isArray(toolCalls) && toolCalls.length === 0) {
                            return {
                                id: msg.id.toString(),
                                role: 'assistant',
                                content: parsed.content || '',
                                createdAt: msg.createdAt,
                            };
                        }
                    }
                    
                    // ข้าม tool messages และ ai messages ที่มี tool_calls
                    return null;
                } catch (e) {
                    console.error('[API] Error processing message:', e);
                    return null;
                }
            })
            .filter(Boolean);

        return NextResponse.json(formattedMessages);

    } catch (error) {
        console.error('Error fetching session messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' }, 
            { status: 500 }
        );
    }
}