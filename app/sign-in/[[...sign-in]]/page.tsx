"use client";
import { SignIn } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";

export default function SignInPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(-5, 5, 5);
    scene.add(ambientLight, pointLight, directionalLight);

    // Torus Knot (centered)
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4f46e5, // indigo-600
      emissive: 0x60a5fa, // blue-400 glow
      metalness: 0.9,
      roughness: 0.2,
    });
    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    // Particles (subtle floating dots)
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 10;

      colors[i] = 0.7 + Math.random() * 0.3;
      colors[i + 1] = 0.7 + Math.random() * 0.3;
      colors[i + 2] = 0.9 + Math.random() * 0.1;
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.005;
      torusKnot.rotation.x = Math.sin(time) * 0.1 + time * 0.03;
      torusKnot.rotation.y = Math.cos(time) * 0.1 + time * 0.03;
      particles.rotation.y = time * 0.03;
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    setTimeout(() => setIsLoaded(true), 800);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Animate text
  useEffect(() => {
    if (isLoaded) {
      gsap.fromTo(
        ".animated-text",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 }
      );
    }
  }, [isLoaded]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans overflow-hidden relative">
      {/* Fullscreen 3D Background */}
      <div ref={canvasRef} className="absolute inset-0 z-0" />

      
{/* Content Container */}
<div className="relative z-10 flex items-center w-full max-w-7xl px-6 py-8">
  {/* Left Side: Title — takes more space */}
  <div className="flex flex-col items-start justify-center space-y-6 flex-1 min-w-0 pr-8">
    <h1 className="text-4xl md:text-6xl font-bold text-gray-800 drop-shadow-sm leading-tight">
      <span className="block animated-text">HYBRID</span>
      <span className="block text-indigo-600 animated-text">RECOMMENDATION</span>
      <span className="block animated-text">ENGINE</span>
    </h1>
  </div>

  {/* Right Side: Auth form — pinned to the right */}
  <div className="flex-shrink-0 w-full max-w-md">
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex flex-col items-center justify-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Welcome 👋</h2>
        <p className="text-gray-500 text-sm">Sign in to continue your journey</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            headerTitle: { display: "none" },
            headerSubtitle: { display: "none" },
            formButtonPrimary:
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-md transition-all",
            footerActionLink: "text-indigo-600 hover:underline font-medium",
            card: "shadow-none border-none",
            formFieldInput: "border-gray-300 focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2",
          },
        }}
      />
    </div>
  </div>
</div>

    </div>
  );
}