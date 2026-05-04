import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { chatHistoriesTable } from "@/src/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getServerUser } from "@/src/lib/auth/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id.toString();

        // Retrieves chat history grouped by seesion_id with last message
        const histories = await db
            .select({
                sessionId: chatHistoriesTable.sessionId,
                lastMessage: sql<string>`(
                    SELECT message::text 
                    FROM ${chatHistoriesTable} AS t2
                    WHERE t2.session_id = ${chatHistoriesTable}.session_id
                    AND (t2.message::json->>'type' = 'human' OR (t2.message::json->>'type' = 'ai' AND jsonb_array_length((t2.message::jsonb->'tool_calls')::jsonb) = 0))
                    ORDER BY t2.created_at DESC 
                    LIMIT 1
                )`,
            })
            .from(chatHistoriesTable)
            .where(eq(chatHistoriesTable.userId, userId))
            .groupBy(chatHistoriesTable.sessionId)
            .orderBy(desc(sql`MAX(${chatHistoriesTable.createdAt})`))
            .limit(10);

        // Parse last message for retrieve text content
        const formattedHistories = histories.map(h => {
            try {
                const msg = JSON.parse(h.lastMessage || '{}');
                const preview = msg.content 
                    ? String(msg.content).substring(0, 25) 
                    : 'No content';
                
                return {
                    sessionId: h.sessionId,
                    preview,
                };
            } catch {
                return {
                    sessionId: h.sessionId,
                    preview: 'Invalid message',
                };
            }
        });

        return NextResponse.json(formattedHistories);

    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat history' }, 
            { status: 500 }
        );
    }
}

// DELETE endpoint for delete chat history
export async function DELETE(req: NextRequest) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id.toString();
        const { sessionId } = await req.json();
        
        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        // Delete chat history of this session (Must belong to this user only)
        await db
            .delete(chatHistoriesTable)
            .where(sql`session_id = ${sessionId} AND user_id = ${userId}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting chat history:', error);
        return NextResponse.json(
            { error: 'Failed to delete chat history' }, 
            { status: 500 }
        );
    }
}