import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Helper function to generate resources based on topic
function generateResources(topic: string) {
  const resourcesByTopic: Record<string, any> = {
    python: {
      overview: "Here are the best resources to learn Python programming",
      resources: [
        {
          type: "Books",
          items: [
            { title: "Python Crash Course", description: "Learn Python through practical projects", link: "https://www.amazon.com/Python-Crash-Course-Practical-Introduction/dp/1593279288" },
            { title: "Automate the Boring Stuff with Python", description: "Practical automation with Python", link: "https://automatetheboringstuff.com/" },
            { title: "Learning Python", description: "Comprehensive guide to Python basics", link: "https://www.oreilly.com/library/view/learning-python-5th/9781449355739/" },
          ]
        },
        {
          type: "Online Courses",
          items: [
            { title: "Python for Everybody", description: "Free course from University of Michigan", link: "https://www.py4e.com/" },
            { title: "Complete Python Bootcamp", description: "Udemy course by Jose Portilla", link: "https://www.udemy.com/course/complete-python-bootcamp/" },
            { title: "Google's Python Class", description: "Official Google Python tutorial", link: "https://developers.google.com/edu/python" },
          ]
        },
        {
          type: "YouTube Channels",
          items: [
            { title: "Corey Schafer Python Tutorials", description: "High-quality Python education", link: "https://www.youtube.com/c/CoreySchafer" },
            { title: "Programming with Mosh", description: "Beginner-friendly Python courses", link: "https://www.youtube.com/c/programmingwithmosh" },
            { title: "Real Python Tutorials", description: "In-depth Python tutorials", link: "https://www.youtube.com/c/RealPython" },
          ]
        },
        {
          type: "Practice Platforms",
          items: [
            { title: "LeetCode", description: "Code challenges and interview prep", link: "https://leetcode.com/" },
            { title: "HackerRank", description: "Learn and practice coding", link: "https://www.hackerrank.com/" },
            { title: "Codewars", description: "Solve coding challenges", link: "https://www.codewars.com/" },
          ]
        }
      ]
    },
    react: {
      overview: "Comprehensive React learning resources",
      resources: [
        {
          type: "Books",
          items: [
            { title: "React Up and Running", description: "Getting started with React", link: "#" },
            { title: "Learning React", description: "Complete guide to React concepts", link: "#" },
            { title: "Fullstack React", description: "Advanced React patterns", link: "#" },
          ]
        },
        {
          type: "Official Documentation",
          items: [
            { title: "React Official Docs", description: "Official React documentation", link: "https://react.dev/" },
            { title: "Create React App", description: "Setup tool for React projects", link: "https://create-react-app.dev/" },
            { title: "React Router", description: "Client-side routing for React", link: "https://reactrouter.com/" },
          ]
        },
        {
          type: "YouTube Channels",
          items: [
            { title: "Traversy Media", description: "React tutorials and projects", link: "https://www.youtube.com/c/TraversyMedia" },
            { title: "FreeCodeCamp", description: "Comprehensive React courses", link: "https://www.youtube.com/c/freeCodeCamp" },
            { title: "The Net Ninja", description: "React fundamentals and advanced topics", link: "https://www.youtube.com/c/TheNetNinja" },
          ]
        }
      ]
    },
    machine: {
      overview: "Machine Learning and AI learning resources",
      resources: [
        {
          type: "Courses",
          items: [
            { title: "Andrew Ng's ML Course", description: "Foundational machine learning course", link: "https://www.coursera.org/learn/machine-learning" },
            { title: "Fast.ai", description: "Practical deep learning", link: "https://www.fast.ai/" },
            { title: "Kaggle Learn", description: "Free micro-courses on ML", link: "https://www.kaggle.com/learn" },
          ]
        },
        {
          type: "Books",
          items: [
            { title: "Hands-On Machine Learning", description: "Practical ML with Python", link: "#" },
            { title: "The Hundred-Page ML Book", description: "ML fundamentals", link: "#" },
            { title: "Deep Learning", description: "Deep learning textbook", link: "#" },
          ]
        },
        {
          type: "Practice Datasets",
          items: [
            { title: "Kaggle Datasets", description: "Public datasets for ML projects", link: "https://www.kaggle.com/datasets" },
            { title: "UCI ML Repository", description: "Machine learning datasets", link: "https://archive.ics.uci.edu/" },
            { title: "Google Dataset Search", description: "Search for public datasets", link: "https://datasetsearch.research.google.com/" },
          ]
        }
      ]
    },
    cpp: {
      overview: "Complete C++ learning resources for beginners and advanced developers",
      resources: [
        {
          type: "Books",
          items: [
            { title: "C++ Primer", description: "Comprehensive C++ guide by Lippman", link: "https://www.amazon.com/Primer-5th-Stanley-B-Lippman/dp/0134382592" },
            { title: "Effective C++", description: "Learn 55 specific ways to improve your C++ programs", link: "https://www.amazon.com/Effective-Specific-Improve-Programs-Designs/dp/0321334876" },
            { title: "The C++ Programming Language", description: "The definitive C++ reference by Bjarne Stroustrup", link: "https://www.amazon.com/C-Programming-Language-Bjarne-Stroustrup/dp/0321958322" },
          ]
        },
        {
          type: "Online Courses",
          items: [
            { title: "Learn C++ on Codecademy", description: "Interactive C++ course", link: "https://www.codecademy.com/learn/learn-cpp" },
            { title: "C++ for C Programmers", description: "UC Davis course on Coursera", link: "https://www.coursera.org/learn/c-plus-plus-a" },
            { title: "Udemy C++ Courses", description: "Wide variety of C++ courses", link: "https://www.udemy.com/topic/c-plus-plus/" },
          ]
        },
        {
          type: "YouTube Channels",
          items: [
            { title: "Cherno C++ Series", description: "High-quality C++ tutorials", link: "https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnY7yo6YaTLapJ8Magwa" },
            { title: "Bro Code C++", description: "Beginner-friendly C++ tutorials", link: "https://www.youtube.com/playlist?list=PL6n9fhu94yhUbwtLqyPl5Z0iZxXG_-_Bb" },
            { title: "FreeCodeCamp C++", description: "Complete C++ course", link: "https://www.youtube.com/watch?v=_Z5keKAR800" },
          ]
        },
        {
          type: "Practice Platforms",
          items: [
            { title: "LeetCode C++", description: "Code problems with C++ solutions", link: "https://leetcode.com/" },
            { title: "HackerRank C++", description: "C++ coding challenges", link: "https://www.hackerrank.com/domains/cpp" },
            { title: "Codewars C++", description: "Master C++ through challenges", link: "https://www.codewars.com/" },
          ]
        },
        {
          type: "Documentation & References",
          items: [
            { title: "cppreference.com", description: "Comprehensive C++ standard library reference", link: "https://en.cppreference.com/" },
            { title: "cplusplus.com", description: "C++ tutorials and reference", link: "https://www.cplusplus.com/" },
            { title: "isocpp.org", description: "Official C++ standards committee", link: "https://isocpp.org/" },
          ]
        }
      ]
    }
  };

  // Find matching resources
  const topicLower = topic.toLowerCase();
  for (const [key, value] of Object.entries(resourcesByTopic)) {
    if (topicLower.includes(key)) {
      return value;
    }
  }

  // Default resources
  return {
    overview: `Resources for learning about ${topic}`,
    resources: [
      {
        type: "Recommended Courses",
        items: [
          { title: "Udemy Courses", description: "Wide variety of courses", link: "https://www.udemy.com/" },
          { title: "Coursera", description: "University-level courses", link: "https://www.coursera.org/" },
          { title: "Skillshare", description: "Creative and tech courses", link: "https://www.skillshare.com/" },
        ]
      },
      {
        type: "Learning Platforms",
        items: [
          { title: "YouTube", description: "Free video tutorials", link: "https://www.youtube.com/" },
          { title: "GitHub", description: "Open source projects", link: "https://www.github.com/" },
          { title: "Dev.to", description: "Developer community articles", link: "https://dev.to/" },
        ]
      }
    ]
  };
}

export async function POST(req: Request) {
  try {
    const { topic, resourceMode } = await req.json();
    console.log("🔥 Received from frontend:", { topic, resourceMode });

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "No valid topic provided" },
        { status: 400 }
      );
    }

    // If resource mode is ON, generate and return resources
    if (resourceMode) {
      const resources = generateResources(topic);
      return NextResponse.json({
        success: true,
        topic,
        isResourceMode: true,
        aiResponse: resources.overview,
        resources: resources.resources,
      });
    }

    // Normal chat mode - call Groq API
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log("📡 Calling Groq API...");

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: topic,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const aiResponse =
      chatCompletion.choices[0]?.message?.content || "No response";

    console.log("✅ AI Response:", aiResponse);

    return NextResponse.json({
      success: true,
      topic,
      isResourceMode: false,
      aiResponse,
    });
  } catch (error: any) {
    console.error("❌ Error in /api/recommend:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
