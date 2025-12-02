//api/recommend/route.ts  backend
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

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

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // RESOURCES MODE: YouTube Learning Resources Only
    if (resourceMode) {
      console.log("📺 Resources Mode: Generating YouTube learning resources...");

      const resourcePrompt = `You are a YouTube learning resources expert. The user wants to learn: "${topic}"

Recommend the BEST YouTube resources based on popularity, likes, and teaching quality:

1. **Top 3 Individual Videos** - Single comprehensive tutorial videos (highly liked, beginner-friendly)
2. **Top 2 Playlists** - Complete curated playlists (highly rated series)

Format your response as valid JSON with this EXACT schema:
{
  "overview": "Brief intro about learning ${topic} on YouTube",
  "resources": [
    {
      "type": "Top Videos",
      "items": [
        {
          "title": "Video Title",
          "description": "What makes this video great (mention view count/likes if known)",
          "channel": "Channel Name",
          "link": "https://youtube.com/watch?v=..."
        }
      ]
    },
    {
      "type": "Best Playlists",
      "items": [
        {
          "title": "Playlist Name",
          "description": "Why this playlist is comprehensive",
          "channel": "Channel Name",
          "link": "https://youtube.com/playlist?list=..."
        }
      ]
    }
  ]
}

IMPORTANT: 
- Suggest REAL, popular YouTube videos/playlists that exist
- Include actual channel names
- Prioritize content with high likes and positive reviews
- Return ONLY valid JSON, no markdown, no extra text`;

      const chatCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a YouTube learning resources expert. You know the most popular, highly-liked educational videos and playlists. Return ONLY valid JSON with no markdown formatting."
          },
          {
            role: "user",
            content: resourcePrompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      });

      let aiResponse = chatCompletion.choices[0]?.message?.content || "{}";
      
      // Clean up any markdown formatting if present
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsedResources = JSON.parse(aiResponse);
        
        console.log("✅ AI-Generated Resources:", parsedResources);

        return NextResponse.json({
          success: true,
          topic,
          isResourceMode: true,
          aiResponse: parsedResources.overview || `Resources for learning ${topic}`,
          resources: parsedResources.resources || [],
        });
      } catch (parseError) {
        console.error("❌ Failed to parse AI response as JSON:", parseError);
        console.log("Raw AI Response:", aiResponse);
        
        // Fallback to basic structure if parsing fails
        return NextResponse.json({
          success: true,
          topic,
          isResourceMode: true,
          aiResponse: `Here are YouTube resources for learning ${topic}`,
          resources: [
            {
              type: "Popular Videos",
              items: [
                { 
                  title: "Search YouTube for tutorials", 
                  description: "Find beginner-friendly videos", 
                  channel: "Various",
                  link: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}` 
                }
              ]
            },
            {
              type: "Learning Playlists",
              items: [
                { 
                  title: "Browse playlists", 
                  description: "Find complete course playlists", 
                  channel: "Various",
                  link: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' complete course')}&sp=EgIQAw%253D%253D` 
                }
              ]
            }
          ],
        });
      }
    }

    // CHAT MODE: Normal conversational AI
    console.log("💬 Chat Mode: Getting conversational response...");

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful, friendly AI assistant. Provide clear, concise explanations and engage naturally in conversation."
        },
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

    console.log("✅ Chat AI Response:", aiResponse);

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