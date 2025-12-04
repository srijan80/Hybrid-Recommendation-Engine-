import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="">
        
        {/* Header */}
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">
          Welcome Back 👋
        </h1>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Sign in to continue your journey
        </p>

        {/* Clerk Sign In Element */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
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
