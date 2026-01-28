// lib/auth.ts
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateUser(): Promise<any | null> {
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

// For API routes - uses auth() which is more reliable than currentUser()
export async function getOrCreateUserFromAuth(): Promise<any | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.error("Authentication Error: No userId from Clerk.");
      return null;
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // If user doesn't exist, we need to get their info from Clerk to create them
    if (!user) {
      const clerkUser = await currentUser();
      if (clerkUser) {
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            name: clerkUser.firstName ?? `User ${userId.substring(0, 5)}`,
            imageUrl: clerkUser.imageUrl,
          },
        });
        console.log(`✅ Created new user from auth: ${userId}`);
      } else {
        // Create with minimal data if we can't get Clerk user
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            name: `User ${userId.substring(0, 5)}`,
          },
        });
        console.log(`✅ Created new user (minimal data): ${userId}`);
      }
    }

    return user;
  } catch (error) {
    console.error("Database Error in getOrCreateUserFromAuth:", error);
    return null;
  }
}