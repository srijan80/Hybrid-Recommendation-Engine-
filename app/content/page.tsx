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

interface ResourceSection {
  type: string;
  items: any[];
}

export default function ContentPage() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [resourcesData, setResourcesData] = useState<ResourceSection[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resourceMode, setResourceMode] = useState(false);
  const [hasLoadedFromHistory, setHasLoadedFromHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Load conversation from history (continue feature)
  useEffect(() => {
    const continueType = searchParams.get("continue");
    const continueId = searchParams.get("id");

    if (continueType && continueId) {
      // Fetch the history item
      fetch(`/api/history/${continueId}?type=${continueType}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.item) {
            if (continueType === "chat") {
              // Load chat conversation
              setChatMessages([
                { role: "user", content: data.item.query },
                { role: "assistant", content: data.item.response },
              ]);
              setResourceMode(false);
            } else if (continueType === "resources") {
              // Load resource search
              setResourcesData(data.item.resources || []);
              setResourceMode(true);
            }
          }
        })
        .catch((error) => {
          console.error("Failed to load conversation:", error);
        })
        .finally(() => {
          // Clean up URL params
          window.history.replaceState({}, document.title, window.location.pathname);
          setHasLoadedFromHistory(true);
        });
    } else {
      // If no continue data, ensure we start fresh (only if not loaded from history)
      if (!hasLoadedFromHistory) {
        setChatMessages([]);
        setResourcesData(null);
      }
    }
  }, [searchParams]);

  // Handle new chat (reset everything)
  const handleNewChat = () => {
    setChatMessages([]);
    setResourcesData(null);
    setInput("");
    setHasLoadedFromHistory(false);
    localStorage.removeItem("continueConversation");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    if (!resourceMode) {
      // Add user message to chat
      setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: userMessage,
          resourceMode: resourceMode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (resourceMode) {
          // Resources mode
          if (data.resources && Array.isArray(data.resources)) {
            setResourcesData(data.resources);
          }
        } else {
          // Chat mode
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.aiResponse },
          ]);
        }

        // Trigger history refresh after successful save
        // This tells the navbar to reload history
        window.dispatchEvent(new Event("historyUpdated"));
      } else {
        if (!resourceMode) {
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sorry, something went wrong. Please try again." },
          ]);
        }
      }
    } catch (e) {
      console.error("Error:", e);
      if (!resourceMode) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Failed to get response. Please try again." },
        ]);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Mobile/Tablet Header - Hidden on lg screens */}
      <div className="lg:hidden bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-gray-800">HRE</span>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-8 h-8 border-2 border-blue-600 rounded-full shadow-sm",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          {!resourceMode && chatMessages.length === 0 ? (
            // Empty State - Chat Mode
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-20">
              <div className="mb-8">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Sparkles className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                  What do you want to learn?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Ask me anything and I'll provide comprehensive explanations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full mt-10">
                {["What is machine learning?", "Explain React hooks", "Teach me Python basics", "How does blockchain work?"].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="p-2.5 sm:p-3 md:p-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all text-left text-sm font-medium text-gray-700"
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : resourceMode ? (
            // Resource Mode - Show Cards
            <div className="w-full px-4">
              {resourcesData && resourcesData.length > 0 ? (
  <Resource data={resourcesData} />
) : (
  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-20">
    <Sparkles className="w-20 h-20 text-red-600 mx-auto mb-4" />
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Find Learning Resources</h2>
    <p className="text-sm sm:text-base md:text-lg text-gray-600">Search for any topic to get curated resources</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full mt-10">
      {[
        "Learn machine learning",
        "React tutorials",
        "Java basics",
        "Best articles to understand blockchain"
      ].map((prompt) => (
        <button
          key={prompt}
          onClick={() => setInput(prompt)}
          className="p-2.5 sm:p-3 md:p-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-red-400 hover:bg-red-50 hover:shadow-md transition-all text-left text-sm font-medium text-gray-700"
        >
          🔎 {prompt}
        </button>
      ))}
    </div>
  </div>
)}


              {isLoading && (
                <div className="flex justify-center items-center py-20">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" />
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Chat Messages
            <div className="space-y-8 pb-4">
              {chatMessages.map((message, index) => (
                <div key={index} className={`flex gap-2 sm:gap-3 md:gap-4 px-2 sm:px-0 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                      <Bot className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                    </div>
                  )}

                  <div className={`max-w-3xl ${message.role === "user" ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-md" : "bg-white border border-gray-300 rounded-2xl rounded-tl-sm px-6 py-4 shadow-md"}`}>
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none text-gray-900">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || "");
                              return !inline && match ? (
                                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-lg my-4" {...props}>
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed font-medium">{message.content}</div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center shadow-md">
                      <User className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 sm:gap-3 md:gap-4 justify-start px-2 sm:px-0">
                  <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                    <Bot className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-300 rounded-2xl px-6 py-4 shadow-md">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Box */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-md border">
              <span className={`text-sm font-semibold ${!resourceMode ? "text-blue-600" : "text-gray-400"}`}>💬 Chat</span>
              <button
                onClick={() => setResourceMode(!resourceMode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${resourceMode ? "bg-gradient-to-r from-red-600 to-purple-600" : "bg-gradient-to-r from-blue-600 to-purple-600"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${resourceMode ? "translate-x-5 sm:translate-x-6" : "translate-x-0.5 sm:translate-x-1"}`} />
              </button>
              <span className={`text-sm font-semibold ${resourceMode ? "text-red-600" : "text-gray-400"}`}>🎥 Resources</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={resourceMode ? "Search for learning resources..." : "Ask me anything..."}
              rows={1}
              className="w-full resize-none rounded-xl border-2 border-gray-300 px-5 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              style={{ maxHeight: "200px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 bottom-2 p-2.5 ${resourceMode ? "bg-red-600" : "bg-blue-600"} text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all`}
            >
              <Send className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}