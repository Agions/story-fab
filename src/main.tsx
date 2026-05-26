import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// 防止控制台出现错误消息
window.addEventListener('error', (e) => {
  // 忽略与@tauri-apps/api相关的错误
  if (e.message && (e.message.includes('@tauri-apps/api') || e.message.includes('Tauri'))) {
    e.preventDefault();
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- DEV-only diagnostic
      console.warn('[story-fab] Tauri API error suppressed:', e.message);
    }
  }
});

// 创建根元素
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('找不到根元素');
}

const root = ReactDOM.createRoot(rootElement);
const RootWrapper = import.meta.env.DEV ? React.Fragment : React.StrictMode;

root.render(
  <RootWrapper>
    <App />
  </RootWrapper>
); 
