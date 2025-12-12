"use client";
import React from "react";
import {
  Play,
  List,
  BookOpen,
  Github,
  MessageSquare,
  ExternalLink,
  FileText,
  Star,
} from "lucide-react";

export interface ResourceItem {
  title: string;
  description?: string;
  link?: string;
  channel?: string;
  stars?: number;
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

  // Get icon for resource type
  const getIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("playlist")) return <List className="w-4 sm:w-5 h-4 sm:h-5 text-white" />;
    if (lower.includes("book")) return <BookOpen className="w-4 sm:w-5 h-4 sm:h-5 text-white" />;
    if (lower.includes("github")) return <Github className="w-4 sm:w-5 h-4 sm:h-5 text-white" />;
    if (lower.includes("documentation") || lower.includes("docs")) return <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-white" />;
    if (lower.includes("stackoverflow") || lower.includes("question")) return <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5 text-white" />;
    return <Play className="w-4 sm:w-5 h-4 sm:h-5 text-white" />;
  };

  // Get gradient colors for thumbnail based on type
  const getThumbnailGradient = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("playlist")) return "from-purple-600 to-purple-800";
    if (lower.includes("book")) return "from-green-600 to-green-800";
    if (lower.includes("github")) return "from-gray-700 to-gray-900";
    if (lower.includes("documentation")) return "from-blue-600 to-blue-800";
    if (lower.includes("stackoverflow") || lower.includes("question")) return "from-orange-500 to-orange-700";
    return "from-red-600 to-red-800"; // videos
  };

  // Get icon background color
  const getIconBg = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("playlist")) return "bg-purple-600";
    if (lower.includes("book")) return "bg-green-600";
    if (lower.includes("github")) return "bg-gray-800";
    if (lower.includes("documentation")) return "bg-blue-600";
    if (lower.includes("stackoverflow") || lower.includes("question")) return "bg-orange-600";
    return "bg-red-600";
  };

  // Get hover color
  const getHoverColor = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("playlist")) return "group-hover:text-purple-600";
    if (lower.includes("book")) return "group-hover:text-green-600";
    if (lower.includes("github")) return "group-hover:text-gray-800";
    if (lower.includes("documentation")) return "group-hover:text-blue-600";
    if (lower.includes("stackoverflow") || lower.includes("question")) return "group-hover:text-orange-600";
    return "group-hover:text-red-600";
  };

  // Get button text
  const getButtonText = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("book")) return "View Book";
    if (lower.includes("github")) return "View Repo";
    if (lower.includes("documentation")) return "Read Docs";
    if (lower.includes("stackoverflow") || lower.includes("question")) return "View Thread";
    if (lower.includes("playlist")) return "Watch Playlist";
    return "Watch Now";
  };

  // Get badge text color
  const getBadgeTextColor = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("playlist")) return "text-purple-600";
    if (lower.includes("book")) return "text-green-600";
    if (lower.includes("github")) return "text-gray-800";
    if (lower.includes("documentation")) return "text-blue-600";
    if (lower.includes("stackoverflow") || lower.includes("question")) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 md:space-y-12 py-4 sm:py-6">
      {display.map((resource, resourceIndex) => (
        <div key={`${resource.type}-${resourceIndex}`}>
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`${getIconBg(resource.type)} p-1.5 sm:p-2.5 rounded-lg shadow-md`}>
              {getIcon(resource.type)}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {resource.type}
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              ({resource.items.length} {resource.items.length === 1 ? 'resource' : 'resources'})
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {resource.items.map((item, index) => (
              <a
                key={`${item.title}-${index}`}
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
              >
                {/* Thumbnail Area - Different gradient per type */}
                <div className={`relative bg-gradient-to-br ${getThumbnailGradient(resource.type)} aspect-video flex items-center justify-center overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  
                  {/* Icon with scale animation */}
                  <div className={`relative z-10 ${getIconBg(resource.type)} rounded-full p-4 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                    {getIcon(resource.type)}
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-semibold">
                    {resource.type.toLowerCase().includes("video") ? "Video" :
                     resource.type.toLowerCase().includes("playlist") ? "Playlist" :
                     resource.type.toLowerCase().includes("book") ? "Book" :
                     resource.type.toLowerCase().includes("github") ? "Repository" :
                     resource.type.toLowerCase().includes("doc") ? "Documentation" :
                     resource.type.toLowerCase().includes("question") ? "Q&A" : "Resource"}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5">
                  {/* Channel/Author with colored avatar */}
                  {item.channel && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-full ${getIconBg(resource.type)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                        {item.channel.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-600 font-medium truncate">
                        {item.channel}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className={`text-base font-bold text-gray-900 mb-2 line-clamp-2 transition-colors ${getHoverColor(resource.type)}`}>
                    {item.title}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Action Button */}
                  <div className={`flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all ${getBadgeTextColor(resource.type)}`}>
                    <span>{getButtonText(resource.type)}</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {display.length === 0 && (
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg">No resources found</div>
          <p className="text-gray-500 text-sm mt-2">Try searching for a different topic</p>
        </div>
      )}
    </div>
  );
};

export const ResourceList = ({ data }: { data?: ResourceType[] }) => {
  return <Resource data={data} />;
};