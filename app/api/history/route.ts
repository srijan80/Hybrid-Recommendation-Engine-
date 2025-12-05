// app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  const user = await getOrCreateUser();

  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: "User not authenticated or synced to DB" }),
      { status: 401 }
    );
  }

  try {
    const chatHistory = await prisma.chatHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const resourceHistory = await prisma.resourceHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ chatHistory, resourceHistory });
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch history" }),
      { status: 500 }
    );
  }
}
