// app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserFromAuth } from "@/lib/auth";

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
  try {
    // Use the API-route-safe auth function
    const user = await getOrCreateUserFromAuth();

    if (!user) {
      console.warn("❌ History GET: User not found or not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // If ID is provided, fetch single item
    if (id) {
      const conversation = await prisma.conversation.findFirst({
        where: { id, userId: user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      const resourceItem = await prisma.resourceHistory.findFirst({
        where: { id, userId: user.id },
      });

      return NextResponse.json({ 
        conversation: conversation || null, 
        resourceItem: resourceItem || null 
      });
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
    console.error("❌ Failed to fetch history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}