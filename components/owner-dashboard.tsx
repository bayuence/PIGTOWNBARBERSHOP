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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Icon Imports
import {
  DollarSign,
  Users,
  Settings,
  ArrowLeft,
  BarChart3,
  Eye,
  EyeOff,
  TrendingDown,
  Activity,
  Target,
  Award,
  RefreshCw,
  Menu,
  ChevronRight,
  Crown,
  Plus,
  Shield,
  Lock
} from "lucide-react"

// Supabase & Logic Imports
import {
  supabase,
  getCurrentUser,
  updateUserPin
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

// Komponen Utama
export function OwnerDashboard() {
  const router = useRouter()
  const { toast } = useToast()

  // State Management
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [showCurrentPin, setShowCurrentPin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountSettings, setAccountSettings] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    pin: "",
    currentPin: ""
  })
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "error">("disconnected")
  const [currentUserData, setCurrentUserData] = useState<any>(null)

  // Tab configuration untuk mobile responsive
  const tabsConfig = [
    { value: "overview", label: "Overview", icon: BarChart3, shortLabel: "Home" },
    { value: "employees", label: "Karyawan", icon: Users, shortLabel: "Staff" },
    { value: "branches", label: "Cabang", icon: Target, shortLabel: "Branch" },
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
      setAccountSettings((prev) => ({
        ...prev,
        email: user.email || "",
        pin: (user as any).pin || "",
        currentPin: (user as any).pin || "",
        currentPassword: "",
      }))
      
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

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi password
    if (accountSettings.newPassword && accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast({ title: "Error", description: "Password baru dan konfirmasi tidak cocok!", variant: "destructive" })
      return
    }
    
    // Validasi PIN
    if (accountSettings.pin && (accountSettings.pin.length !== 6 || !/^\d+$/.test(accountSettings.pin))) {
      toast({ title: "Error", description: "PIN harus 6 digit angka!", variant: "destructive" })
      return
    }

    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        toast({ title: "Error", description: "User tidak ditemukan!", variant: "destructive" })
        return
      }

      // Update email jika berubah
      if (currentUser.email !== accountSettings.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: accountSettings.email })
        if (emailError) throw emailError
      }

      // Update password jika diisi
      if (accountSettings.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: accountSettings.newPassword })
        if (passwordError) throw passwordError
      }

      // Update PIN di database
      if (accountSettings.pin !== accountSettings.currentPin) {
        const pinUpdated = await updateUserPin(currentUser.id, accountSettings.pin)
        if (!pinUpdated) {
          throw new Error("Gagal update PIN")
        }
      }

      // Update data user lainnya
      const { error: dbError } = await supabase
        .from("users")
        .update({ 
          email: accountSettings.email,
          pin: accountSettings.pin 
        })
        .eq("id", currentUser.id)

      if (dbError) throw dbError

      toast({ title: "Berhasil", description: "Pengaturan akun berhasil diperbarui!" })
      setSettingsOpen(false)
      setAccountSettings((prev) => ({ 
        ...prev, 
        currentPassword: "", 
        newPassword: "", 
        confirmPassword: "",
        currentPin: prev.pin // Update current pin dengan yang baru
      }))
      
    } catch (error: any) {
      console.error("Error updating settings:", error)
      toast({ title: "Error", description: `Gagal memperbarui pengaturan: ${error.message}`, variant: "destructive" })
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

                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-10 w-10 p-0 bg-gradient-to-r from-indigo-500/90 to-red-500/90 text-white border-0 shadow-lg">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/50 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings className="h-6 w-6 text-red-500 animate-pulse" />
                        Pengaturan Akun
                      </DialogTitle>
                      <DialogDescription>
                        Kelola pengaturan akun dan keamanan Anda di sini
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSettingsSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={accountSettings.email}
                          onChange={(e) => setAccountSettings((prev) => ({ ...prev, email: e.target.value }))}
                          className="bg-white/70 dark:bg-slate-800/70 border-slate-300 dark:border-slate-600 focus:border-red-500 focus:ring-red-500/50 backdrop-blur-sm transition-all duration-300"
                          placeholder="owner@example.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-sm font-medium">Password Baru (Opsional)</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={accountSettings.newPassword}
                            onChange={(e) => setAccountSettings((prev) => ({ ...prev, newPassword: e.target.value }))}
                            className="bg-white/70 dark:bg-slate-800/70 border-slate-300 dark:border-slate-600 focus:border-red-500 focus:ring-red-500/50 pr-10 backdrop-blur-sm transition-all duration-300"
                            placeholder="Masukkan password baru"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ?
                              <EyeOff className="h-4 w-4 text-slate-500 hover:text-slate-700 transition-colors duration-200" /> :
                              <Eye className="h-4 w-4 text-slate-500 hover:text-slate-700 transition-colors duration-200" />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">Konfirmasi Password Baru</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={accountSettings.confirmPassword}
                          onChange={(e) => setAccountSettings((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          className="bg-white/70 dark:bg-slate-800/70 border-slate-300 dark:border-slate-600 focus:border-red-500 focus:ring-red-500/50 backdrop-blur-sm transition-all duration-300"
                          placeholder="Konfirmasi password baru"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currentPin" className="text-sm font-medium">PIN Saat Ini</Label>
                        <div className="relative">
                          <Input
                            id="currentPin"
                            type={showCurrentPin ? "text" : "password"}
                            value={accountSettings.currentPin}
                            disabled
                            className="bg-gray-100 dark:bg-slate-800/70 border-slate-300 dark:border-slate-600 pr-10 backdrop-blur-sm"
                            placeholder="PIN saat ini"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPin(!showCurrentPin)}
                          >
                            {showCurrentPin ?
                              <EyeOff className="h-4 w-4 text-slate-500 hover:text-slate-700 transition-colors duration-200" /> :
                              <Eye className="h-4 w-4 text-slate-500 hover:text-slate-700 transition-colors duration-200" />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pin" className="text-sm font-medium">PIN Baru (6 digit)</Label>
                        <div className="relative">
                          <Input
                            id="pin"
                            type={showPin ? "text" : "password"}
                            value={accountSettings.pin}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setAccountSettings((prev) => ({ ...prev, pin: value }));
                            }}
                            className="bg-white/70 dark:bg-slate-800/70 border-slate-300 dark:border-slate-600 focus:border-red-500 focus:ring-red-500/50 pr-10 backdrop-blur-sm transition-all duration-300"
                            placeholder="123456"
                            maxLength={6}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPin(!showPin)}
                          >
                            {showPin ?
                              <EyeOff className="h-4 w-4 text-slate-500 hover:text-slate-700 transition-colors duration-200" /> :
                              <Eye className="h-4 w-4 text-slate-500 hover:text-slate-700 transition-colors duration-200" />
                            }
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PIN digunakan untuk autentikasi akses ke dashboard
                        </p>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          Simpan Perubahan
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSettingsOpen(false)}
                          className="bg-white/70 dark:bg-slate-800/70 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-300"
                        >
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
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

                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button className="group gap-2 bg-gradient-to-r from-indigo-500/90 to-red-500/90 text-white border-0 hover:from-indigo-600/90 hover:to-red-600/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 backdrop-blur-sm">
                      <Settings className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                      <span>Settings</span>
                    </Button>
                  </DialogTrigger>
                </Dialog>
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


