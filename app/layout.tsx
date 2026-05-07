import { Metadata } from "next";
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import type { ReactNode } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'PIGTOWN BARBERSHOP',
  description: 'Sistem manajemen modern untuk Pigtown Barbershop',
  
  // 🔑 Kode verifikasi Google Search Console ditambahkan di sini
  verification: {
    google: '4oRTIgQQMaRiefHG76icRvGzdI1bZVCJNCzEhPayLdc',
  },

  icons: {
    icon: [
      {
        url: '/images/pigtown-logo.png', // Path ke logo Pigtown
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/images/pigtown-logo.png', // Untuk perangkat Apple
        type: 'image/png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Toaster position="top-center" richColors closeButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
