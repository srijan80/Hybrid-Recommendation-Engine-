//app/content/resource.tsx frontend to showcase resource
"use client";
import React from "react";
import { Play, List, ExternalLink } from "lucide-react";

export interface ResourceItem {
  title: string;
  description?: string;
  link?: string;
  channel?: string;
}

export interface ResourceType {
  type: string;
  items: ResourceItem[];
}

const mockData: ResourceType[] = [
  {
    type: "Top Videos",
    items: [
      { 
        title: "Python Tutorial for Beginners", 
        description: "Complete 6-hour course covering Python fundamentals",
        channel: "Programming with Mosh",
        link: "#" 
      },
      { 
        title: "Learn Python - Full Course", 
        description: "4.5M views • Comprehensive beginner guide",
        channel: "freeCodeCamp",
        link: "#" 
      },
    ],
  },
  {
    type: "Best Playlists",
    items: [
      { 
        title: "Python for Everybody", 
        description: "100+ videos • Complete beginner to advanced series",
        channel: "Corey Schafer",
        link: "#" 
      },
    ],
  },
];

export type ResourceProps = {
  data?: ResourceType[];
};

export const Resource: React.FC<ResourceProps> = ({ data }) => {
  const display = data && data.length ? data : mockData;

  const getIcon = (type: string) => {
    if (type.toLowerCase().includes("playlist")) {
      return <List className="w-5 h-5" />;
    }
    return <Play className="w-5 h-5" />;
  };

  const getBadgeColor = (type: string) => {
    if (type.toLowerCase().includes("playlist")) {
      return "bg-purple-600";
    }
    return "bg-red-600";
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
            <h2 className="text-2xl font-bold text-gray-900">{resource.type}</h2>
          </div>

          {/* YouTube-Style Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resource.items.map((item, index) => (
              <a
                key={index}
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                {/* Thumbnail Area */}
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 aspect-video flex items-center justify-center overflow-hidden">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {/* Play Icon */}
                  <div className="relative z-10 bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    {getIcon(resource.type)}
                  </div>

                  {/* Duration Badge (simulated) */}
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold">
                    {resource.type.toLowerCase().includes("playlist") ? "Playlist" : "Video"}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4">
                  {/* Channel Name */}
                  {item.channel && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {item.channel.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{item.channel}</span>
                    </div>
                  )}

                  {/* Video Title */}
                  <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>

                  {/* Description/Stats */}
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Watch Button */}
                  <div className="flex items-center gap-2 text-red-600 text-sm font-semibold group-hover:gap-3 transition-all">
                    <span>Watch Now</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
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