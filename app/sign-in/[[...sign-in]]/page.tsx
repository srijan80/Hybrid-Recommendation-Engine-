import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Left Side */}
      <div className="hidden md:flex w-1/2 bg-blue-600 items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center px-4">
          HYBRID RECOMMENDATION ENGINE
        </h1>
      </div>

      {/* Right Side */}
      <div className="flex w-full md:w-1/2 items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">
            Welcome Back 👋
          </h1>
          <p className="text-gray-500 text-center mb-6 text-sm">
            Sign in to continue your journey
          </p>

          {/* Clerk Sign In */}
          <SignIn
            appearance={{
              elements: {
                headerTitle: { display: "none" },
                headerSubtitle: { display: "none" },
                formButtonPrimary: "bg-black hover:bg-gray-900 text-white",
                footerActionLink: "text-black hover:underline",
                card: "shadow-none border-none",
              },
            }}
          />

        </div>
      </div>
    </div>
  );
}
