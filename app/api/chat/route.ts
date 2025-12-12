// api/chat/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { query, response, topic } = await req.json();
  
  const user = await getOrCreateUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "User not authenticated or synced to DB" }), { status: 401 });
  }

  try {
    const clientAny = prisma as any;

    if (clientAny.conversation && typeof clientAny.conversation.create === "function") {
      // Create a conversation and associated messages using new models
      const conversation = await clientAny.conversation.create({
        data: {
          userId: user.id,
          title: topic || 'General',
          messages: { create: [{ role: 'user', content: query }, { role: 'assistant', content: response }] },
        },
        include: { messages: true },
      });
      return NextResponse.json(conversation);
    }

    // Fallback to legacy chatHistory
    const legacy = await clientAny.chatHistory.create({ data: { userId: user.id, topic: topic || 'General', query, response } });
    return NextResponse.json(legacy);

  } catch (error) {
     console.error("Failed to save chat to history:", error);
     return new NextResponse(JSON.stringify({ error: "Failed to save chat history" }), { status: 500 });
  }
}
