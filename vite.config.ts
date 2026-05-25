import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 1430,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 1430,
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
      '@/core': path.resolve(__dirname, './src/core'),
      '@/store': path.resolve(__dirname, './src/store/index'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/scripts': path.resolve(__dirname, './scripts'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        inlineDynamicImports: false,
        manualChunks(id) {
          if (!id.includes('node_modules')) return null

          // Framework core
          if (/node_modules\/react(?:-dom)?\//.test(id)) return 'vendor-react'
          if (/node_modules\/react-router(?:-dom)?\//.test(id)) return 'vendor-router'
          if (/node_modules\/zustand\//.test(id)) return 'vendor-zustand'

          // Tauri
          if (/node_modules\/@tauri-apps\//.test(id)) return 'vendor-tauri'

          // UI library — antd icons share modules with rc-* packages, keep them together
          if (/node_modules\/antd\//.test(id)) return 'vendor-antd'
          if (/node_modules\/@ant-design\//.test(id) || /node_modules\/rc-[a-z-]+\//.test(id)) return 'vendor-antd-icons'

          // Utilities
          if (/node_modules\/dayjs\//.test(id)) return 'vendor-dayjs'
          if (/node_modules\/axios\//.test(id)) return 'vendor-axios'

          // Icon libraries — large tree-shakeable exports, benefit from isolated chunk
          if (/node_modules\/lucide-react\//.test(id)) return 'vendor-icons'

          // Animation / UI utilities
          if (/node_modules\/framer-motion\//.test(id) || /node_modules\/vaul\//.test(id)) return 'vendor-motion'

          // No catch-all — every node_modules module must have an explicit chunk above.
          // If you hit this, add a new explicit rule before the fallback.
          return null
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'dayjs', 'zustand', 'antd', '@ant-design/icons'],
  },
  // Only drop console/debugger in production builds for easier debugging
  esbuild: {
    legalComments: 'none',
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    target: 'esnext',
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
})
