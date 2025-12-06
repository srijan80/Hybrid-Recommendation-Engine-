// lib/auth.ts
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { User } from "@prisma/client";

export async function getOrCreateUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    console.error("Authentication Error: No user logged in via Clerk.");
    return null;
  }

  try {
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!user) {
      console.log(`Creating new DB user for Clerk ID: ${clerkUser.id}`);// Fixed: Use backticks
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: clerkUser.firstName ?? `User ${clerkUser.id.substring(0, 5)}`,
          imageUrl: clerkUser.imageUrl,
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Database Error in getOrCreateUser:", error);
    return null;
  }
}