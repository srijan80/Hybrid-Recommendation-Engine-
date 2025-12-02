"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Resource } from "./resource";

interface Message {
  role: "user" | "assistant";
  content: string;
  resources?: ResourceData;
  isResourceMode?: boolean;
}

interface ResourceItem {
  title: string;
  description?: string;
  link?: string;
  channel?: string;
}

interface ResourceSection {
  type: string;
  items: ResourceItem[];
}

interface ResourceData {
  overview?: string;
  resources: ResourceSection[];
}

export const Home = () => {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [resourcesData, setResourcesData] = useState<ResourceSection[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resourceMode, setResourceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: userMessage,
          resourceMode: resourceMode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (resourceMode) {
          // RESOURCES MODE: Only update resources, don't add to chat
          if (data.resources && Array.isArray(data.resources)) {
            setResourcesData(data.resources);
          }
        } else {
          // CHAT MODE: Add to chat messages
          setChatMessages((prev) => [
            ...prev,
            { role: "user", content: userMessage },
            {
              role: "assistant",
              content: data.aiResponse,
              isResourceMode: false,
            },
          ]);
        }
      } else {
        if (!resourceMode) {
          setChatMessages((prev) => [
            ...prev,
            { role: "user", content: userMessage },
            {
              role: "assistant",
              content: "Sorry, something went wrong. Please try again.",
            },
          ]);
        }
      }
    } catch (e) {
      console.error("Error:", e);
      if (!resourceMode) {
        setChatMessages((prev) => [
          ...prev,
          { role: "user", content: userMessage },
          {
            role: "assistant",
            content: "Failed to get response. Please try again.",
          },
        ]);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* CHAT MODE */}
          {!resourceMode && (
            <>
              {chatMessages.length === 0 ? (
                // Empty State - Chat Mode
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-20">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">
                      What do you want to learn?
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                      Ask me anything and I'll provide comprehensive, well-structured explanations with examples and real-world applications.
                    </p>
                  </div>

                  {/* Example Prompts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full mt-10">
                    {[
                      "What is machine learning?",
                      "Explain React hooks",
                      "Teach me Python basics",
                      "How does blockchain work?",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all text-left text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        <span className="text-blue-600">💬</span> {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Chat Messages
                <div className="space-y-8 pb-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div
                        className={`max-w-3xl ${
                          message.role === "user"
                            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-md"
                            : "bg-white border border-gray-300 rounded-2xl rounded-tl-sm px-6 py-4 shadow-md"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none text-gray-900 
                            prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-5 prose-headings:mb-3 
                            prose-h2:text-lg prose-h3:text-base 
                            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 
                            prose-strong:text-gray-900 prose-strong:font-semibold 
                            prose-ul:text-gray-700 prose-ul:my-3 prose-ul:ml-4
                            prose-ol:text-gray-700 prose-ol:my-3 prose-ol:ml-4
                            prose-li:text-gray-700 prose-li:my-1
                            prose-code:text-red-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                            prose-blockquote:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic
                            prose-a:text-blue-600 prose-a:hover:underline">
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-lg my-4 !bg-gray-900 !p-4"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code
                                      className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                h2({ children }) {
                                  return <h2 className="text-lg font-bold text-gray-900 mt-5 mb-3 border-b border-gray-200 pb-2">{children}</h2>;
                                },
                                h3({ children }) {
                                  return <h3 className="text-base font-bold text-gray-800 mt-4 mb-2">{children}</h3>;
                                },
                                ul({ children }) {
                                  return <ul className="list-disc list-inside text-gray-700 my-3 space-y-1">{children}</ul>;
                                },
                                ol({ children }) {
                                  return <ol className="list-decimal list-inside text-gray-700 my-3 space-y-1">{children}</ol>;
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {message.content}
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center shadow-md">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white border border-gray-300 rounded-2xl rounded-tl-sm px-6 py-4 shadow-md">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </>
          )}

          {/* RESOURCES MODE */}
          {resourceMode && (
            <div className="w-full px-4">
              {resourcesData && resourcesData.length > 0 ? (
                <Resource data={resourcesData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-20">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">
                      Find Learning Resources
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                      Search for any topic and get curated YouTube videos and playlists
                    </p>
                  </div>

                  {/* Example Prompts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full mt-10">
                    {[
                      "Python programming",
                      "JavaScript tutorial",
                      "Machine Learning",
                      "React development",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 hover:shadow-md transition-all text-left text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        <span className="text-red-600">🎥</span> {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Indicator for Resources */}
              {isLoading && (
                <div className="flex justify-center items-center py-20">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" />
                    <div
                      className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Box - Fixed at Bottom */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white border-t border-gray-200 px-4 py-4 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          {/* Resource Mode Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-md border border-gray-200">
              <span className={`text-sm font-semibold transition-colors ${!resourceMode ? 'text-blue-600' : 'text-gray-400'}`}>
                💬 Chat
              </span>
              <button
                onClick={() => setResourceMode(!resourceMode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  resourceMode ? 'bg-gradient-to-r from-red-600 to-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    resourceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold transition-colors ${resourceMode ? 'text-red-600' : 'text-gray-400'}`}>
                🎥 Resources
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  resourceMode
                    ? "Search for learning resources (e.g., 'Python tutorial')..."
                    : "Ask me anything... (Shift+Enter for new line)"
                }
                rows={1}
                className="w-full resize-none rounded-xl border-2 border-gray-300 px-5 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:border-gray-400"
                style={{ maxHeight: "200px" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 bottom-2 p-2.5 ${
                  resourceMode
                    ? 'bg-gradient-to-r from-red-600 to-red-700'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700'
                } text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95`}
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 text-center mt-3 font-medium">
            💡 Press <span className="bg-gray-200 px-1.5 py-0.5 rounded">Enter</span> to send, <span className="bg-gray-200 px-1.5 py-0.5 rounded">Shift + Enter</span> for new line
          </p>
        </div>
      </div>
    </div>
  );
};