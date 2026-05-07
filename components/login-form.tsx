"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        // Increment failed attempts
        setFailedAttempts(prev => prev + 1)
        
        // Handle specific error messages
        let errorMessage = error.message
        
        // Check for common error types
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email atau password salah. Silakan coba lagi."
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email belum diverifikasi. Periksa inbox Anda."
        }

        toast.error("Login Gagal", {
          description: errorMessage,
          duration: 5000,
        })
        
        // Show help message after 3 failed attempts
        if (failedAttempts >= 2) {
          setTimeout(() => {
            toast.info("Butuh Bantuan?", {
              description: "Jika Anda lupa password atau mengalami kendala, silakan hubungi @bayuence_ di Instagram untuk bantuan.",
              duration: 8000,
            })
          }, 1000)
        }
        
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Reset failed attempts on success
        setFailedAttempts(0)
        
        // Store user session from auth only
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          position: data.user.user_metadata?.position || 'Owner',
          loginTime: new Date().toISOString(),
        }

        localStorage.setItem("user", JSON.stringify(userData))

        toast.success("Login Berhasil", {
          description: `Selamat datang, ${userData.name}!`,
        })

        setTimeout(() => {
          router.push("/dashboard")
          setIsLoading(false)
        }, 100)
      }
    } catch (error) {
      console.error("Login error:", error)
      
      // Increment failed attempts
      setFailedAttempts(prev => prev + 1)
      
      // Handle network errors specifically
      let errorMessage = "Terjadi kesalahan saat login"
      
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi."
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error("Koneksi Gagal", {
        description: errorMessage,
        duration: 5000,
      })
      
      // Show help message after 3 failed attempts
      if (failedAttempts >= 2) {
        setTimeout(() => {
          toast.info("Butuh Bantuan?", {
            description: "Jika Anda mengalami kendala terus-menerus, silakan hubungi @bayuence_ di Instagram untuk bantuan.",
            duration: 8000,
          })
        }, 1000)
      }
      
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div>
      {/* Login Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Masuk Akun</h2>
        <p className="text-gray-600 text-sm">Silahkan masuk dengan akun Anda</p>
      </div>

      {/* Warning message after failed attempts */}
      {failedAttempts >= 3 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                Login Gagal {failedAttempts}x
              </h3>
              <p className="text-xs text-amber-800 mb-2">
                Pastikan email dan password Anda benar. Jika Anda lupa password atau mengalami kendala,
              </p>
              <Link
                href="https://www.instagram.com/bayuence_?igsh=MWFnNGEyc2xzcnBkOA=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Hubungi @bayuence_ untuk bantuan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="user@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 transition-all duration-200 hover:border-gray-400"
            required
          />
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 pr-12 transition-all duration-200 hover:border-gray-400"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 rounded-md hover:bg-gray-100"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700 text-white mt-6 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Memproses...
            </div>
          ) : (
            "Masuk Sekarang"
          )}
        </Button>
        
        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Lupa password?{" "}
            <Link
              href="https://www.instagram.com/bayuence_?igsh=MWFnNGEyc2xzcnBkOA=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Hubungi Ence
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}