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
    const chat = await prisma.chatHistory.create({
      data: {
        userId: user.id,
        topic: topic || 'General', // Add default if topic is missing
        query,
        response,
      },
    });
    return NextResponse.json(chat);

  } catch (error) {
     console.error("Failed to save chat to history:", error);
     return new NextResponse(JSON.stringify({ error: "Failed to save chat history" }), { status: 500 });
  }
}
