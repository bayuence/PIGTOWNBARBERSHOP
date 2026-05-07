"use client";

import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-red-900 flex items-center justify-center p-4 transition-all duration-300 hover:bg-gradient-to-br hover:from-black hover:to-red-800">
      <div className={`w-full max-w-md transform transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
        
        {/* Kartu Login dengan efek interaktif */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          
          {/* Header dengan latar putih */}
          <div className="bg-white p-6 text-center border-b border-gray-200 transition-colors duration-300 hover:bg-gray-50">
            <div className="mx-auto w-20 h-20 mb-3 flex items-center justify-center transition-transform duration-300 hover:scale-105">
              <Image
                src="/images/pigtown-logo.png"
                alt="Pigtown Barbershop Logo"
                width={80}
                height={80}
                priority
                className="object-contain transition-transform duration-300 hover:rotate-2"
                style={{ width: 'auto', height: 'auto', maxWidth: '80px', maxHeight: '80px' }}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-800 transition-colors duration-300 hover:text-red-600">PIGTOWN BARBERSHOP</h1>
            <p className="text-gray-600 text-sm mt-1 transition-colors duration-300 hover:text-gray-800">Sistem Manajemen Modern</p>
          </div>
          
          {/* Container Form */}
          <div className="p-8 transition-all duration-300 hover:bg-gray-50">
            <LoginForm />
          </div>
          
          {/* Footer dengan efek interaktif */}
          <div className="bg-gray-100 px-8 py-4 text-center transition-colors duration-300 hover:bg-gray-200">
            <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
              © 2025 | developed by{" "}
              <Link 
                href="https://www.instagram.com/bayuence_?igsh=MWFnNGEyc2xzcnBkOA==" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-800 font-medium transition-all duration-300 flex items-center gap-1 hover:gap-2 group"
              >
                {/* SVG Logo Instagram yang benar */}
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-4-10.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm7 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm-3.5 3a3.5 3.5 0 00-3.14 1.96 5.5 5.5 0 016.28 0A3.5 3.5 0 0012 12.5z"/>
                </svg>
                bayuence_
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}