// app/api/recommend/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const GOOGLE_BOOKS_API_KEY = "AIzaSyCo71Ne_iGV1uFr_afcKb2F5nTp8ZwAoi0";
const YOUTUBE_API_KEY = "AIzaSyCo71Ne_iGV1uFr_afcKb2F5nTp8ZwAoi0";

// Fetch YouTube videos
async function fetchYouTubeVideos(topic: string, lang?: string) {
  try {
    const langPart = lang ? `${lang} ` : "";
    // if we detected a target language, exclude common other languages to reduce noise
    const ALL_LANGS = ['java','python','javascript','typescript','c','c++','go','rust'];
    const exclude = lang ? ALL_LANGS.filter((l) => l !== lang) : [];
    const excludeStr = exclude.length ? ` ${exclude.map((l) => `-${l}`).join(' ')}` : '';
    const searchQuery = encodeURIComponent(`${topic} ${langPart}tutorial beginner -shorts${excludeStr}`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&order=viewCount&maxResults=3&key=${YOUTUBE_API_KEY}&videoDuration=medium&videoDuration=long`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];

    const videoIds = data.items.map((item: any) => item.id.videoId).join(",");
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const statsResponse = await fetch(statsUrl);
    const statsData = await statsResponse.json();

    return data.items.map((item: any, index: number) => {
      const stats = statsData.items[index]?.statistics;
      const viewCount = stats?.viewCount ? parseInt(stats.viewCount).toLocaleString() : "N/A";
      return {
        title: item.snippet.title,
        description: `${item.snippet.description.substring(0, 100)}... • ${viewCount} views`,
        channel: item.snippet.channelTitle,
        link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    });
  } catch (error) {
    console.error("❌ YouTube videos error:", error);
    return [];
  }
}

// Fetch YouTube playlists
async function fetchYouTubePlaylists(topic: string, lang?: string) {
  try {
    const langPart = lang ? `${lang} ` : "";
    const ALL_LANGS = ['java','python','javascript','typescript','c','c++','go','rust'];
    const exclude = lang ? ALL_LANGS.filter((l) => l !== lang) : [];
    const excludeStr = exclude.length ? ` ${exclude.map((l) => `-${l}`).join(' ')}` : '';
    const searchQuery = encodeURIComponent(`${topic} ${langPart}course complete${excludeStr}`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=playlist&maxResults=3&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];

    return data.items.map((item: any) => ({
      title: item.snippet.title,
      description: item.snippet.description.substring(0, 150) + "...",
      channel: item.snippet.channelTitle,
      link: `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
    }));
  } catch (error) {
    return [];
  }
}

