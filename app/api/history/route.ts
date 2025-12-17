// app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// GET all history
export async function GET() {
  const user = await getOrCreateUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch conversations with messages
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    // Map to chat history format for UI compatibility
    // @ts-ignore
    const chatHistory = conversations.map((c) => {
      // @ts-ignore
      const firstUser = c.messages.find((m) => m.role === "user")?.content ?? "";
      const assistantCombined = c.messages
        // @ts-ignore
        .filter((m) => m.role === "assistant")
        // @ts-ignore
        .map((m) => m.content)
        .join("\n\n");

      return {
        id: c.id,
        topic: c.title,
        query: firstUser,
        response: assistantCombined,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messages: c.messages,
      };
    });

    // Fetch resource history
    const resourceHistory = await prisma.resourceHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ chatHistory, resourceHistory });
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}