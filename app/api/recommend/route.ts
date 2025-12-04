import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const GOOGLE_BOOKS_API_KEY = "AIzaSyCo71Ne_iGV1uFr_afcKb2F5nTp8ZwAoi0";

// Fetch books from Google Books API
async function fetchBooksFromGoogle(topic: string) {
  try {
    // Smarter search query - prioritize learning books
    const searchQuery = encodeURIComponent(`${topic} programming beginner tutorial learn`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=3&orderBy=relevance&key=${GOOGLE_BOOKS_API_KEY}`;

    console.log("📚 Fetching books...");
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log("⚠️ No books found");
      return [];
    }

    const books = data.items.map((item: any) => {
      const volumeInfo = item.volumeInfo;
      return {
        title: volumeInfo.title || "Unknown Title",
        description: volumeInfo.description 
          ? volumeInfo.description.substring(0, 150) + "..." 
          : "Comprehensive guide for learning",
        authors: volumeInfo.authors?.join(", ") || "Unknown Author",
        link: volumeInfo.infoLink || "#",
        rating: volumeInfo.averageRating || null,
      };
    });

    console.log("✅ Books:", books.length);
    return books;
  } catch (error) {
    console.error("❌ Books error:", error);
    return [];
  }
}

// Fetch LEARNING-focused GitHub repositories
async function fetchGitHubRepos(topic: string) {
  try {
    console.log("🐙 Fetching GitHub repos...");
    
    // MUCH BETTER SEARCH STRATEGY:
    // 1. Search for awesome lists (curated resources)
    // 2. Search for tutorials/courses
    // 3. Prioritize repos with "awesome", "tutorial", "course", "learn" in name
    const queries = [
      `awesome-${topic} in:name`,
      `${topic} tutorial in:name,description`,
      `learn ${topic} in:name,description`,
      `${topic} course in:name,description`
    ];

    let allRepos: any[] = [];

    // Try each query until we get good results
    for (const query of queries) {
      const searchQuery = encodeURIComponent(query);
      const url = `https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&order=desc&per_page=5`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Learning-Resource-App'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            allRepos.push(...data.items);
          }
        }
      } catch (err) {
        console.log(`Query failed: ${query}`);
      }

      // If we have enough repos, break
      if (allRepos.length >= 3) break;
    }

    // Remove duplicates and get top 3
    const uniqueRepos = Array.from(new Map(allRepos.map(repo => [repo.id, repo])).values())
      .slice(0, 3);

    if (uniqueRepos.length === 0) {
      console.log("⚠️ No GitHub repos found");
      return [];
    }

    const repos = uniqueRepos.map((item: any) => ({
      title: item.name,
      description: item.description || "Popular learning repository",
      channel: item.owner?.login || "Unknown",
      link: item.html_url || "#",
      stars: item.stargazers_count,
    }));

    console.log("✅ GitHub repos:", repos.length);
    return repos;
  } catch (error) {
    console.error("❌ GitHub error:", error);
    return [];
  }
}

// AI-curated StackOverflow questions
async function getStackOverflowQuestions(topic: string, groq: any) {
  try {
    console.log("💬 Getting StackOverflow Q&A...");
    
    const prompt = `You are a StackOverflow expert. For "${topic}", suggest 3 REAL popular StackOverflow questions that beginners commonly search for.

Format as JSON:
{
  "questions": [
    {
      "title": "Actual question title from StackOverflow",
      "description": "Why this is important (1 sentence, under 100 chars)",
      "link": "https://stackoverflow.com/questions/[actual-question-id]/[question-slug]"
    }
  ]
}

IMPORTANT: Use REAL StackOverflow question URLs that exist. Return ONLY valid JSON.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a StackOverflow expert. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    let response = completion.choices[0]?.message?.content || "{}";
    response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(response);
    console.log("✅ StackOverflow Q&A:", parsed.questions?.length || 0);
    return parsed.questions || [];
  } catch (error) {
    console.error("❌ StackOverflow error:", error);
    return [];
  }
}

// AI-curated documentation links
async function getOfficialDocs(topic: string, groq: any) {
  try {
    console.log("📖 Getting official documentation...");
    
    const prompt = `For "${topic}", provide the 2 MOST IMPORTANT official documentation/reference sites.

Format as JSON:
{
  "docs": [
    {
      "title": "Official [Name] Documentation",
      "description": "What you'll find here (1 sentence)",
      "link": "https://..."
    }
  ]
}

Return ONLY valid JSON with REAL URLs.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a developer documentation expert. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    let response = completion.choices[0]?.message?.content || "{}";
    response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(response);
    console.log("✅ Official docs:", parsed.docs?.length || 0);
    return parsed.docs || [];
  } catch (error) {
    console.error("❌ Docs error:", error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { topic, resourceMode } = await req.json();
    console.log("🔥 Request:", { topic, resourceMode });

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "No valid topic" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // RESOURCES MODE
    if (resourceMode) {
      console.log("📺 Generating comprehensive resources...");

      // 1. YouTube from AI (improved prompt)
      const resourcePrompt = `You are a YouTube expert curator. For "${topic}", recommend:

1. **Top 3 Videos** - REAL popular beginner tutorials (include view counts)
2. **Top 2 Playlists** - Complete course series

JSON format:
{
  "overview": "One sentence about learning ${topic} on YouTube",
  "resources": [
    {
      "type": "Top Videos",
      "items": [
        {
          "title": "Exact video title",
          "description": "Why it's great (mention views/likes)",
          "channel": "Channel name",
          "link": "https://youtube.com/watch?v=..."
        }
      ]
    },
    {
      "type": "Best Playlists",
      "items": [
        {
          "title": "Playlist name",
          "description": "What it covers + video count",
          "channel": "Channel name",
          "link": "https://youtube.com/playlist?list=..."
        }
      ]
    }
  ]
}

Suggest REAL popular content. Return ONLY JSON.`;

      const ytCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "YouTube expert. Return only valid JSON." },
          { role: "user", content: resourcePrompt }
        ],
        max_tokens: 1500,
        temperature: 0.4,
      });

      let aiResponse = ytCompletion.choices[0]?.message?.content || "{}";
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // 2. Fetch all resources in parallel
      const [books, githubRepos, stackOverflow, officialDocs] = await Promise.all([
        fetchBooksFromGoogle(topic),
        fetchGitHubRepos(topic),
        getStackOverflowQuestions(topic, groq),
        getOfficialDocs(topic, groq),
      ]);

      try {
        const parsedResources = JSON.parse(aiResponse);

        // Add all resources
        if (books.length > 0) {
          parsedResources.resources.push({
            type: "Top Books",
            items: books.map((book: any) => ({
              title: book.title,
              description: `${book.description} • By ${book.authors}${book.rating ? ` • ⭐ ${book.rating}` : ''}`,
              channel: book.authors,
              link: book.link,
            }))
          });
        }

        if (githubRepos.length > 0) {
          parsedResources.resources.push({
            type: "GitHub Learning Repos",
            items: githubRepos.map((repo: any) => ({
              title: repo.title,
              description: `${repo.description} • ⭐ ${repo.stars.toLocaleString()}`,
              channel: repo.channel,
              link: repo.link,
            }))
          });
        }

        if (officialDocs.length > 0) {
          parsedResources.resources.push({
            type: "Official Documentation",
            items: officialDocs.map((doc: any) => ({
              title: doc.title,
              description: doc.description,
              channel: "Official",
              link: doc.link,
            }))
          });
        }

        if (stackOverflow.length > 0) {
          parsedResources.resources.push({
            type: "Common Questions",
            items: stackOverflow.map((qa: any) => ({
              title: qa.title,
              description: qa.description,
              channel: "StackOverflow",
              link: qa.link,
            }))
          });
        }

        console.log("✅ Total sections:", parsedResources.resources.length);

        return NextResponse.json({
          success: true,
          topic,
          isResourceMode: true,
          aiResponse: parsedResources.overview || `Resources for ${topic}`,
          resources: parsedResources.resources || [],
        });
      } catch (parseError) {
        console.error("❌ Parse error:", parseError);
        
        // Robust fallback
        const fallbackResources: any[] = [
          {
            type: "YouTube Search",
            items: [{
              title: `${topic} tutorials`,
              description: "Find video tutorials",
              channel: "Various",
              link: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`
            }]
          }
        ];

        if (books.length > 0) fallbackResources.push({ type: "Top Books", items: books.map((b: any) => ({ title: b.title, description: b.description, channel: b.authors, link: b.link })) });
        if (githubRepos.length > 0) fallbackResources.push({ type: "GitHub Repos", items: githubRepos.map((r: any) => ({ title: r.title, description: r.description, channel: r.channel, link: r.link })) });
        if (officialDocs.length > 0) fallbackResources.push({ type: "Documentation", items: officialDocs });
        if (stackOverflow.length > 0) fallbackResources.push({ type: "Q&A", items: stackOverflow });

        return NextResponse.json({
          success: true,
          topic,
          isResourceMode: true,
          aiResponse: `Learning resources for ${topic}`,
          resources: fallbackResources,
        });
      }
    }

    // CHAT MODE
    console.log("💬 Chat mode...");
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a helpful AI assistant. Be clear and concise." },
        { role: "user", content: topic }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "No response";
    console.log("✅ Chat response");

    return NextResponse.json({
      success: true,
      topic,
      isResourceMode: false,
      aiResponse,
    });
    
  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
  }
}