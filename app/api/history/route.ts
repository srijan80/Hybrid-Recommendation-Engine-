// app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// Define message type
type Message = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

// Define conversation type (matches Prisma include)
type ConversationWithMessages = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
};

export async function GET(req: Request) {
  const user = await getOrCreateUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      // Fetch a single conversation and/or resource by ID for "continue"
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      const resourceItem = await prisma.resourceHistory.findUnique({
        where: { id },
      });

      return NextResponse.json({ conversation, resourceItem });
    }

    // Fetch full history (for sidebar)
    const conversations: ConversationWithMessages[] = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    const chatHistory = conversations.map((c: ConversationWithMessages) => {
      const messages: Message[] = c.messages;

      const firstUser = messages.find((m: Message) => m.role === "user")?.content ?? "";
      const assistantCombined = messages
        .filter((m: Message) => m.role === "assistant")
        .map((m: Message) => m.content)
        .join("\n\n");

      return {
        id: c.id,
        topic: c.title,
        query: firstUser,
        response: assistantCombined,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messages,
      };
    });

    const resourceHistory = await prisma.resourceHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ chatHistory, resourceHistory });
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
