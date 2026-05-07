"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Shield, Lock, Eye, EyeOff, AlertCircle, Loader2, User } from "lucide-react"
import { supabase, getCurrentUser } from "@/lib/supabase"

interface PinAuthenticationProps {
  isOpen: boolean
  onSuccess: (userData: any) => void  // Sekarang mengembalikan data user
  onCancel: () => void
  title?: string
  description?: string
}

export function PinAuthentication({ 
  isOpen, 
  onSuccess, 
  onCancel, 
  title = "Autentikasi PIN",
  description = "Masukkan PIN 6 digit untuk melanjutkan"
}: PinAuthenticationProps) {
  const [pin, setPin] = useState(["", "", "", "", "", ""])
  const [showPin, setShowPin] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const MAX_ATTEMPTS = 5  // Lebih banyak attempt karena lebih fleksibel
  const LOCK_DURATION = 180000 // 3 minutes in milliseconds

  useEffect(() => {
    if (isOpen) {
      // Reset state ketika modal dibuka
      setPin(["", "", "", "", "", ""])
      setAttempts(0)
      setIsLocked(false)
      setLockTimeRemaining(0)
      setIsLoading(false)
      
      // Focus ke input pertama
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setLockTimeRemaining(lockTimeRemaining - 1000)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isLocked && lockTimeRemaining <= 0) {
      setIsLocked(false)
      setAttempts(0)
      setPin(["", "", "", "", "", ""])
    }
  }, [isLocked, lockTimeRemaining])

  // Fungsi untuk mencari user berdasarkan PIN
  const findUserByPin = async (pinValue: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pinValue)
        .single()

      if (error) {
        // PIN tidak ditemukan atau error
        return null
      }

      return data
    } catch (error) {
      console.error('Error finding user by PIN:', error)
      return null
    }
  }

  const handlePinChange = (index: number, value: string) => {
    if (isLocked || isLoading) return

    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value

    setPin(newPin)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newPin.every((digit) => digit !== "") && newPin.join("").length === 6) {
      setTimeout(() => handleSubmit(newPin.join("")), 100)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (isLocked || isLoading) return

    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        // Backspace ke input sebelumnya
        inputRefs.current[index - 1]?.focus()
      } else if (pin[index]) {
        // Clear current input
        const newPin = [...pin]
        newPin[index] = ""
        setPin(newPin)
      }
    }
  }

  const handleSubmit = async (pinValue?: string) => {
    if (isLocked || isLoading) return

    const currentPin = pinValue || pin.join("")

    if (currentPin.length !== 6) {
      toast({
        title: "PIN Tidak Lengkap",
        description: "Masukkan 6 digit PIN lengkap",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Cari user berdasarkan PIN
      const userData = await findUserByPin(currentPin)

      if (userData) {
        // PIN valid - kirim data user ke parent component
        toast({
          title: "Autentikasi Berhasil",
          description: `Selamat datang, ${userData.name || userData.email}!`,
        })
        onSuccess(userData)
      } else {
        // PIN tidak valid
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true)
          setLockTimeRemaining(LOCK_DURATION)
          toast({
            title: "Akses Diblokir",
            description: "Terlalu banyak percobaan gagal. Coba lagi dalam 3 menit.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "PIN Salah",
            description: `PIN tidak valid. Sisa percobaan: ${MAX_ATTEMPTS - newAttempts}`,
            variant: "destructive",
          })
        }

        // Clear PIN untuk percobaan berikutnya
        setPin(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error("Authentication error:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat autentikasi. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Samakan perilaku tombol X dengan tombol Batal: selalu kembali ke menu sebelumnya
        onCancel()
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memverifikasi PIN...</span>
            </div>
          )}

          {/* PIN Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Masukkan PIN</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => setShowPin(!showPin)}
                disabled={isLoading}
              >
                {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>

            <div className="flex justify-center gap-2">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el
                  }}
                  type={showPin ? "text" : "password"}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold"
                  maxLength={1}
                  disabled={isLocked || isLoading}
                  inputMode="numeric"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Status Messages */}
          {isLocked && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Akses Diblokir</p>
                <p className="text-red-600">Coba lagi dalam {formatTime(lockTimeRemaining)}</p>
              </div>
            </div>
          )}

          {!isLocked && attempts > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">PIN Salah</p>
                <p className="text-yellow-600">Sisa percobaan: {MAX_ATTEMPTS - attempts}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1 bg-transparent"
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={() => handleSubmit()}
              className="flex-1 gap-2"
              disabled={isLocked || pin.join("").length !== 6 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <User className="h-4 w-4" />
              )}
              Masuk
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-muted-foreground">
            <p>Gunakan PIN yang sudah terdaftar di sistem</p>
            <p>Semua user dengan PIN valid dapat mengakses</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}