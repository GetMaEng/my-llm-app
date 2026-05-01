import { ChatOllama } from "@langchain/ollama"
import { createUIMessageStreamResponse, UIMessage } from "ai"
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createAgent, BaseMessage, AIMessage } from "langchain";
import { NextRequest } from "next/server"

import { PostgresChatMessageHistory } from "@langchain/community/stores/message/postgres";
import pg from "pg";
import { pool } from "@/src/db";
import { getServerUser } from "@/src/lib/auth/server";

const llm = new ChatOllama({
    model: "scb10x/typhoon2.5-qwen3-4b:latest",
    temperature: 0.2,
    maxRetries: 2,
})

// CHAT HISTORY (PostgresSQL)
class UserAwarePostgresChatMessageHistory extends PostgresChatMessageHistory {
  private userId: string;
  private pgPool: pg.Pool;
  private _sessionId: string;

  constructor(config: { sessionId: string; userId: string; tableName: string; pool: pg.Pool }) {
    super({
      sessionId: config.sessionId,
      tableName: config.tableName,
      pool: config.pool,
    });
    this.userId = config.userId;
    this.pgPool = config.pool;
    this._sessionId = config.sessionId;
  }

  /**
   * Override addMessage เพื่อเพิ่ม user_id ลงใน record
   */
  async addMessage(message: BaseMessage): Promise<void> {
    await super.addMessage(message);
    try {
      await this.pgPool.query(
        `UPDATE langchain_chat_histories
         SET user_id = $1
         WHERE id = (
             SELECT id FROM langchain_chat_histories
             WHERE session_id = $2
             ORDER BY created_at DESC
             LIMIT 1
         )`,
        [this.userId, this._sessionId]
      );
    } catch (error) {
      console.error('[History] Failed to update user_id:', error);
    }
  }
}

// สร้าง Chat history instance
function getHistory(sessionId: string, userId: string) {
    return new UserAwarePostgresChatMessageHistory({
        sessionId: sessionId,
        userId: userId,
        tableName: 'langchain_chat_histories',
        pool: pool
    });
}

// http://localhost:3000/api/chat

export async function POST(req: NextRequest) {
    // const { messages } : { messages: UIMessage[] } = await req.json();

    const currentUser = await getServerUser();

    const { messages, sessionId: bodySessionId, userId: bodyUserId }: {messages: UIMessage[], sessionId: string, userId: string} = await req.json();
    const userId = currentUser ? currentUser.id.toString() : bodyUserId;
    const sessionId = bodySessionId;

    const agent = createAgent({
        model: llm,
    })

    // Load Chat History
    const historyStore = getHistory(sessionId, userId);
    const chatHistory = await historyStore.getMessages();

    // Convert AI SDK UIMessages to LangChain messages
    //const langchainMessages = await toBaseMessages(messages);

    // บันทึกเฉพาะข้อความล่าสุดของผู้ใช้ เพื่อไม่ให้ history ซ้ำ
    const lastUserUiMessage = [...messages].reverse().find((message) => message.role === 'user');
    const [lastUserMessage] = lastUserUiMessage ? await toBaseMessages([lastUserUiMessage]) : [];
    if (lastUserMessage) {
        await historyStore.addMessage(lastUserMessage);
    }

    // ใช้ history จาก DB + ข้อความล่าสุดของผู้ใช้เป็น context ก่อนส่งให้กับ Agent
    const allMessages = lastUserMessage ? [...chatHistory, lastUserMessage] : chatHistory;

    const result = agent.streamEvents(
        {
            messages: allMessages,
        },
    );

    let fullContent = '';
    const uiStream = toUIMessageStream(result, {
        onText(text) {
            fullContent += text;
        },
        onFinal: async() => {
            // Bring AI's answer insert into History table
            if (fullContent) {
                const aiMessage = new AIMessage({ content: fullContent });
                await historyStore.addMessage(aiMessage);
            }
        },
    });

    // Convert the LangChain stream to UI message stream
    // return createUIMessageStreamResponse({
    //     stream: toUIMessageStream(result),
    // });

    return createUIMessageStreamResponse({
        stream: uiStream,
    });
}

