import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 微信小程序 web-view 环境检测：
// iOS WKWebView 不支持 SW，Android web-view 行为不可靠。
// 在 web-view 内主动注销已注册的 SW，避免残缺缓存导致页面加载失败。
// 普通浏览器/PWA 不受影响，仍由 vite-plugin-pwa 生成的 Workbox SW 管理缓存。
if ('serviceWorker' in navigator) {
  const isWeappWebView =
    window.__wxjs_environment === 'miniprogram' ||
    /miniProgram/i.test(navigator.userAgent);

  if (isWeappWebView) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

    <App />
  </React.StrictMode>,
)