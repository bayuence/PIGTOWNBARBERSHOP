import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pigtown Barbershop',
    short_name: 'PB Office',
    description: 'Sistem manajemen modern untuk Pigtown Barbershop',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/images/pigtown-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/pigtown-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
