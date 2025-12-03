"use client";
import React from "react";
import {
  Play,
  List,
  BookOpen,
  Github,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

export interface ResourceItem {
  title: string;
  description?: string;
  link?: string;
  channel?: string; // For YouTube or GitHub owner or author
  stars?: number; // For GitHub repos
}

export interface ResourceType {
  type: string;
  items: ResourceItem[];
}

export type ResourceProps = {
  data?: ResourceType[];
};

export const Resource: React.FC<ResourceProps> = ({ data }) => {
  const display = data && data.length ? data : [];

  // Determine icon for resource type
  const getIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("playlist")) return <List className="w-5 h-5" />;
    if (lower.includes("book")) return <BookOpen className="w-5 h-5" />;
    if (lower.includes("github")) return <Github className="w-5 h-5" />;
    if (lower.includes("stackoverflow") || lower.includes("qa"))
      return <MessageSquare className="w-5 h-5" />;
    return <Play className="w-5 h-5" />; // default video
  };

  // Badge color by type
  const getBadgeColor = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("playlist")) return "bg-purple-600";
    if (lower.includes("book")) return "bg-green-600";
    if (lower.includes("github")) return "bg-gray-800";
    if (lower.includes("stackoverflow") || lower.includes("qa"))
      return "bg-yellow-600";
    return "bg-red-600"; // default video
  };

  return (
    <div className="w-full space-y-10 py-6">
      {display.map((resource) => (
        <div key={resource.type}>
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`${getBadgeColor(resource.type)} p-2 rounded-lg`}>
              {getIcon(resource.type)}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {resource.type}
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resource.items.map((item, index) => (
              <a
                key={index}
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                {/* Thumbnail / Icon Area */}
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 aspect-video flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="relative z-10 bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    {getIcon(resource.type)}
                  </div>
                  {/* Removed specific video/playlist badge from here, as it's handled by the resource type */}
                </div>

                {/* Content */}
                <div className="p-4">
                  {item.channel && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {item.channel.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {item.channel}
                      </span>
                    </div>
                  )}

                  <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {item.description}
                    </p>
                  )}

                  {item.link && (
                    <div className="flex items-center gap-2 text-red-600 text-sm font-semibold group-hover:gap-3 transition-all">
                      <span>
                        {resource.type.toLowerCase().includes("book")
                          ? "Read/Buy"
                          : resource.type.toLowerCase().includes("github")
                          ? "View Repository" // This should appear for GitHub repos
                          : resource.type
                              .toLowerCase()
                              .includes("stackoverflow") ||
                            resource.type.toLowerCase().includes("qa")
                          ? "View Thread"
                          : "Open"}
                      </span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ResourceList = ({ data }: { data?: ResourceType[] }) => {
  return <Resource data={data} />;
};
