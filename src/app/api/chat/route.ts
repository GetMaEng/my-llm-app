import { ChatOllama } from "@langchain/ollama"
import { createUIMessageStreamResponse, UIMessage } from "ai"
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createAgent } from "langchain";
import { NextRequest } from "next/server"

const llm = new ChatOllama({
    model: "scb10x/typhoon2.5-qwen3-4b:latest",
    temperature: 0.2,
    maxRetries: 2,
})

// http://localhost:3000/api/chat

export async function POST(req: NextRequest) {
    const { messages } : { messages: UIMessage[] } = await req.json();

    const agent = createAgent({
        model: llm,
    })

    // Convert AI SDK UIMessages to LangChain messages
    const langchainMessages = await toBaseMessages(messages);

    const result = agent.streamEvents(
        {
            messages: langchainMessages,
        },
    );

    // Convert the LangChain stream to UI message stream
    return createUIMessageStreamResponse({
        stream: toUIMessageStream(result),
    });
}

