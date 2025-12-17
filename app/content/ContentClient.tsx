//app/content/ContentClient.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Sparkles, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Link from "next/link";
import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";
import { Resource } from "./resource";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ContentPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "resources">("chat");
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [currentHistoryItem, setCurrentHistoryItem] = useState<any>(null);
  const [hasLoadedFromHistory, setHasLoadedFromHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const continueType = searchParams.get("continue");
    const id = searchParams.get("id");

    if (continueType && id && !hasLoadedFromHistory) {
      loadFromHistory(id, continueType as "chat" | "resources");
    }
  }, [searchParams, hasLoadedFromHistory]);

  const loadFromHistory = async (id: string, type: "chat" | "resources") => {
    try {
      const response = await fetch(`/api/history/${id}?type=${type}`);
      const item = await response.json();

      if (type === "chat") {
        const loadedMessages: Message[] = [];
        if (item.messages) {
          // New format: array of messages
          item.messages.forEach((msg: any) => {
            loadedMessages.push({
              role: msg.role,
              content: msg.content,
            });
          });
        } else if (item.query && item.response) {
          // Legacy format: single query/response
          loadedMessages.push(
            { role: "user", content: item.query },
            { role: "assistant", content: item.response }
          );
        }
        setMessages(loadedMessages);
        setCurrentHistoryId(id);
        setCurrentHistoryItem(item);
      } else {
        // Resources mode
        setMode("resources");
        setCurrentHistoryId(id);
        setCurrentHistoryItem(item);
      }
      setHasLoadedFromHistory(true);
    } catch (error) {
      console.error("Failed to load from history:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          mode,
          historyId: currentHistoryId,
        }),
      });

      const data = await response.json();

      if (mode === "chat") {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
        };
        setMessages([...newMessages, assistantMessage]);
        setCurrentHistoryId(data.historyId);
        setCurrentHistoryItem(data.historyItem);
      } else {
        // Resources mode - switch to resources display
        setMode("resources");
        setCurrentHistoryId(data.historyId);
        setCurrentHistoryItem(data.historyItem);
      }

      // Dispatch history update event
      window.dispatchEvent(new Event("historyUpdated"));
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages([...newMessages, errorMessage]);
    }
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentHistoryId(null);
    setCurrentHistoryItem(null);
    setHasLoadedFromHistory(false);
    setMode("chat");
    localStorage.removeItem("continueConversation");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b shadow-sm p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <span className="text-lg font-bold text-gray-800">HRE</span>
        </Link>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <Link
            href="/sign-in"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Sign In
          </Link>
        </SignedOut>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("chat")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              mode === "chat"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setMode("resources")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              mode === "resources"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Resources
          </button>
        </div>

        {/* Chat/Resources Display */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          {mode === "chat" ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                      Welcome to HRE
                    </h2>
                    <p className="text-gray-500">
                      Ask me anything or get learning resources!
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <Bot className="w-8 h-8 text-blue-500 mt-1" />
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {message.role === "user" && (
                        <User className="w-8 h-8 text-gray-500 mt-1" />
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <Bot className="w-8 h-8 text-blue-500 mt-1" />
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <Resource historyItem={currentHistoryItem} />
          )}
        </div>

        {/* Clear Button */}
        {(messages.length > 0 || currentHistoryId) && (
          <button
            onClick={clearChat}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Clear Chat
          </button>
        )}
      </div>
    </div>
  );
};

export default ContentPage;