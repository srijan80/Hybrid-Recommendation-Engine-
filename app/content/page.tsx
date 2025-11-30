"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import  {Resource} from "./resource";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resourceMode, setResourceMode] = useState(false);
  const [resourcesData, setResourcesData] = useState<ResourceSection[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Parse AI response for resources when in resource mode
  const parseResourceResponse = (content: string, isResourceMode: boolean): { text: string; resources: ResourceData | null } => {
    if (!isResourceMode) {
      return { text: content, resources: null };
    }

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      
      if (parsed.overview && parsed.resources) {
        return {
          text: parsed.overview,
          resources: {
            overview: parsed.overview,
            resources: parsed.resources
          }
        };
      }
    } catch (e) {
      // If JSON parsing fails, return as regular text
      console.log("Not JSON format, displaying as text");
    }

    return { text: content, resources: null };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          topic: userMessage,
          resourceMode: resourceMode 
        }),
      });

      const data = await res.json();

      // Store resources if in resource mode
      if (data.resources && Array.isArray(data.resources)) {
        setResourcesData(data.resources);
      }

      if (data.success) {
        const { text, resources } = parseResourceResponse(data.aiResponse, data.isResourceMode);
        
        // Add AI response with parsed resources
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: text,
            resources: resources || undefined,
            isResourceMode: data.isResourceMode
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      }
    } catch (e) {
      console.error("Error:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to get response. Please try again.",
        },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {messages.length === 0 && !resourceMode ? (
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
          ) : resourceMode ? (
            // Resource Mode - Show Resource Cards (persist even with messages)
            <div className="w-full px-4">
              {resourcesData && resourcesData.length > 0 ? (
                <div className="space-y-8">
                  <Resource data={resourcesData || undefined} />

                  {messages.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-300">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Search History</h3>
                      <div className="space-y-4">
                        {messages.map((msg, idx) => (
                          <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600"><strong>You:</strong> {msg.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-20">
                  <p className="text-gray-500 text-lg">Ask me about any topic to get resources</p>
                  <p className="text-gray-400 text-sm mt-2">e.g., "resources to learn Python" or "C++ courses"</p>
                </div>
              )}
            </div>
          ) : (
            // Messages
            <div className="space-y-8 pb-4">
              {messages.map((message, index) => (
                <div key={index}>
                  {/* Message Bubble */}
                  <div
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
                        message.isResourceMode && message.resources ? (
                          // Resource mode: Show overview text
                          <div className="text-gray-700 leading-relaxed">
                            <p className="text-base font-medium">{message.content}</p>
                          </div>
                        ) : (
                          // Chat mode: Show markdown formatted response
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
                        )
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

                  {/* Resource Cards - Only show if resources exist */}
                  {message.resources && message.resources.resources && message.resources.resources.length > 0 && (
                    <div className="mt-6 ml-14 space-y-8">
                      {message.resources.resources.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-2xl">
                              {section.type.toLowerCase().includes('book') ? '📚' : 
                               section.type.toLowerCase().includes('course') ? '🎓' : 
                               section.type.toLowerCase().includes('article') || section.type.toLowerCase().includes('tutorial') ? '📝' : 
                               section.type.toLowerCase().includes('youtube') || section.type.toLowerCase().includes('video') ? '🎥' : 
                               section.type.toLowerCase().includes('roadmap') ? '🗺️' : 
                               section.type.toLowerCase().includes('tool') || section.type.toLowerCase().includes('platform') ? '🛠️' : '💡'}
                            </span>
                            {section.type}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {section.items.map((item, itemIndex) => (
                              <a
                                key={itemIndex}
                                href={item.link || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative p-5 rounded-xl overflow-hidden group cursor-pointer 
                                           bg-white border border-gray-200 shadow-sm hover:shadow-lg 
                                           transition-all duration-300 transform hover:-translate-y-1"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity"></div>
                                <div className="relative z-10">
                                  <h4 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                                  )}
                                  <div className="flex items-center text-indigo-600 text-sm font-medium">
                                    <span>Visit</span>
                                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
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
        </div>
      </div>

      {/* Input Box - Fixed at Bottom */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white border-t border-gray-200 px-4 py-4 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          {/* Resource Mode Toggle - Enhanced UI */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-md border border-gray-200">
              <span className={`text-sm font-semibold transition-colors ${!resourceMode ? 'text-blue-600' : 'text-gray-400'}`}>
                💬 Chat
              </span>
              <button
                onClick={() => setResourceMode(!resourceMode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  resourceMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    resourceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold transition-colors ${resourceMode ? 'text-blue-600' : 'text-gray-400'}`}>
                📚 Resources
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
                placeholder="Ask me anything... (Shift+Enter for new line)"
                rows={1}
                className="w-full resize-none rounded-xl border-2 border-gray-300 px-5 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:border-gray-400"
                style={{ maxHeight: "200px" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
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