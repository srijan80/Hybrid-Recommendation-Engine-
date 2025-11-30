//app/content/resource.tsx
"use client";
import React from "react";

export interface ResourceItem {
  title: string;
  description?: string;
  link?: string;
}

export interface ResourceType {
  type: string;
  items: ResourceItem[];
}

const mockData: ResourceType[] = [
  {
    type: "Books",
    items: [
      { title: "AI for Beginners", link: "#" },
      { title: "Python Machine Learning", link: "#" },
      { title: "Deep Learning Basics", link: "#" },
      { title: "Artificial Intelligence: A Modern Approach", link: "#" },
      { title: "Hands-On ML", link: "#" },
    ],
  },
  {
    type: "YouTube Playlists",
    items: [
      { title: "AI Full Course - FreeCodeCamp", link: "#" },
      { title: "Machine Learning Tutorial", link: "#" },
      { title: "Python AI Projects", link: "#" },
    ],
  },
  {
    type: "Research Papers",
    items: [
      { title: "A Beginner's Guide to AI", link: "#" },
      { title: "Machine Learning Trends 2025", link: "#" },
      { title: "Deep Learning Survey", link: "#" },
    ],
  },
  {
    type: "Roadmap Steps",
    items: [
      { title: "Step 1: Python Basics", link: "#" },
      { title: "Step 2: AI Fundamentals", link: "#" },
      { title: "Step 3: Machine Learning Intro", link: "#" },
      { title: "Step 4: Build Projects", link: "#" },
    ],
  },
];

export type ResourceProps = {
  data?: ResourceType[];
};

export const Resource: React.FC<ResourceProps> = ({ data }) => {
  const display = data && data.length ? data : mockData;

  return (
    <div className="w-full space-y-12 py-6">
      {display.map((resource) => (
        <div key={resource.type}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{resource.type}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {resource.items.map((item, index) => (
              <a
                key={index}
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="relative p-6 rounded-2xl overflow-hidden group cursor-pointer bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  {item.description && <p className="text-gray-600 text-sm">{item.description}</p>}
                  <p className="text-indigo-600 mt-2 text-sm font-medium">Visit →</p>
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
  const display = data && data.length ? data : mockData;
  return (
    <div className="w-full space-y-12 py-6">
      {display.map((resource) => (
        <div key={resource.type}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{resource.type}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {resource.items.map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative p-6 rounded-2xl overflow-hidden group cursor-pointer bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  {item.description && <p className="text-gray-600 text-sm">{item.description}</p>}
                  <p className="text-indigo-600 mt-2 text-sm font-medium">Visit →</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
