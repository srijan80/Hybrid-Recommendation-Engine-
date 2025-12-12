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
      const conversation = await prisma.conversation.findFirst({
        where: { id, userId: user.id },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await prisma.conversation.delete({ where: { id } });
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
      const clientAny = prisma as any;

      if (clientAny.conversation && typeof clientAny.conversation.findFirst === "function") {
        const conversation = await clientAny.conversation.findFirst({
          where: { id, userId: user.id },
          include: { messages: true },
        });

        if (!conversation) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ item: conversation, type: "chat" });
      }

      // Fallback: legacy chatHistory
      const legacy = await (prisma as any).chatHistory.findFirst({ where: { id, userId: user.id } });
      if (!legacy) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Map legacy to compatible shape: include messages as single assistant message
      const mapped = {
        id: legacy.id,
        title: legacy.topic || legacy.title || "",
        query: legacy.query || "",
        response: legacy.response || "",
        createdAt: legacy.createdAt,
        updatedAt: legacy.createdAt,
        messages: legacy.response ? [{ role: "assistant", content: legacy.response, createdAt: legacy.createdAt }] : [],
      };

      return NextResponse.json({ item: mapped, type: "chat" });
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
      const clientAny = prisma as any;

      if (clientAny.conversation && typeof clientAny.conversation.update === "function") {
        // Update conversation title only. Message edits are not handled here.
        const updated = await clientAny.conversation.update({
          where: { id },
          data: {
            title: topic || undefined,
          },
          include: { messages: true },
        });

        return NextResponse.json({ success: true, item: updated });
      }

      // Fallback: update legacy chatHistory fields
      const updatedLegacy = await (prisma as any).chatHistory.update({
        where: { id },
        data: {
          topic: topic || undefined,
          query: query || undefined,
          response: response || undefined,
        },
      });

      return NextResponse.json({ success: true, item: updatedLegacy });
    } else if (type === "resources") {
      const updated = await prisma.resourceHistory.update({
        where: { id },
        data: {
          title: topic || undefined,
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