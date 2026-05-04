/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { chatHistoriesTable } from "@/src/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getServerUser } from "@/src/lib/auth/server";

export const dynamic = 'force-dynamic';

// GET /api/chat-history/[sessionId] - Load all messages from session
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

        // Check this session belongs the user
        const userId = user.id.toString();

        // Retrieves all messages from this session (filter with user_id)
        const messages = await db
            .select()
            .from(chatHistoriesTable)
            .where(and(
                eq(chatHistoriesTable.sessionId, sessionId),
                eq(chatHistoriesTable.userId, userId)
            ))
            .orderBy(asc(chatHistoriesTable.createdAt));
        
        // If no messages, then this session doesn't belong any user or not have this session
        if (messages.length === 0) {
            return NextResponse.json({ error: 'Session not found or forbidden' }, { status: 403 });
        }

        // Transfers messages to UI format
        // Filters only humam and ai messages (NOT exist tool messages and ai that have tool_calls)
        const formattedMessages = messages
            .map((msg) => {
                try {
                    // msg.message already be object, not need to JSON.parse
                    const parsed = msg.message as any;
                    
                    // Filters only human messages
                    if (parsed.type === 'human') {
                        return {
                            id: msg.id.toString(),
                            role: 'user',
                            content: parsed.content || '',
                            createdAt: msg.createdAt,
                        };
                    }
                    
                    //  Filters only ai messages that not have tool_calls or tool_calls is empty array
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
                    
                    // Skip tool messages and ai messages that have tool_calls
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