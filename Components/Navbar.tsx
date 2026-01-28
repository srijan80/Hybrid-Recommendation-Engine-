"use client";
import {
  Sparkles,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";


interface ChatItem {
  id: string;
  topic: string;
  query: string;
  response: string;
  createdAt: string;
}

interface ResourceItem {
  id: string;
  topic: string;
  query: string;
  resources: any;
  createdAt: string;
}

export default function Navbar() {
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [resourceHistory, setResourceHistory] = useState<ResourceItem[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "resources">("chat");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchHistory();

    // Listen for history updates from content page
    const handleHistoryUpdate = () => {
      console.log("History update event received");
      fetchHistory();
    };

    window.addEventListener("historyUpdated", handleHistoryUpdate);

    return () => {
      window.removeEventListener("historyUpdated", handleHistoryUpdate);
    };
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/history");
      if (!response.ok) {
        console.error("Failed to fetch history:", response.status);
        setChatHistory([]);
        setResourceHistory([]);
        return;
      }
      const data = await response.json();
      setChatHistory(data.chatHistory || []);
      const resourceData = (data.resourceHistory || []).map((item: any) => ({ ...item, topic: item.title }));
      setResourceHistory(resourceData);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setChatHistory([]);
      setResourceHistory([]);
    }
    setIsLoading(false);
  };


  
  // Delete history item
  const handleDelete = async (id: string, type: "chat" | "resources") => {
    if (!confirm("Delete this item?")) return;

    try {
      const response = await fetch(`/api/history/${id}?type=${type}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (type === "chat") {
          setChatHistory(chatHistory.filter((item) => item.id !== id));
        } else {
          setResourceHistory(resourceHistory.filter((item) => item.id !== id));
        }
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete item");
    }
  };

  // Continue conversation (load into main chat)
  const handleContinue = async (id: string, type: "chat" | "resources") => {
    // Navigate to content page with continue params
    router.push(`/content?continue=${type}&id=${id}`);
  };

  // Edit topic name
  const handleEdit = (id: string, currentTopic: string) => {
    setEditingId(id);
    setEditValue(currentTopic);
    setOpenMenuId(null);
  };

  const saveEdit = async (id: string, type: "chat" | "resources") => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: editValue, type }),
      });

      if (response.ok) {
        // Update local state
        if (type === "chat") {
          setChatHistory(
            chatHistory.map((item) =>
              item.id === id ? { ...item, topic: editValue } : item
            )
          );
        } else {
          setResourceHistory(
            resourceHistory.map((item) =>
              item.id === id ? { ...item, topic: editValue } : item
            )
          );
        }
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update:", error);
      alert("Failed to update topic");
    }
  };

  // Filter items
  const filteredItems =
    activeTab === "chat"
      ? chatHistory.filter((item) =>
          item.topic.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : resourceHistory.filter((item) =>
          item.topic.toLowerCase().includes(searchQuery.toLowerCase())
        );

  return (
    <nav className="bg-gray-200 border-r shadow-sm w-64 min-h-screen flex flex-col justify-between p-4 sticky left-0 top-0">
      <div>
        <div
          onClick={() => router.push("/content")}
          className="flex items-center gap-2 px-3 py-3 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors mb-4"
        >
          <Sparkles className="w-6 h-6 text-blue-500" />
          <span className="text-lg font-bold text-gray-800">HRE</span>
          <div className="ml-auto">
            <SignedOut>
              <Link
                href="/sign-in"
                className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-10 h-10 border-2 border-blue-600 rounded-full shadow-sm",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            localStorage.removeItem("continueConversation");
            window.location.href = "/content";
          }}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2 mb-4"
        >
          <Sparkles className="w-4 h-4" />
          New Chat
        </button>
      </div>
      {/* Tabs + Search */}
      <div className="flex flex-col flex-1 mt-0">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 px-2 py-1 rounded-md text-sm font-medium ${
              activeTab === "chat"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`flex-1 px-2 py-1 rounded-md text-sm font-medium ${
              activeTab === "resources"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Resources
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-2 top-2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 text-gray-500 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* History List */}
        <div className="flex-1 text-black overflow-y-auto space-y-1">
          {isLoading ? (
            <p className="text-center text-gray-400 text-sm py-10">
              Loading...
            </p>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="px-3 py-2 text-sm rounded-md hover:bg-gray-300 transition-colors relative group"
                onClick={() => handleContinue(item.id, activeTab)}
              >
                {editingId === item.id ? (
                  // Edit Mode
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(item.id, activeTab);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => saveEdit(item.id, activeTab)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  // Normal Mode
                  <div className="flex items-center justify-between cursor-pointer">
                    <span className="truncate flex-1">{item.topic}</span>

                    {/* Action Buttons (show on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContinue(item.id, activeTab);
                        }}
                        className="p-1 hover:bg-blue-100 rounded"
                        title="Continue"
                      >
                        <Play className="w-3 h-3 text-blue-600" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item.id, item.topic);
                        }}
                        className="p-1 hover:bg-yellow-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3 text-yellow-600" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id, activeTab);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              {activeTab === "chat" ? (
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto" />
              ) : (
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto" />
              )}
              <p className="text-gray-400 text-sm mt-2">
                No {activeTab} history found
              </p>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
