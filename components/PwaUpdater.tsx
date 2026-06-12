"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function PwaUpdater() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Menampilkan notifikasi "Aplikasi berhasil diperbarui" jika baru saja memuat ulang
    const wasUpdated = sessionStorage.getItem("pwa_updated");
    if (wasUpdated === "true") {
      toast.success("Aplikasi berhasil diperbarui 🎉", {
        duration: 5000,
      });
      sessionStorage.removeItem("pwa_updated");
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              // Jika SW baru sudah terinstall dan ada SW lama (artinya ini pembaruan)
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                toast.info("Pembaruan baru tersedia ✨", {
                  description: "Aplikasi sedang diperbarui...",
                  duration: 3000,
                });
                
                // Tunggu sebentar agar notifikasi terlihat, lalu muat ulang halaman
                setTimeout(() => {
                  sessionStorage.setItem("pwa_updated", "true");
                  window.location.reload();
                }, 3000);
              }
            });
          }
        });
      });
    }
  }, []);

  return null;
}
