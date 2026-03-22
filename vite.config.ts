import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Ant Design 组件库按需导入配置
const antdImportPlugin = () => ({
  name: 'antd-import',
  transform(code: string, id: string) {
    if (!id.includes('node_modules/antd') && !id.includes('node_modules/@ant-design/icons')) {
      return null
    }
    // antd v5 使用 CSS-in-JS,这里仅做标记以便手动优化
    return null
  }
})

export default defineConfig({
  base: './',
  plugins: [
    react(),
    antdImportPlugin(),
  ],
  clearScreen: false,
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
      '@/store': path.resolve(__dirname, './src/store/index'),
      '@/store/app': path.resolve(__dirname, './src/store/index'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 启用 rollup 优化
    rollupOptions: {
      output: {
        // 更优化的 chunk 命名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // React 核心
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          // 路由与状态管理
          if (id.includes('node_modules/react-router') || id.includes('node_modules/zustand')) {
            return 'app-framework'
          }
          // Tauri
          if (id.includes('node_modules/@tauri-apps')) {
            return 'tauri-vendor'
          }
          // Ant Design icons 单独打包（图标库大但可缓存）
          if (id.includes('node_modules/@ant-design/icons')) {
            return 'icons-vendor'
          }
          // Ant Design 组件库按功能拆分
          if (id.includes('node_modules/antd')) {
            // 基础组件
            if (id.includes('/ Button') || id.includes('/Input') || id.includes('/Select') || 
                id.includes('/ Dropdown') || id.includes('/ Space') || id.includes('/ Badge')) {
              return 'antd-basic'
            }
            // 布局组件
            if (id.includes('/ Card') || id.includes('/ Row') || id.includes('/ Col') || 
                id.includes('/ Layout') || id.includes('/ Tabs')) {
              return 'antd-layout'
            }
            // 数据展示
            if (id.includes('/ Table') || id.includes('/ List') || id.includes('/ Avatar') || 
                id.includes('/ Tag') || id.includes('/ Progress')) {
              return 'antd-data'
            }
            // 反馈与对话框
            if (id.includes('/ Modal') || id.includes('/ Drawer') || id.includes('/ Message') || 
                id.includes('/ Notification') || id.includes('/ Alert')) {
              return 'antd-feedback'
            }
            // 表单组件（较大）
            if (id.includes('/ Form') || id.includes('/ DatePicker') || id.includes('/ Upload') || 
                id.includes('/ Switch') || id.includes('/ Slider') || id.includes('/ Radio') || 
                id.includes('/ Checkbox') || id.includes('/ AutoComplete') || id.includes('/ Cascader')) {
              return 'antd-form'
            }
            // 其他 antd 组件
            return 'antd-misc'
          }
          // 业务重模块分包
          if (id.includes('/src/pages/Workflow/') || id.includes('/src/core/workflow/')) {
            return 'workflow-feature'
          }
          if (id.includes('/src/pages/Editor/') || id.includes('/src/components/editor/')) {
            return 'editor-feature'
          }
          // AI 服务模块
          if (id.includes('/src/core/services/ai.service') || id.includes('/src/core/services/vision.service')) {
            return 'ai-service'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'dayjs', 'zustand'],
    exclude: ['@ant-design/icons'],
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
})
