import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.BASE_URL || '/wants_record_pwa/',
  server: {
    host: '0.0.0.0', // 关键配置：监听所有网络接口
    port: 5173,       // 固定端口5173
    strictPort: true, // 如果端口被占用，不自动尝试其他端口
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // ✨ 就是这一行，强制清理旧版本残留缓存
        cleanupOutdatedCaches: true, 
        
        // 建议同时开启这两个，让新版 SW 立即接管页面
        skipWaiting: true,
        clientsClaim: true,
        
        // 这里的 globPatterns 决定了哪些文件被缓存
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '情绪释放',
        short_name: '情绪释放',
        description: '情绪释放',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})