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
    // If the new Conversation model exists on the generated client, use it.
    const clientAny = prisma as any;

    let chatHistory: any[] = [];

    if (clientAny.conversation && typeof clientAny.conversation.findMany === "function") {
      const conversations = await clientAny.conversation.findMany({
        where: { userId: user.id },
        include: { messages: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      });

      // Map conversations into a shape compatible with the previous chatHistory consumer
      chatHistory = conversations.map((c: any) => {
        const firstUser = c.messages.find((m: any) => m.role === "user")?.content ?? "";
        const assistantCombined = c.messages
          .filter((m: any) => m.role === "assistant")
          .map((m: any) => m.content)
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
    } else {
      // Fallback for environments where Prisma client hasn't been regenerated yet
      const legacy = await (prisma as any).chatHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      chatHistory = legacy.map((h: any) => ({
        id: h.id,
        topic: h.topic || h.title || "",
        query: h.query || "",
        response: h.response || "",
        createdAt: h.createdAt,
        updatedAt: h.createdAt,
        // Preserve legacy single-response as a single assistant message for compatibility
        messages: h.response ? [{ role: "assistant", content: h.response, createdAt: h.createdAt }] : [],
      }));
    }

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