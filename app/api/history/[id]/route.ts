// app/api/history/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// DELETE single history item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "chat") {
      const chatItem = await prisma.chatHistory.findFirst({
        where: { id, userId: user.id },
      });

      if (!chatItem) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await prisma.chatHistory.delete({ where: { id } });
    } else if (type === "resources") {
      const resourceItem = await prisma.resourceHistory.findFirst({
        where: { id, userId: user.id },
      });

      if (!resourceItem) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await prisma.resourceHistory.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Failed to delete history:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

// GET single history item (for continue conversation)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "chat") {
      const chatItem = await prisma.chatHistory.findFirst({
        where: { id, userId: user.id },
      });

      if (!chatItem) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ item: chatItem, type: "chat" });
    } else if (type === "resources") {
      const resourceItem = await prisma.resourceHistory.findFirst({
        where: { id, userId: user.id },
      });

      if (!resourceItem) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ item: resourceItem, type: "resources" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to fetch history item:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// PATCH - Update/Edit history item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { topic, query, response, resources, type } = await req.json();

    if (type === "chat") {
      const updated = await prisma.chatHistory.update({
        where: { id },
        data: {
          topic: topic || undefined,
          query: query || undefined,
          response: response || undefined,
        },
      });

      return NextResponse.json({ success: true, item: updated });
    } else if (type === "resources") {
      const updated = await prisma.resourceHistory.update({
        where: { id },
        data: {
          topic: topic || undefined,
          query: query || undefined,
          resources: resources || undefined,
        },
      });

      return NextResponse.json({ success: true, item: updated });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update history:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}