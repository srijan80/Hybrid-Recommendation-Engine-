"use client";
import { Sparkles, User, MessageSquare, Search } from "lucide-react";
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
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      setChatHistory(data.chatHistory || []);
      setResourceHistory(data.resourceHistory || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
    setIsLoading(false);
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
    <nav className="bg-gray-200 border-r shadow-sm w-56 min-h-screen flex flex-col  justify-between p-4 sticky left-0 top-0">
      <div
        onClick={() => router.refresh()}
        className="flex items-center gap-2 px-3 py-3 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <Sparkles className="w-6 h-6 text-blue-500" />
        <span className="text-lg font-bold text-gray-800">HRE</span>
        <div className="ml-auto">
          <SignedOut>
            <Link
              href="/sign-in"
              className="block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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

      {/* Tabs + Search */}
      <div className="flex flex-col  flex-1 mt-4">
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
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 text-gray-500 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* History List */}
        <div className="flex-1 text-black overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-gray-400 text-sm">Loading...</p>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-2 text-sm rounded-md hover:bg-gray-300 cursor-pointer truncate transition-colors"
                >
                  {item.topic}
                </div>
              ))}
            </div>
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
