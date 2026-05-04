# Basic Chat

Minimal flow to build a basic chat application using LangChain and the Vercel AI SDK.

---

## 1. Create API Route (Backend Logic)

Create file: `app/api/chat/route.ts`

### Basic using LangChain + AI SDK

```TypeScript
import { createAgent } from "langchain";
import { ChatOllama } from "@langchain/ollama"
import { createUIMessageStreamResponse, UIMessage } from "ai"
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { NextRequest } from "next/server"

const llm = new ChatOllama({
    model: "scb10x/typhoon2.5-qwen3-4b:latest", // Your model
    temperature: 0.2,
    maxRetries: 2,
})

export async function POST(req: Request) {

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
```

flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Result]
    B -->|No| D[Retry]
    D -.-> A
