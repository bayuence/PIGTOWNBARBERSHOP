"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerDashboard } from "@/components/owner-dashboard"
import { PinAuthentication } from "@/components/pin-authentication"

export default function OwnerDashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPinDialog, setShowPinDialog] = useState(true)

  useEffect(() => {
    // SELALU require PIN authentication setiap kali page di-mount
    // Tidak ada persistence - user harus input PIN setiap masuk
    setIsAuthenticated(false)
    setShowPinDialog(true)

    // Clear any existing authentication data
    localStorage.removeItem("owner_auth_time")

    // Cleanup: Clear authentication saat component unmount (user pindah ke menu lain)
    return () => {
      setIsAuthenticated(false)
      setShowPinDialog(false)
      localStorage.removeItem("owner_auth_time")
    }
  }, [])

  const handlePinSuccess = (userData: any) => {
    setIsAuthenticated(true)
    setShowPinDialog(false)
  }

  const handleCancel = () => {
    // User klik BATAL → Kembali ke halaman sebelumnya
    setIsAuthenticated(false)
    setShowPinDialog(false)
    router.push("/dashboard") // Kembali ke menu utama (POS)
  }

  if (!isAuthenticated) {
    return (
      <PinAuthentication
        isOpen={showPinDialog}
        onSuccess={handlePinSuccess}
        onCancel={handleCancel}
      />
    )
  }

  return <OwnerDashboard />
}
