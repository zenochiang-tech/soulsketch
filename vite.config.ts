import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { cloudflare } from "@cloudflare/vite-plugin";
// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
  },
  plugins: [...
      react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'icons.svg', 'apple-touch-icon.png'],
    manifest: {
      name: '灵感画笔 SoulSketch',
      short_name: 'SoulSketch',
      description: '在这里，让压力随笔尖流转，让烦恼随清风散去。一个极简的治愈系绘画空间。',
      theme_color: '#B2A4FF',
      background_color: '#B2A4FF',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: 'icons.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,ogg}'], // 包含我们的音频文件
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/actions\.google\.com\/sounds\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'ambient-sounds-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 缓存30天
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  }), cloudflare()],
})