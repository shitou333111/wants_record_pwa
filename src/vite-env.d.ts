/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __BUILD_TIME__: string;

// 微信 JSSDK 注入的小程序环境标识
interface Window {
  __wxjs_environment?: 'miniprogram' | undefined;
}
