"use client";
import { useEffect } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  useEffect(() => {
    const words = document.querySelectorAll(".animated-word");
    
    // Initial fade-in animation
    words.forEach((word, index) => {
      const htmlElement = word as HTMLElement;
      setTimeout(() => {
        htmlElement.style.opacity = "0";
        htmlElement.style.transform = "translateY(30px)";
        
        setTimeout(() => {
          htmlElement.style.transition = "all 0.9s cubic-bezier(0.215, 0.610, 0.355, 1.000)";
          htmlElement.style.opacity = "1";
          htmlElement.style.transform = "translateY(0)";
        }, 50);
      }, index * 150 + 200);
    });

    // Continuous loop animation
    const animateWords = () => {
      words.forEach((word, index) => {
        const htmlElement = word as HTMLElement;
        setTimeout(() => {
          // Scale and glow effect
          htmlElement.style.transform = "scale(1.05) translateY(-5px)";
          htmlElement.style.textShadow = "0 0 20px rgba(99, 102, 241, 0.3)";
          
          setTimeout(() => {
            htmlElement.style.transform = "scale(1) translateY(0)";
            htmlElement.style.textShadow = "none";
          }, 600);
        }, index * 400);
      });
    };

    // Start loop after initial animation
    const loopInterval = setInterval(animateWords, 3000);
    setTimeout(animateWords, 2000);

    return () => clearInterval(loopInterval);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white via-indigo-50 to-purple-50 font-sans relative overflow-hidden p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full max-w-7xl gap-8 lg:gap-12">
        {/* Left Section - Text */}
        <div className="flex flex-col items-center lg:items-start justify-center space-y-4 lg:space-y-6 flex-1 text-center lg:text-left px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-800 drop-shadow-sm leading-tight select-none">
            <span className="block animated-word transition-all duration-500">
              HYBRID
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 animated-word transition-all duration-500">
              RECOMMENDATION
            </span>
            <span className="block animated-word transition-all duration-500">
              ENGINE
            </span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-md lg:max-w-lg">
            Discover personalized content tailored just for you with our intelligent hybrid recommendation system
          </p>
        </div>

        {/* Right Section - Sign In Form */}
         <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">   
            <SignIn
              appearance={{
                elements: {
                  headerTitle: { display: "none" },
                  headerSubtitle: { display: "none" },
                  formButtonPrimary:
                    "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-md transition-all",
                  footerActionLink: "text-indigo-600 hover:underline font-medium",
                  card: "shadow-none border-none",
                  formFieldInput:
                    "border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2",
                },
              }}
            />
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @media (max-width: 640px) {
          .animated-word {
            font-size: clamp(2rem, 8vw, 3rem);
          }
        }
      `}</style>
    </div>
  );
}