// Fetch books
async function fetchBooksFromGoogle(topic: string, lang?: string) {
  try {
    const langPart = lang ? `${lang} ` : "";
    const ALL_LANGS = ['java','python','javascript','typescript','c','c++','go','rust'];
    const exclude = lang ? ALL_LANGS.filter((l) => l !== lang) : [];
    const excludeStr = exclude.length ? ` ${exclude.map((l) => `-${l}`).join(' ')}` : '';
    const searchQuery = encodeURIComponent(`${topic} ${langPart}programming tutorial${excludeStr}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=3&orderBy=relevance&key=${GOOGLE_BOOKS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];

    return data.items.map((item: any) => {
      const volumeInfo = item.volumeInfo;
      return {
        title: volumeInfo.title || "Unknown Title",
        description: volumeInfo.description?.substring(0, 150) + "..." || "Learning guide",
        authors: volumeInfo.authors?.join(", ") || "Unknown Author",
        link: volumeInfo.infoLink || "#",
        rating: volumeInfo.averageRating || null,
      };
    });
  } catch (error) {
    return [];
  }
}

// Fetch GitHub repos
async function fetchGitHubRepos(topic: string, lang?: string) {
  try {
    // Accept an optional explicit language hint (lang) or infer from topic
    const t = topic.toLowerCase();
    const inferred = lang || (t.includes('java') ? 'java' : t.includes('python') ? 'python' : (t.includes('c++') || t.includes('c ') ? 'c' : t.includes('javascript') || t.includes('js') ? 'javascript' : ''));
    // Use GitHub language qualifier for better results
    const langQualifier = inferred ? `language:${inferred}` : '';
    const queries = [
      `awesome-${topic} ${langQualifier} in:name`,
      `${topic} ${langQualifier} tutorial in:name`,
      `learn ${topic} ${langQualifier} in:name`,
    ];
    let allRepos: any[] = [];

    for (const query of queries) {
      const searchQuery = encodeURIComponent(query);
      const url = `https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&order=desc&per_page=3`;
      try {
        const response = await fetch(url, {
          headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "Learning-App" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.items) allRepos.push(...data.items);
        }
      } catch (err) {
        console.log(`Query failed: ${query}`);
      }
      if (allRepos.length >= 3) break;
    }

    const uniqueRepos = Array.from(new Map(allRepos.map((repo) => [repo.id, repo])).values()).slice(0, 3);
    return uniqueRepos.map((item: any) => ({
      title: item.name,
      description: item.description || "Learning repository",
      channel: item.owner?.login || "Unknown",
      link: item.html_url || "#",
      stars: item.stargazers_count,
    }));
  } catch (error) {
    return [];
  }
}

// Get StackOverflow Q&A
async function getStackOverflowQuestions(topic: string, groq: any, lang?: string) {
  try {
    const langNote = lang ? ` (focus only on ${lang}; exclude other languages)` : "";
    const prompt = `For "${topic}"${langNote}, suggest 3 popular StackOverflow questions beginners ask specifically about ${lang || topic}. Return only questions relevant to that language. Format as JSON: {"questions": [{"title": "...", "description": "...", "link": "https://stackoverflow.com/..."}]}`;
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Return only JSON." },
        { role: "user", content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.3,
    });
    let response = completion.choices[0]?.message?.content || "{}";
    response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(response);
    return parsed.questions || [];
  } catch (error) {
    return [];
  }
}

// Get official docs
async function getOfficialDocs(topic: string, groq: any, lang?: string) {
  try {
    const langNote = lang ? ` (prefer ${lang} docs and exclude unrelated languages)` : "";
    const prompt = `For "${topic}"${langNote}, provide 2 official documentation sites specific to ${lang || topic}. Return JSON only: {"docs": [{"title": "...", "description": "...", "link": "https://..."}]}`;
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Return only JSON." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });
    let response = completion.choices[0]?.message?.content || "{}";
    response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(response);
    return parsed.docs || [];
  } catch (error) {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { topic, resourceMode, historyId } = await req.json();
    console.log("🔥 Request:", { topic, resourceMode, historyId });

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "No valid topic" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const user = await getOrCreateUser();

    // RESOURCES MODE
    if (resourceMode) {
      console.log("📺 Resources mode...");

      // infer language from topic to bias resource searches (e.g., java, python, javascript)
      const tt = topic.toLowerCase();
      const languageSpecific = tt.includes('java')
        ? 'java'
        : tt.includes('python')
        ? 'python'
        : tt.includes('javascript') || tt.includes('js')
        ? 'javascript'
        : tt.includes('typescript') || tt.includes('ts')
        ? 'typescript'
        : tt.includes('c++')
        ? 'c++'
        : tt.includes(' c ') || tt === 'c'
        ? 'c'
        : tt.includes('go')
        ? 'go'
        : tt.includes('rust')
        ? 'rust'
        : '';

      const [youtubeVideos, youtubePlaylists, books, githubRepos, stackOverflow, officialDocs] = await Promise.all([
        fetchYouTubeVideos(topic, languageSpecific),
        fetchYouTubePlaylists(topic, languageSpecific),
        fetchBooksFromGoogle(topic, languageSpecific),
        fetchGitHubRepos(topic, languageSpecific),
        getStackOverflowQuestions(topic, groq, languageSpecific),
        getOfficialDocs(topic, groq, languageSpecific),
      ]);

      const resources: any[] = [];
      if (youtubeVideos.length > 0) resources.push({ type: "Top Videos", items: youtubeVideos });
      if (youtubePlaylists.length > 0) resources.push({ type: "Best Playlists", items: youtubePlaylists });
      if (books.length > 0) {
        resources.push({
          type: "Top Books",
          items: books.map((book: any) => ({
            title: book.title,
            description: `${book.description} • By ${book.authors}${book.rating ? ` • ⭐ ${book.rating}` : ""}`,
            channel: book.authors,
            link: book.link,
          })),
        });
      }
      if (githubRepos.length > 0) {
        resources.push({
          type: "GitHub Learning Repos",
          items: githubRepos.map((repo: any) => ({
            title: repo.title,
            description: `${repo.description} • ⭐ ${repo.stars.toLocaleString()}`,
            channel: repo.channel,
            link: repo.link,
          })),
        });
      }
      if (officialDocs.length > 0) resources.push({ type: "Official Documentation", items: officialDocs });
      if (stackOverflow.length > 0) resources.push({ type: "Common Questions", items: stackOverflow });

      // ✅ SAVE TO DATABASE (create or update if historyId provided)
      let savedResourceItem = null;
      if (user) {
        try {
          if (historyId) {
            // Update existing resource history
            const existing = await prisma.resourceHistory.findFirst({ where: { id: historyId, userId: user.id } });
            if (existing) {
              const updated = await prisma.resourceHistory.update({
                where: { id: historyId },
                data: {
                  title: topic || existing.title,
                  query: topic || existing.query,
                  resources: resources,
                },
              });
              savedResourceItem = updated;
              console.log("✅ Resource history updated");
            } else {
              // fallback to create if not found
              const created = await prisma.resourceHistory.create({
                data: { userId: user.id, title: topic, query: topic, resources },
              });
              savedResourceItem = created;
              console.log("✅ Resource history created (fallback)");
            }
          } else {
            const created = await prisma.resourceHistory.create({
              data: { userId: user.id, title: topic, query: topic, resources },
            });
            savedResourceItem = created;
            console.log("✅ Resource history saved");
          }
        } catch (dbError) {
          console.error("❌ Failed to save resource history:", dbError);
        }
      }

      return NextResponse.json({
        success: true,
        topic,
        isResourceMode: true,
        aiResponse: `Resources for ${topic}`,
        resources,
      });
    }

    // CHAT MODE
    console.log("💬 Chat mode...");
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Helpful AI assistant." },
        { role: "user", content: topic },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "No response";

    // ✅ SAVE TO DATABASE (use Conversation + Message models when available, else fallback)
    let savedConversation: any = null;
    if (user) {
      try {
        const clientAny = prisma as any;

        if (clientAny.conversation && typeof clientAny.conversation.create === "function") {
          if (historyId) {
            const existing = await clientAny.conversation.findFirst({ where: { id: historyId, userId: user.id } });
            if (existing) {
              // Add user message, then assistant message
              await clientAny.message.create({ data: { conversationId: existing.id, role: "user", content: topic } });
              await clientAny.message.create({ data: { conversationId: existing.id, role: "assistant", content: aiResponse } });

              const updated = await clientAny.conversation.findUnique({ where: { id: existing.id }, include: { messages: true } });
              savedConversation = updated;
              console.log("✅ Conversation updated with new messages");
            } else {
              // Fallback to create conversation using new models
              const created = await clientAny.conversation.create({
                data: {
                  userId: user.id,
                  title: topic,
                  messages: { create: [{ role: "user", content: topic }, { role: "assistant", content: aiResponse }] },
                },
                include: { messages: true },
              });
              savedConversation = created;
              console.log("✅ Conversation created (new models)");
            }
          } else {
            const created = await clientAny.conversation.create({
              data: {
                userId: user.id,
                title: topic,
                messages: { create: [{ role: "user", content: topic }, { role: "assistant", content: aiResponse }] },
              },
              include: { messages: true },
            });
            savedConversation = created;
            console.log("✅ Conversation created");
          }
        } else {
          // Legacy fallback: use chatHistory table
          if (historyId) {
            const existing = await (prisma as any).chatHistory.findFirst({ where: { id: historyId, userId: user.id } });
            if (existing) {
              const combined = `${existing.response || ""}\n\nUser: ${topic}\nAssistant: ${aiResponse}`;
              const updated = await (prisma as any).chatHistory.update({ where: { id: historyId }, data: { topic: existing.topic || topic, query: existing.query || topic, response: combined } });
              savedConversation = updated;
              console.log("✅ Legacy chatHistory updated (appended user+assistant)");
            } else {
              const created = await (prisma as any).chatHistory.create({ data: { userId: user.id, topic, query: topic, response: `User: ${topic}\nAssistant: ${aiResponse}` } });
              savedConversation = created;
              console.log("✅ Legacy chatHistory created (fallback)");
            }
          } else {
            const created = await (prisma as any).chatHistory.create({ data: { userId: user.id, topic, query: topic, response: `User: ${topic}\nAssistant: ${aiResponse}` } });
            savedConversation = created;
            console.log("✅ Legacy chatHistory saved");
          }
        }
      } catch (dbError) {
        console.error("❌ Failed to save conversation:", dbError);
      }
    }

    return NextResponse.json({ success: true, topic, isResourceMode: false, aiResponse, item: savedConversation });
  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
  }
}