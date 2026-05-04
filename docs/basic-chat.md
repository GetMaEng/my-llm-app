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

### Logic Flow

``` mermaid
    graph TD
        A["Get messages (UI-Message) from Frontend"] -- Convert UI Message to LangChain message --> B["toBaseMessages(messages)"]
        B -- Send to Agent --> C["Agent reads messages and answers"]
        C -- Convert LangChain stream to AI messages stream --> D["Return messages to Frontend"]
```

## 2. Create Frontend UI

Create file: `app/components/chat-window.ts`

```TypeScript
"use client";

import { useChat } from "ai/react";

export default function ChatWIndow() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api: "/api/chat", // connect to your API route
  });

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Chat App</h1>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto border rounded p-3 mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400">Start a conversation...</p>
        )}

        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <span className="font-semibold">
              {m.role === "user" ? "You" : "AI"}:
            </span>{" "}
            {m.content}
          </div>
        ))}

        {isLoading && <p className="text-gray-400">Typing...</p>}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

## 3. Add to Chat Page

Create file: `app/chat-window/page.ts`

```TypeScript
import ChatWindow from "../../components/chat-window";

function page() {
    const user = await getServerUser();

  return (
    <>
    <ChatWindow></ChatWindow>
    </>
  )
}

export default page
```