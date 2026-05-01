'use client'

import { useState, useEffect, useCallback } from "react";
import { IconPlus, IconUserCircle, IconTrash } from '@tabler/icons-react'

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { redirect } from "next/navigation";

interface ChatHistoryItem {
  sessionId: string;
  preview: string;
  lastCreatedAt: Date;
  messageCount: number;
}

interface ChatAreaProps {
  sessionId: string;
  userId: string;
  initialMessages: UIMessage[];
  onMessageComplete: () => void;
}

function ChatArea({ sessionId, userId, initialMessages, onMessageComplete }: ChatAreaProps) {

  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error, stop,} = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          userId,
          sessionId,
        },
      }),
    }),
    onFinish: () => {
      onMessageComplete();
    },
    onError: (err) => {
      console.error('[Chat] Error:', err);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  // Extract text content from message parts
  const getMessageContent = (message: typeof messages[0]): string => {
    if (!message.parts) return '';
    return message.parts
      .filter(part => part.type === 'text')
      .map(part => (part as { type: 'text'; text: string }).text)
      .join('');
  };

    return(
    <section className='flex flex-col gap-10'>
        <div className='w-200 h-125 bg-white rounded-xl p-5 shadow-lg'>
            {error && (
                <div className="p-2 bg-destructive/10 text-destructive rounded mb-2 text-xs">
                    {error.message || 'เกิดข้อผิดพลาดในการส่งข้อความ'}
                </div>
            )}
            {/*=================================       
                    Messages List
            ====================================*/}
            <div className="h-full flex-1 p-2 mb-2 space-y-2 overflow-y-scroll scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
                {messages.length === 0 && (
                    <p className="text-center py-4 text-sm font-bold">
                        No messages yet. Start a conversation!
                    </p>
                )}
                {messages.map((message) => {
                    const content = getMessageContent(message);
                    return (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-2 rounded-lg ${
                                message.role === 'user'
                                    ? 'bg-muted rounded-br-none'
                                    : 'rounded-bl-none'
                                }`}
                            >
                                <div className="font-semibold mb-1 text-[10px]">
                                {message.role === 'user' ? 'You' : 'Assistant'}
                                </div>
                                <div className="whitespace-pre-wrap text-sm">
                                {content || (
                                    <span className="inline-flex items-center gap-1">
                                    <span className="animate-pulse">.</span>
                                    <span className="animate-pulse delay-100">.</span>
                                    <span className="animate-pulse delay-200">.</span>
                                    </span>
                                )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {/* Status indicator */}
                {status === 'streaming' && (
                    <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className="animate-pulse">.</span>
                    <span>AI is typing...</span>
                    <button onClick={() => stop()} className="hover:underline">
                        Stop
                    </button>
                    </div>
                )}
            </div>
        </div>
        {/* Input Form */}
        <form onSubmit={handleSubmit} className='flex px-3 py-2 justify-between bg-white rounded-xl shadow-lg'>
            <input
            type="text"
            placeholder={`What's in your mind?`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className='w-full focus:outline-none focus:ring-0 border-none'/>
            <button className='bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600'>Send</button>
        </form>
    </section>);
}

function ChatWindow({username, id}: {username: string, id: number}) {

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    let mockData: string[] = [];
    for (let i = 1; i <= 11; i++) {
        mockData[i] = "Chat-History " + i;
    }

    // ============================================================================
    // MAIN COMPONENT
    // ============================================================================

    const [chatHistories, setChatHistories] = useState<ChatHistoryItem[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [loadingSession, setLoadingSession] = useState(false);

    // ============================================================================
    // Initialize on client only (avoid hydration mismatch)
    // ============================================================================
    useEffect(() => {
        setIsClient(true);
        if (!currentSessionId) {
        const newSessionId = crypto.randomUUID?.() || `${Date.now()}`;
        setCurrentSessionId(newSessionId);
        }
    }, [currentSessionId]);

    // ============================================================================
    // FETCH CHAT HISTORIES
    // ============================================================================
    const fetchChatHistories = useCallback(async () => {
        try {
        const res = await fetch('/api/chat-history');
        if (res.ok) {
            const data = await res.json();
            setChatHistories(data);
        }
        } catch (error) {
        console.error('Failed to fetch chat histories:', error);
        }
    }, []);

    useEffect(() => {
        fetchChatHistories();
    }, [fetchChatHistories]);

    // ============================================================================
    // DELETE HISTORY
    // ============================================================================
    const deleteChatHistory = async (sessionId: string) => {
        if (!confirm('Delete this chat history?')) return;

        try {
        const res = await fetch('/api/chat-history', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
        });

        if (res.ok) {
            fetchChatHistories();
            if (sessionId === currentSessionId) {
            createNewSession();
            }
        }
        } catch (error) {
        console.error('Failed to delete chat history:', error);
        }
    };

    // ============================================================================
    // NEW SESSION
    // ============================================================================
    const createNewSession = useCallback(() => {
        const newSessionId = crypto.randomUUID?.() || `${Date.now()}`;
        setInitialMessages([]);
        setCurrentSessionId(newSessionId);
        console.log(newSessionId);   
    }, []);

    // ============================================================================
    // LOAD SESSION
    // ============================================================================
    const loadSession = useCallback(async (sessionId: string) => {
        if (sessionId === currentSessionId) return;

        try {
        setLoadingSession(true);
        const res = await fetch(`/api/chat-history/${sessionId}`);

        if (res.ok) {
            const historyMessages = await res.json();

            const formattedMessages: UIMessage[] = historyMessages.map((msg: {
            id: string;
            role: string;
            content: string;
            createdAt?: string;
            created_at?: string
            }) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            parts: [{ type: 'text' as const, text: msg.content }],
            createdAt: new Date(msg.createdAt || msg.created_at || Date.now()),
            }));

            setInitialMessages(formattedMessages);
            setCurrentSessionId(sessionId);
        }
        } catch (error) {
        console.error('[Chat] Failed to load session:', error);
        } finally {
        setLoadingSession(false);
        }
    }, [currentSessionId]);

    // ============================================================================
    // LOGOUT ACCOUT
    // ============================================================================
    const handleLogout = () => {
        fetch('/api/auth/logout', {
            method: 'POST'
        });
        redirect('/login');
    }

  return (
    <>
    <div className='h-screen bg-gray-100 flex justify-evenly items-center'>
        {/*=====================================
                Sidebar - Chat History & Account
        ========================================*/}
        <section className='flex items-center h-155 w-75 bg-white rounded-xl p-5 shadow-lg'>
            <div className='w-full'>
                <header className='border-b-1 pb-4 border-gray-300'>
                    <h1 className='text-2xl font-bold mb-5'>CHAT AI</h1>
                    <div className='flex justify-center'>
                        <button 
                        className='flex justify-center gap-3 bg-blue-500 text-white font-bold px-15 py-3 rounded-3xl cursor-pointer hover:bg-blue-600'
                        onClick={createNewSession}
                        >
                            <IconPlus></IconPlus>
                            New chat
                        </button>
                    </div>
                </header>
                <div className={`h-100 ${mockData.length >= 12 ? 'overflow-y-scroll scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100' : ''}`}>
                {chatHistories.map((history, index) => (
                    <>
                    <div key={index}>
                        <button 
                        className={`w-full flex justify-between gap-10 items-center px-3 py-2 cursor-pointer hover:bg-gray-100 hover:text-blue-600
                            ${selectedIndex === index
                            ? "bg-gray-100 text-blue-600"
                            : "hover:bg-gray-100 hover:text-blue-600"}
                            `}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => {
                            setSelectedIndex(index);
                            loadSession(history.sessionId);
                        }}
                        >
                            <span>{history.preview || "New Chat"}</span>
                            {hoveredIndex === index && (
                                <IconTrash onClick={(e) => {e.stopPropagation(); deleteChatHistory(history.sessionId)}} size={20} className=" text-gray-400 hover:text-red-500" />
                            )}
                        </button>
                    </div>
                    </>
                ))}
                </div>
                <div className='w-full border-t-1 flex justify-evenly pt-4 border-gray-300'>
                    <div className='flex items-center gap-2'>
                        <IconUserCircle></IconUserCircle>
                        <p>{username}</p>
                    </div>
                    <button onClick={handleLogout} className='bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-600'>Log out</button>
                </div>
            </div>
        </section>
        {/*======================================
                    Main Chat Area
        ========================================*/}
       {!isClient || !currentSessionId || loadingSession ? (
        <div className="flex items-center justify-center w-200">
            <span className="text-muted-foreground">
            {loadingSession ? 'Loading session...' : 'Initializing...'}
            </span>
        </div>
        ) : (
        <ChatArea
            key={currentSessionId}
            sessionId={currentSessionId}
            userId={id.toString()}
            initialMessages={initialMessages}
            onMessageComplete={() => {
            setTimeout(() => fetchChatHistories(), 1000);
            }}
        />
        )}
    </div>
    </>
  )
}

export default ChatWindow