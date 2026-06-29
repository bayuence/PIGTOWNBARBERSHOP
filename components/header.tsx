"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface User {
  name?: string
  email?: string
  position?: string
  [key: string]: any
}

interface HeaderProps {
  user: User
  onMenuClick?: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }, 1000)

    // Handle scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      clearInterval(timer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <header className={`sticky top-0 z-30 px-4 md:px-6 py-2 md:py-4 transition-all duration-300 ${isScrolled
        ? "bg-gradient-to-r from-red-900 via-red-800 to-black shadow-xl border-b border-red-900 backdrop-blur-sm"
        : "bg-gradient-to-r from-red-900 via-red-800 to-black border-b border-red-800"
      }`}>
      <div className="flex items-center justify-between">
        {/* Menu Button - Modern Circular Style untuk Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden bg-red-700/80 text-white hover:bg-red-600 rounded-full p-1.5 shadow-lg border-2 border-red-600/50 transition-all duration-300 transform hover:scale-110 mr-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Welcome Message dengan efek interaktif */}
        <div className="group cursor-pointer flex-1">
          <h1 className="text-base md:text-2xl font-bold text-white transition-all duration-300">
            <span className="text-white block">
              Hallo pig!!!
            </span>
          </h1>
          <p className="text-[10px] md:text-sm text-red-300/80 transition-all duration-300 group-hover:text-red-200 mt-0.5 md:mt-1">
            {currentTime}
          </p>
        </div>

        {/* Sisi kanan sengaja dikosongkan */}
        <div className="w-10 lg:block hidden"> {/* Spacer minimal untuk balance */}</div>
      </div>

      {/* Progress Bar untuk waktu (efek visual) */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-red-700 animate-pulse w-full opacity-60" />
    </header>
  )
}