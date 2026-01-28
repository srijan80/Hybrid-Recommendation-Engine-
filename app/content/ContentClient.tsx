// app/content/ContentClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, MessageCircle, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from 'next/link';
import { Resource } from './resource';

type Message = { role: 'user' | 'assistant'; content: string };
type ResourceGroup = { type: string; items: any[] };

export default function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [resources, setResources] = useState<ResourceGroup[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'resources'>('chat');
  const [historyId, setHistoryId] = useState<string | null>(null);

  const chatSuggestions = [
    "What is machine learning?",
    "Explain quantum computing",
    "How does blockchain work?",
    "What are microservices?"
  ];

  const resourceSuggestions = [
    "Tutorial for Python",
    "JavaScript basics",
    "Data structures in C++",
    "Web development with React"
  ];

  // 🔁 Load history from URL on mount or param change
  useEffect(() => {
    const id = searchParams.get('id');
    const continueMode = searchParams.get('continue') as 'chat' | 'resources' | null;

    if (!id) {
      // New chat: reset everything
      setMessages([]);
      setResources([]);
      setHistoryId(null);
      setMode('chat');
      return;
    }

    // Load existing history
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/history?id=${id}`);
        const data = await res.json();

        if (continueMode === 'resources' && data.resourceItem) {
          setMode('resources');
          setResources(data.resourceItem.resources || []);
          setMessages([]);
          setHistoryId(id);
        } else if (continueMode === 'chat' && data.conversation) {
          setMode('chat');
          setMessages(data.conversation.messages || []);
          setResources([]);
          setHistoryId(id);
        } else {
          // Fallback: treat as chat
          setMode('chat');
          setMessages(data.conversation?.messages || []);
          setHistoryId(id);
        }
      } catch (err) {
        console.error('Failed to load history from URL:', err);
        // If fail, start fresh
        setMessages([]);
        setResources([]);
        setHistoryId(null);
      }
    };

    loadHistory();
  }, [searchParams]);

  // ✨ Auto-scroll not implemented here, but you can add it later

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSubmit();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // If this is a NEW query (not continuing history), clear previous state
    const isNewQuery = !historyId;
    if (isNewQuery) {
      setMessages([]);
      setResources([]);
    }

    const userMessage: Message = { role: 'user', content: input };
    if (mode === 'chat') {
      setMessages((prev) => [...prev, userMessage]);
    }
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: input,
          resourceMode: mode === 'resources',
          historyId: historyId || undefined, // undefined if new
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (!data) {
        throw new Error('No data returned from API');
      }

      if (mode === 'chat') {
        const aiResponse = data.aiResponse || data.response || 'No response received.';
        setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
        setResources([]);

        // Set history ID without router.push (prevents state reset)
        if (data.item?.id && isNewQuery) {
          setHistoryId(data.item.id);
          // Update URL silently with replace
          window.history.replaceState(
            null,
            '',
            `/content?continue=chat&id=${data.item.id}`
          );
        }
      } else {
        setResources(data.resources || []);
        setMessages([]);

        // Set history ID without router.push (prevents state reset)
        if (data.historyId && isNewQuery) {
          setHistoryId(data.historyId);
          // Update URL silently with replace
          window.history.replaceState(
            null,
            '',
            `/content?continue=resources&id=${data.historyId}`
          );
        }
      }

      // Optional: Notify sidebar to refresh (via custom event)
      window.dispatchEvent(new Event('historyUpdated'));
    } catch (err) {
      console.error('Submit error:', err);
      if (mode === 'chat') {
        setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Failed to get response.' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {mode === 'chat' ? (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !historyId && (
              <div className="text-center mt-20">
                <div className="text-gray-600 mb-8">Type a question to start a new chat!</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {chatSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow duration-200 hover:border-blue-300"
                    >
                      <div className="text-gray-900 font-medium">{suggestion}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-300 text-gray-900'
                      : 'bg-purple-300 text-gray-900'
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      code({ className, children }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded my-1 text-xs"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-gray-800 text-red-300 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-600">Thinking...</div>}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            
            {isLoading ? (
              <p className="text-gray-600">Fetching resources...</p>
            ) : resources.length === 0 && !historyId ? (
              <div className="text-center mt-20">
                <div className="text-gray-600 mb-8">Enter a topic to get learning resources!</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {resourceSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow duration-200 hover:border-purple-300"
                    >
                      <div className="text-gray-900 font-medium">{suggestion}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Resource data={resources} />
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-50">
        {/* Toggle Buttons */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => {
              setMode('chat');
              setResources([]);
              setHistoryId(null);
            }}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
              mode === 'chat'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <MessageCircle size={16} /> Chat
          </button>
          <button
            onClick={() => {
              setMode('resources');
              setMessages([]);
              setHistoryId(null);
            }}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
              mode === 'resources'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <BookOpen size={16} /> Resources
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'chat'
                ? 'Ask anything...'
                : 'Enter a topic to get learning resources...'
            }
            className="flex-1 px-4 py-2 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 rounded-full disabled:opacity-50 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}