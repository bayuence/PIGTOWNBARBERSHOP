"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { useIsMobile } from "@/hooks/use-mobile"

interface User {
  email: string
  position: string
  loginTime: string
  name?: string
  [key: string]: any
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState < User | null > (null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
    // Tambahkan delay kecil untuk animasi
    setTimeout(() => setIsLoaded(true), 100)
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center transition-all duration-500">
        <div className="w-10 h-10 border-3 border-red-400/50 border-t-red-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-red-50 to-white transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Overlay untuk mobile saat sidebar terbuka */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-4 md:p-6 transition-all duration-300 hover:shadow-xl hover:border-red-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}