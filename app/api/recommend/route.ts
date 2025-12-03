import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { parseStringPromise } from 'xml2js'; // You'll need to install this: npm install xml2js @types/xml2js

// Google Books API Key
const GOOGLE_BOOKS_API_KEY = "AIzaSyCo71Ne_iGV1uFr_afcKb2F5nTp8ZwAoi0";

// Function to fetch books from Google Books API
async function fetchBooksFromGoogle(topic: string) {
  try {
    const searchQuery = encodeURIComponent(`${topic} programming tutorial`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=3&orderBy=relevance&key=${GOOGLE_BOOKS_API_KEY}`;

    console.log("📚 Fetching books from Google Books API...");
    console.log("🔑 API Key exists:", !!GOOGLE_BOOKS_API_KEY);

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
          : "No description available",
        authors: volumeInfo.authors?.join(", ") || "Unknown Author",
        link: volumeInfo.infoLink || "#",
        thumbnail: volumeInfo.imageLinks?.thumbnail || null,
        rating: volumeInfo.averageRating || null,
      };
    });

    console.log("✅ Books fetched:", books.length);
    return books;
  } catch (error) {
    console.error("❌ Error fetching books:", error);
    return [];
  }
}

// Function to fetch top GitHub repositories with a focus on learning resources
async function fetchGitHubRepos(topic: string) {
  try {
    console.log("🐙 Fetching GitHub repos...");
    // Construct a more specific search query
    // - `topic` in the name or description
    // - Terms like 'tutorial', 'learn', 'course', 'examples', 'bootcamp', 'curriculum' often indicate educational repos
    // - `sort=stars&order=desc` still sorts by stars within these relevant results
    const searchTerms = `tutorial OR learn OR course OR examples OR bootcamp OR curriculum`;
    // Use the topic itself as the primary search term
    // Combine topic, learning terms, and optionally filter by common programming languages if applicable
    // Using 'in:name,description' to search specifically in name and description fields for better relevance
    const searchQuery = encodeURIComponent(`${topic} ${searchTerms} in:name,description`);
    const url = `https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&order=desc&per_page=3`;
    
    console.log("🔍 GitHub API Query:", url); // Log the actual query being made

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Optional: Add a User-Agent header as a best practice for public APIs
        // 'User-Agent': 'Your-App-Name' 
      }
    });

    if (!response.ok) {
      console.error(`GitHub API responded with status ${response.status}`);
      const errorText = await response.text(); // Get error details
      console.error("Error details:", errorText);
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log("⚠️ No GitHub repos found with the specific query");
      // Fallback: try a slightly broader query if the specific one yields no results
      const fallbackQuery = encodeURIComponent(`${topic} in:name,description`);
      const fallbackUrl = `https://api.github.com/search/repositories?q=${fallbackQuery}&sort=stars&order=desc&per_page=3`;
      console.log("🔍 Trying fallback GitHub API Query:", fallbackUrl);
      
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (!fallbackResponse.ok) {
         console.error(`Fallback GitHub API responded with status ${fallbackResponse.status}`);
         const errorText = await fallbackResponse.text();
         console.error("Fallback error details:", errorText);
         return []; // Return empty array if fallback also fails
      }

      const fallbackData = await fallbackResponse.json();
      if (!fallbackData.items || fallbackData.items.length === 0) {
        console.log("⚠️ No GitHub repos found even with the fallback query");
        return [];
      }

      const fallbackRepos = fallbackData.items.map((item: any) => ({
        title: item.name,
        description: item.description || "No description available",
        channel: item.owner?.login || "Unknown Owner",
        link: item.html_url || "#",
        stars: item.stargazers_count,
      }));

      console.log("✅ Fallback GitHub repos fetched:", fallbackRepos.length);
      return fallbackRepos;
    }

    const repos = data.items.map((item: any) => ({
      title: item.name,
      description: item.description || "No description available",
      channel: item.owner?.login || "Unknown Owner",
      link: item.html_url || "#",
      stars: item.stargazers_count,
    }));

    console.log("✅ GitHub repos fetched with specific query:", repos.length);
    return repos;
  } catch (error) {
    console.error("❌ Error fetching GitHub repos:", error);
    return [];
  }
}

