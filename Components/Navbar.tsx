'use client';
import { Send, Sparkles, User, Bot } from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { SignedOut, SignedIn, UserButton } from '@clerk/nextjs';

export default function Navbar() {
  const router = useRouter();
  return (
    <nav className="bg-gray-200 shadow-sm py-4 px-6 flex items-center justify-between">
       <div
      onClick={() => router.refresh()}
      className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2"
    >
      <Sparkles className="w-6 h-6 text-blue-400" />
      Hybrid Recommendation Engine
    </div>

      {/* Right Side: Auth Buttons */}
      <div className="flex items-center gap-4">
        <SignedOut>
          <Link
            href="/sign-in"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </SignedOut>
        
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}   