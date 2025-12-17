// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// POST - Create new conversation
export async function POST(req: Request) {
  const user = await getOrCreateUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userMessage, assistantResponse, title } = await req.json();

    // Generate title from first message if not provided
    const conversationTitle = title || userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: conversationTitle,
      },
    });

    // Create user message
    if (userMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: userMessage,
        },
      });
    }

    // Create assistant response
    if (assistantResponse) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: assistantResponse,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      conversationId: conversation.id 
    });
  } catch (error) {
    console.error("Failed to create chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}