// Function to fetch research papers from arXiv API
async function fetchArxivPapers(topic: string) {
  try {
    console.log("🔬 Fetching research papers from arXiv...");
    // Encode the topic for the search query
    // Use 'all:' to search in title, abstract, and other fields
    // Add quotes around the topic for an exact phrase search if needed, or use boolean operators
    // Example: all:"machine learning" OR all:"deep learning" OR all:machine-learning
    // For now, using the topic directly with 'all:' which is broad but standard
    const searchQuery = encodeURIComponent(`all:${topic}`);
    // Example URL: http://export.arxiv.org/api/query?search_query=all:machine+learning&start=0&max_results=5
    const url = `http://export.arxiv.org/api/query?search_query=${searchQuery}&start=0&max_results=3`; // Changed max_results to 3

    console.log("🔍 arXiv API Query:", url);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
    }
    const xmlData = await response.text();

    // Parse the XML response from arXiv
    const parsedData = await parseStringPromise(xmlData, { explicitArray: false, ignoreAttrs: false });

    const entries = parsedData.feed.entry || [];
    if (!entries || entries.length === 0) {
      console.log("⚠️ No research papers found on arXiv for this topic");
      return [];
    }

    // Extract relevant information from each entry
    const papers = entries.map((entry: any) => {
      // Authors can be an array or a single object
      const authorsArray = Array.isArray(entry.author) ? entry.author : [entry.author];
      const authorNames = authorsArray.map((author: any) => author.name).join(", ");

      // Summary might be long, so we truncate it
      const summary = entry.summary ? entry.summary.replace(/\s+/g, ' ').trim() : "No summary available";
      const truncatedSummary = summary.length > 200 ? summary.substring(0, 200) + "..." : summary;

      return {
        title: entry.title,
        description: truncatedSummary,
        channel: authorNames, // Use authors as "channel"
        link: entry.id || "#", // arXiv ID link
        published: entry.published ? new Date(entry.published).toLocaleDateString() : "Unknown Date", // Optional: include publication date
      };
    });

    console.log("✅ Research papers fetched from arXiv:", papers.length);
    return papers;
  } catch (error) {
    console.error("❌ Error fetching research papers from arXiv:", error);
    return [];
  }
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

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // RESOURCES MODE: YouTube + Books + GitHub + Research Papers
    if (resourceMode) {
      console.log("📺 Resources Mode: Generating comprehensive resources...");
      console.log("📚 Fetching books from Google Books API...");
      console.log("🐙 Fetching GitHub repos...");
      console.log("🔬 Fetching research papers from arXiv...");

      // 1. Get YouTube recommendations from AI
      const resourcePrompt = `You are a YouTube learning resources expert. The user wants to learn: "${topic}"

Recommend the BEST YouTube resources based on popularity, likes, and teaching quality:

1. **Top 3 Individual Videos** - Single comprehensive tutorial videos (highly liked, beginner-friendly)
2. **Top 2 Playlists** - Complete curated playlists (highly rated series)

Format your response as valid JSON with this EXACT schema:
{
  "overview": "Brief intro about learning ${topic}",
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
            content:
              "You are a YouTube learning resources expert. You know the most popular, highly-liked educational videos and playlists. Return ONLY valid JSON with no markdown formatting.",
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
      aiResponse = aiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // 2. Fetch books from Google Books API
      const books = await fetchBooksFromGoogle(topic);
      console.log("✅ Books fetched:", books.length);

      // 3. Fetch GitHub repositories
      const githubRepos = await fetchGitHubRepos(topic);
      console.log("✅ GitHub repos fetched:", githubRepos.length);

      // 4. Fetch research papers from arXiv
      const arxivPapers = await fetchArxivPapers(topic);
      console.log("✅ Research papers fetched:", arxivPapers.length);


      try {
        const parsedResources = JSON.parse(aiResponse);

        // 5. Add books, GitHub repos, and Research Papers to the resources array
        if (books.length > 0) {
          parsedResources.resources.push({
            type: "Top Books",
            items: books.map((book: any) => ({
              title: book.title,
              description: `${book.description} • By ${book.authors}${
                book.rating ? ` • ⭐ ${book.rating}` : ""
              }`,
              channel: book.authors, // Use authors as "channel"
              link: book.link,
            })),
          });
        }

        if (githubRepos.length > 0) {
          parsedResources.resources.push({
            type: "Top GitHub Repositories",
            items: githubRepos.map((repo: any) => ({
              title: repo.title,
              description: `${repo.description} • ⭐ ${repo.stars} stars`,
              channel: repo.channel,
              link: repo.link,
            })),
          });
        }

        if (arxivPapers.length > 0) {
          parsedResources.resources.push({
            type: "Research Papers (arXiv)",
            items: arxivPapers.map((paper: any) => ({
              title: paper.title,
              description: `${paper.description} • Published: ${paper.published}`,
              channel: paper.channel,
              link: paper.link,
            })),
          });
        }


        console.log(
          "✅ AI-Generated YouTube Resources:",
          parsedResources.resources[0]?.items?.length,
          "videos, ",
          parsedResources.resources[1]?.items?.length,
          "playlists"
        );
        console.log("📚 First Book:", books[0]?.title);
        console.log("🐙 First Repo:", githubRepos[0]?.title);
        console.log("🔬 First Paper:", arxivPapers[0]?.title);


        return NextResponse.json({
          success: true,
          topic,
          isResourceMode: true,
          aiResponse:
            parsedResources.overview || `Resources for learning ${topic}`,
          resources: parsedResources.resources || [],
        });
      } catch (parseError) {
        console.error("❌ Failed to parse AI response as JSON:", parseError);
        console.log("Raw AI Response:", aiResponse);

        // Fallback with all resources
        const fallbackResources = [
          {
            type: "Popular Videos",
            items: [
              {
                title: "Search YouTube for tutorials",
                description: "Find beginner-friendly videos",
                channel: "Various",
                link: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                  topic + " tutorial"
                )}`,
              },
            ],
          },
          {
            type: "Learning Playlists",
            items: [
              {
                title: "Browse playlists",
                description: "Find complete course playlists",
                channel: "Various",
                link: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                  topic + " complete course"
                )}&sp=EgIQAw%253D%253D`,
              },
            ],
          },
        ];

        // Add books to fallback
        if (books.length > 0) {
          fallbackResources.push({
            type: "Top Books",
            items: books.map((book: any) => ({
              title: book.title,
              description: `${book.description} • By ${book.authors}${
                book.rating ? ` • ⭐ ${book.rating}` : ""
              }`,
              channel: book.authors,
              link: book.link,
            })),
          });
        }

        // Add GitHub repos to fallback
        if (githubRepos.length > 0) {
          fallbackResources.push({
            type: "Top GitHub Repositories",
            items: githubRepos.map((repo: any) => ({
              title: repo.title,
              description: `${repo.description} • ⭐ ${repo.stars} stars`,
              channel: repo.channel,
              link: repo.link,
            })),
          });
        }

        // Add Research Papers to fallback
        if (arxivPapers.length > 0) {
          fallbackResources.push({
            type: "Research Papers (arXiv)",
            items: arxivPapers.map((paper: any) => ({
              title: paper.title,
              description: `${paper.description} • Published: ${paper.published}`,
              channel: paper.channel,
              link: paper.link,
            })),
          });
        }


        return NextResponse.json({
          success: true,
          topic,
          isResourceMode: true,
          aiResponse: `Here are learning resources for ${topic}`,
          resources: fallbackResources,
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
          content:
            "You are a helpful, friendly AI assistant. Provide clear, concise explanations and engage naturally in conversation.",
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