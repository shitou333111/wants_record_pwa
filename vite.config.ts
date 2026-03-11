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
      registerType: 'prompt',
      workbox: {
        cleanupOutdatedCaches: true,
        // skipWaiting 故意不设置 — 使用 prompt 模式，由用户点击触发更新
        // 新 SW 安装后进入 waiting 状态，等待 SKIP_WAITING 消息
        clientsClaim: true,
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