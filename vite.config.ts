import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['import', {
            libraryName: 'antd',
            libraryDirectory: 'es',
            style: false,
          }, 'antd'],
          ['import', {
            libraryName: '@ant-design/icons',
            libraryDirectory: 'es/icons',
            camel2DashComponentName: false,
          }, '@ant-design/icons'],
        ],
      },
    }),
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 1420,
    strictPort: true,
  },
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 400,
    reportCompressedSize: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 核心
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          // Ant Design 组件按功能拆分
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) {
            if (id.includes('antd/es/locale')) return 'antd-locale'
            if (id.includes('antd/es/date-picker') || id.includes('antd/es/calendar') || id.includes('antd/es/time-picker')) return 'antd-date'
            if (id.includes('antd/es/table')) return 'antd-table'
            if (id.includes('antd/es/form') || id.includes('antd/es/input')) return 'antd-form'
            if (id.includes('antd/es/select') || id.includes('antd/es/tree-select') || id.includes('antd/es/cascader')) return 'antd-select'
            if (id.includes('antd/es/modal') || id.includes('antd/es/drawer') || id.includes('antd/es/popconfirm')) return 'antd-overlay'
            if (id.includes('antd/es/upload')) return 'antd-upload'
            if (id.includes('antd/es/dropdown') || id.includes('antd/es/menu') || id.includes('antd/es/tabs')) return 'antd-nav'
            if (id.includes('antd/es/button') || id.includes('antd/es/icon')) return 'antd-basic'
            if (id.includes('antd/es/card') || id.includes('antd/es/list') || id.includes('antd/es/carousel')) return 'antd-display'
            return 'antd-core'
          }
          // 工具库
          if (id.includes('node_modules/lodash') || id.includes('node_modules/axios') || id.includes('node_modules/dayjs')) {
            return 'utils-vendor'
          }
          // 路由
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor'
          }
          // 国际化
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'i18n-vendor'
          }
          // 动画
          if (id.includes('node_modules/framer-motion')) {
            return 'motion-vendor'
          }
          // Tauri
          if (id.includes('node_modules/@tauri-apps')) {
            return 'tauri-vendor'
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@ant-design/icons', 'axios', 'dayjs', 'zustand'],
  },
})
