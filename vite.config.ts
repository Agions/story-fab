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
    devSourcemap: true,
    minify: true,
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
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 核心
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          // Ant Design - 进一步拆分
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) {
            if (id.includes('antd/es/locale')) return 'antd-locale'
            if (id.includes('antd/es/date-picker') || id.includes('antd/es/calendar')) return 'antd-date'
            if (id.includes('antd/es/table')) return 'antd-table'
            if (id.includes('antd/es/form')) return 'antd-form'
            if (id.includes('antd/es/select') || id.includes('antd/es/tree-select')) return 'antd-select'
            if (id.includes('antd/es/modal') || id.includes('antd/es/drawer')) return 'antd-overlay'
            if (id.includes('antd/es/upload')) return 'antd-upload'
            if (id.includes('antd/es/dropdown') || id.includes('antd/es/menu')) return 'antd-menu'
            return 'antd-core'
          }
          // 工具库
          if (id.includes('node_modules/lodash') || id.includes('node_modules/axios')) {
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
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@ant-design/icons', 'axios'],
    exclude: [],
  },
})
