"use client"

// React & Next.js Imports
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

// UI Component Imports
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Icon Imports
import {
  DollarSign,
  Users,
  ArrowLeft,
  BarChart3,
  TrendingDown,
  Activity,
  Target,
  Award,
  RefreshCw,
  Menu,
  ChevronRight,
  Crown,
  Plus
} from "lucide-react"

// Supabase & Logic Imports
import {
  supabase,
  getCurrentUser
} from "@/lib/supabase"

// Komponen Fungsional
import { TransactionHistory } from "./transaction-history"
import { CashierManagement } from "./cashier-management"
import { ComprehensiveReports } from "./comprehensive-reports"
import BranchManagement from "./branch-management"
import { EmployeeManagement } from "./employee-management"
import PointsManagement from "./points-management"
import KasbonManagement from "./kasbon-management"
import { KelolaPengeluaranCabang } from "./kelolapengeluarancabang"
import { OverviewAndAnalytics } from "./overviewdananalytic"
import SetoranManagement from "./setoran-management"

// Komponen Utama
export function OwnerDashboard() {
  const router = useRouter()
  const { toast } = useToast()

  // State Management
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "error">("disconnected")
  const [currentUserData, setCurrentUserData] = useState<any>(null)

  // Tab configuration untuk mobile responsive
  const tabsConfig = [
    { value: "overview", label: "Overview", icon: BarChart3, shortLabel: "Home" },
    { value: "employees", label: "Karyawan", icon: Users, shortLabel: "Staff" },
    { value: "branches", label: "Cabang", icon: Target, shortLabel: "Branch" },
    { value: "setoran", label: "Setoran", icon: DollarSign, shortLabel: "Deposit" },
    { value: "points", label: "Poin", icon: Award, shortLabel: "Point" },
    { value: "kasbon", label: "Kasbon", icon: DollarSign, shortLabel: "Loan" },
    { value: "pengeluaran", label: "Pengeluaran", icon: TrendingDown, shortLabel: "Expense" },
    { value: "transactions", label: "Transaksi", icon: Activity, shortLabel: "Trans" },
    { value: "cashiers", label: "Kasir", icon: Users, shortLabel: "Cashier" },
    { value: "reports", label: "Laporan", icon: BarChart3, shortLabel: "Report" }
  ]

  // Initialize dashboard - PIN handled by page.tsx
  useEffect(() => {
    const initializeDashboard = async () => {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      setCurrentUserData(user)
      setLoading(false)
      testDatabaseConnection()
    }

    initializeDashboard()
  }, [])

  // Fungsi Test Koneksi Database
  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      if (error) {
        console.error('❌ Database connection failed:', error)
        setConnectionStatus('error')
        return false
      }

      setConnectionStatus('connected')
      return true
    } catch (error) {
      console.error('❌ Database connection error:', error)
      setConnectionStatus('error')
      return false
    }
  }



  // Loading State dengan tampilan modern
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="text-center space-y-8 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200/30 border-t-red-500 rounded-full animate-spin mx-auto"></div>
            <div className="w-16 h-16 border-4 border-rose-200/30 border-t-rose-500 rounded-full animate-spin mx-auto absolute inset-0 m-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="w-12 h-12 border-4 border-orange-200/30 border-t-orange-500 rounded-full animate-spin mx-auto absolute inset-0 m-auto" style={{ animationDuration: '2s' }}></div>
          </div>
          <div className="space-y-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-white via-red-200 to-rose-200 bg-clip-text text-transparent animate-pulse">
              Loading Dashboard
            </div>
            <div className="text-red-300 text-lg">Mengambil data real-time dari database...</div>
            <div className="flex justify-center space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main Dashboard Content */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-red-900 dark:to-slate-900 relative overflow-hidden">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/20 dark:bg-red-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 dark:bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Connection Status Indicator - Enhanced */}
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border transition-all duration-300 shadow-lg ${connectionStatus === 'connected'
              ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 shadow-green-500/20'
              : connectionStatus === 'error'
                ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 shadow-red-500/20'
                : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 shadow-yellow-500/20'
            }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                }`} />
              {connectionStatus === 'connected' ? '✅ Terhubung' :
                connectionStatus === 'error' ? '❌ Error' : '⚠️ Menghubungkan'}
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8 p-4 lg:p-6">
          {/* Enhanced Header - Mobile Optimized */}
          <div className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
            {/* Mobile: Compact Single Row Layout */}
            <div className="lg:hidden flex items-center justify-between p-4 gap-3">
              {/* Left: Back Button + Logo + Title (Horizontal) */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push("/dashboard")} 
                  className="flex-shrink-0 h-10 w-10 p-0 bg-gradient-to-r from-red-500/80 to-rose-500/80 text-white border-0 hover:from-red-600/90 hover:to-rose-600/90 shadow-lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <Image 
                  src="/images/pigtown-logo.png" 
                  alt="Pigtown Logo"
                  width={48}
                  height={48}
                  className="object-contain flex-shrink-0"
                  style={{ width: 'auto', height: 'auto', maxWidth: '48px', maxHeight: '48px' }}
                />
                
                <div className="flex flex-col min-w-0 flex-1">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 dark:from-red-400 dark:via-rose-400 dark:to-orange-400 bg-clip-text text-transparent leading-tight truncate">
                    Owner Dashboard
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight truncate">
                    Kontrol penuh operasional
                  </p>
                </div>
              </div>
              
              {/* Right: Action Buttons (Icon Only) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  className={`h-10 w-10 p-0 backdrop-blur-md transition-all ${realTimeEnabled
                      ? 'bg-green-500/20 text-green-700 border-green-500/30'
                      : 'bg-gray-500/20 text-gray-700 border-gray-500/30'
                    }`}
                >
                  <RefreshCw className={`h-4 w-4 ${realTimeEnabled ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {/* Desktop: Original Layout */}
            <div className="hidden lg:flex items-center justify-between p-6 lg:p-8">
              <div className="flex items-start gap-4 lg:gap-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push("/dashboard")} 
                  className="group gap-2 bg-gradient-to-r from-red-500/80 to-rose-500/80 text-white border-0 hover:from-red-600/90 hover:to-rose-600/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 backdrop-blur-sm mt-3"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
                  Kembali
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0 group">
                    <div>
                      <Image 
                        src="/images/pigtown-logo.png" 
                        alt="Pigtown Logo"
                        width={80}
                        height={80}
                        className="object-contain animate-bounce transition-all duration-300 group-hover:scale-125 group-hover:rotate-12"
                        style={{ width: 'auto', height: 'auto', maxWidth: '80px', maxHeight: '80px' }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl transition-all duration-300 group-hover:bg-blue-400/30 group-hover:blur-2xl" />
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 dark:from-red-400 dark:via-rose-400 dark:to-orange-400 bg-clip-text text-transparent leading-none">
                      Owner Dashboard
                    </h1>
                    <p className="text-base lg:text-lg text-slate-600 dark:text-slate-400 font-medium mt-1 leading-none">
                      Kelola seluruh operasional dengan data real-time dan analytics mendalam
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  className={`gap-2 backdrop-blur-md transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${realTimeEnabled
                      ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30 hover:bg-gray-500/30'
                    }`}
                >
                  <RefreshCw className={`h-4 w-4 ${realTimeEnabled ? 'animate-spin' : ''}`} />
                  <span>Realtime: {realTimeEnabled ? 'ON' : 'OFF'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/80 via-white/60 to-slate-50/80 dark:from-slate-800/80 dark:via-slate-900/60 dark:to-slate-800/80 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center justify-between p-4">

                  {/* Mobile Navigation Sheet */}
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="sm:hidden bg-gradient-to-r from-red-500/20 to-rose-500/20 backdrop-blur-md border-white/30 text-slate-700 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300"
                      >
                        <Menu className="h-4 w-4 mr-2" />
                        Menu
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-80 bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-xl border-r border-white/10"
                    >
                      <SheetHeader className="mb-6">
                        <SheetTitle className="text-white flex items-center gap-2">
                          <Crown className="h-5 w-5 text-yellow-400 animate-pulse" />
                          Navigation Menu
                        </SheetTitle>
                        <SheetDescription className="text-slate-300">
                          Pilih menu yang ingin Anda akses
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-2">
                        {tabsConfig.map((tab, index) => (
                          <Button
                            key={tab.value}
                            variant={activeTab === tab.value ? "default" : "ghost"}
                            className={`w-full justify-start group relative overflow-hidden transition-all duration-300 ${activeTab === tab.value
                                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30'
                                : 'text-slate-300 hover:text-white hover:bg-white/10'
                              }`}
                            onClick={() => {
                              setActiveTab(tab.value)
                              setMobileMenuOpen(false)
                            }}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <tab.icon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                            <span className="font-medium relative z-10">{tab.label}</span>
                            {activeTab === tab.value && (
                              <ChevronRight className="h-4 w-4 ml-auto animate-pulse relative z-10" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Desktop Tab Navigation */}
                  <div className="hidden sm:block w-full">
                    <TabsList className="w-full h-auto p-2 bg-gradient-to-r from-white/30 via-white/20 to-white/30 dark:from-white/10 dark:via-white/5 dark:to-white/10 backdrop-blur-md border border-white/30 dark:border-white/20 rounded-2xl shadow-lg">
                      <div className="flex flex-wrap justify-center gap-1 w-full">
                        {tabsConfig.map((tab, index) => (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className={`group relative overflow-hidden px-3 sm:px-4 lg:px-5 py-3 rounded-xl font-medium transition-all duration-500 hover:scale-105 flex-1 min-w-[80px] max-w-[140px] ${activeTab === tab.value
                                ? 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-600 text-white shadow-xl shadow-red-500/30'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
                              }`}
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 relative z-10 justify-center">
                              <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 group-hover:rotate-12 transition-transform duration-300" />
                              <span className="text-[10px] sm:text-xs lg:text-sm leading-none whitespace-nowrap">{window.innerWidth < 640 ? tab.shortLabel : tab.label}</span>
                            </div>
                          </TabsTrigger>
                        ))}
                      </div>
                    </TabsList>
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-6 relative">
                <TabsContent value="overview" className="space-y-6 mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-rose-500/5 to-blue-500/5 rounded-2xl blur-xl"></div>
                    <OverviewAndAnalytics
                      onRefreshData={() => testDatabaseConnection()}
                      realTimeEnabled={realTimeEnabled}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="employees" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <EmployeeManagement />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="branches" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-rose-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <BranchManagement />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="setoran" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <SetoranManagement />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="points" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <PointsManagement />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="kasbon" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-rose-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <KasbonManagement />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pengeluaran" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-rose-500/5 to-red-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <KelolaPengeluaranCabang />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-blue-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <TransactionHistory />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cashiers" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-red-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <CashierManagement />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-rose-500/5 to-red-500/5 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
                      <ComprehensiveReports />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

        </div>
      </div>
    </>
  )
}


