"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Shield, Lock, Eye, EyeOff, AlertCircle, Loader2, User } from "lucide-react"

interface PinAuthenticationProps {
  isOpen: boolean
  onSuccess: (userData: any) => void
  onCancel: () => void
  title?: string
  description?: string
}

export function PinAuthentication({
  isOpen,
  onSuccess,
  onCancel,
  title = "Autentikasi PIN",
  description = "Masukkan PIN 6 digit untuk melanjutkan",
}: PinAuthenticationProps) {
  const [pin, setPin] = useState(["", "", "", "", "", ""])
  const [showPin, setShowPin] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const MAX_ATTEMPTS = 5
  const LOCK_DURATION = 180000 // 3 menit

  // Reset semua state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setPin(["", "", "", "", "", ""])
      setAttempts(0)
      setIsLocked(false)
      setLockTimeRemaining(0)
      setIsLoading(false)

      // Tunggu animasi dialog selesai baru focus
      const focusTimer = setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 300)

      return () => clearTimeout(focusTimer)
    }
  }, [isOpen])

  // Countdown timer saat akun dikunci
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

  const verifyPin = async (pinValue: string): Promise<any> => {
    try {
      const response = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      })
      if (!response.ok) return null
      const result = await response.json()
      return result.user || null
    } catch (error) {
      console.error("Error verifying PIN:", error)
      return null
    }
  }

  const handlePinChange = (index: number, value: string) => {
    if (isLocked || isLoading) return

    // Hanya ambil 1 digit angka
    const numericValue = value.replace(/\D/g, "").slice(-1)
    if (value && !numericValue) return

    const newPin = [...pin]
    newPin[index] = numericValue
    setPin(newPin)

    // Auto-focus ke kotak berikutnya
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit saat 6 digit terisi
    if (newPin.every((d) => d !== "") && newPin.join("").length === 6) {
      setTimeout(() => handleSubmit(newPin.join("")), 100)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (isLocked || isLoading) return

    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (pin[index]) {
        const newPin = [...pin]
        newPin[index] = ""
        setPin(newPin)
      }
    }
  }

  const handleInputClick = (index: number) => {
    if (isLocked || isLoading) return
    inputRefs.current[index]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (isLocked || isLoading) return
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length > 0) {
      const newPin = [...pin]
      pasted.split("").forEach((char, i) => {
        if (i < 6) newPin[i] = char
      })
      setPin(newPin)
      const nextIndex = Math.min(pasted.length, 5)
      inputRefs.current[nextIndex]?.focus()
      if (newPin.every((d) => d !== "") && newPin.join("").length === 6) {
        setTimeout(() => handleSubmit(newPin.join("")), 100)
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
      const userData = await verifyPin(currentPin)

      if (userData) {
        // PIN valid → langsung masuk
        toast({
          title: "Berhasil Masuk",
          description: "Selamat datang!",
        })
        onSuccess(userData)
      } else {
        // PIN salah
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

        setPin(["", "", "", "", "", ""])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      }
    } catch (error) {
      console.error("Authentication error:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Shield className="h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading */}
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
                  ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el }}
                  type={showPin ? "text" : "password"}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onClick={() => handleInputClick(index)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg font-bold cursor-pointer"
                  maxLength={1}
                  disabled={isLocked || isLoading}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              ))}
            </div>
          </div>

          {/* Akses diblokir */}
          {isLocked && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Akses Diblokir</p>
                <p className="text-red-600">Coba lagi dalam {formatTime(lockTimeRemaining)}</p>
              </div>
            </div>
          )}

          {/* PIN salah tapi belum dikunci */}
          {!isLocked && attempts > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">PIN Salah</p>
                <p className="text-yellow-600">Sisa percobaan: {MAX_ATTEMPTS - attempts}</p>
              </div>
            </div>
          )}

          {/* Tombol */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent" disabled={isLoading}>
              Batal
            </Button>
            <Button
              onClick={() => handleSubmit()}
              className="flex-1 gap-2"
              disabled={isLocked || pin.join("").length !== 6 || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
              Masuk
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Gunakan PIN yang sudah terdaftar di sistem</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}