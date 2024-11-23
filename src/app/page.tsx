"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import type { Message } from "@/types/chat";
import { Sidebar } from "@/components/chat/sidebar";
import { nanoid } from "nanoid";
import { FormattedResponse } from "@/components/formatted-response";
import { MicButton } from "@/components/mic-button";

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("chats");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0 && !activeChat) {
        setActiveChat(parsedChats[0].id);
      }
    }
  }, []);

  // Save chats to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: nanoid(),
      title: "New Chat",
      messages: [],
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChat(newChat.id);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (activeChat === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      setActiveChat(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const currentChat = chats.find((chat) => chat.id === activeChat);

  const handleSubmit = async () => {
    if (!message.trim() || isLoading || !activeChat) return;

    setIsLoading(true);
    const updatedMessages: Message[] = [
      ...(chats.find((chat) => chat.id === activeChat)?.messages || []),
      { role: "user" as const, content: message.trim() },
    ];

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const aiResponse = await response.text();

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === activeChat) {
            const updatedChat = {
              ...chat,
              messages: [
                ...updatedMessages,
                { role: "assistant" as const, content: aiResponse },
              ],
            };

            if (chat.title === "New Chat" && updatedMessages.length === 1) {
              updatedChat.title =
                updatedMessages[0].content.slice(0, 30) + "...";
            }

            return updatedChat;
          }
          return chat;
        })
      );
    } catch {
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };

  const handleTranscription = (text: string) => {
    setMessage(text);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={setActiveChat}
        onDeleteChat={handleDeleteChat}
      />

      <main className="flex-1 flex flex-col">
        <div className="border-b border-[#1f1f1f] h-14 flex items-center px-4 bg-[#111111]">
          <h1 className="text-lg font-semibold text-zinc-200">
            {currentChat?.title || "New Chat"}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a] scrollbar-thin scrollbar-thumb-[#1f1f1f] scrollbar-track-transparent">
          <div className="max-w-4xl mx-auto space-y-8">
            {!currentChat || currentChat.messages.length === 0 ? (
              <div className="text-center mt-8 space-y-4">
                <h2 className="text-3xl font-semibold text-zinc-300 tracking-tight">
                  Welcome to Gemini AI
                </h2>
                <p className="text-zinc-500 max-w-md mx-auto">
                  Start your conversation with advanced AI. Ask questions, seek
                  advice, or explore new ideas together.
                </p>
              </div>
            ) : (
              currentChat.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } mb-4`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${msg.role === "user" ? "bg-blue-600" : "bg-emerald-600"}
                    `}
                    >
                      {msg.role === "user" ? "Y" : "G"}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`
                      rounded-2xl px-4 py-2 
                      ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-[#1e1e1e] text-zinc-200"
                      }
                    `}
                    >
                      {/* Message Content */}
                      <div className="text-sm">
                        {msg.role === "user" ? (
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        ) : (
                          <FormattedResponse content={msg.content} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-4 text-zinc-400 bg-[#111111] px-6 py-3 rounded-full">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm">Generating response...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-[#1f1f1f] p-4 bg-[#111111]">
          <div className="max-w-4xl mx-auto relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Message Gemini..."
              className="min-h-[60px] max-h-[200px] pr-24 resize-none 
                bg-[#1a1a1a] border-[#2a2a2a] rounded-xl
                text-zinc-200 placeholder:text-zinc-500
                focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:ring-offset-0
                transition-all duration-200"
              disabled={isLoading || !activeChat}
            />
            <div className="absolute right-2 bottom-2 flex gap-2">
              <MicButton
                onTranscription={handleTranscription}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                lastResponse={
                  currentChat?.messages[currentChat.messages.length - 1]
                    ?.role === "assistant"
                    ? currentChat.messages[currentChat.messages.length - 1]
                        .content
                    : undefined
                }
              />
              <Button
                size="icon"
                className={`
                  h-8 w-8 rounded-lg
                  ${
                    isLoading || !message.trim() || !activeChat
                      ? "bg-zinc-700 opacity-50"
                      : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
                  }
                  transition-all duration-200 shadow-lg
                `}
                onClick={handleSubmit}
                disabled={isLoading || !message.trim() || !activeChat}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4 text-zinc-200" />
                )}
              </Button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-xs text-center text-zinc-500">
            Press Enter to send • Shift + Enter for new line • Click mic to
            record
          </div>
        </div>
      </main>
    </div>
  );
}
