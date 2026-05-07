"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

interface User {
    email: string
    role: string
    loginTime: string
    name?: string
    [key: string]: any
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState < User | null > (null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false) // Lifted state for sidebar collapse
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const userData = localStorage.getItem("user")
        if (!userData) {
            router.push("/login")
            return
        }
        setUser(JSON.parse(userData))
        setTimeout(() => setIsLoaded(true), 100)
    }, [router])

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-red-400/50 border-t-red-400 rounded-full animate-spin" />
            </div>
        )
    }

    // Check if current route is Owner Dashboard
    const isOwnerRoute = pathname === "/owner"

    return (
        <div className={`min-h-screen ${isOwnerRoute ? '' : 'bg-gradient-to-br from-red-50 to-white'} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {/* Sidebar - z-50 */}
            <Sidebar
                user={user}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                collapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            {/* Overlay untuk mobile - z-40, di bawah sidebar tapi di atas konten */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main content area - DYNAMIC MARGIN berdasarkan collapsed state */}
            <div className={`min-h-screen flex flex-col transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-64"
                }`}>
                {/* Header MERAH - SKIP untuk Owner Dashboard */}
                {!isOwnerRoute && <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />}

                {/* Main content - full height container */}
                <main className="flex-1 flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    )
}
