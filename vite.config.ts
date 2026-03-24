import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Ant Design 组件按需导入
import autoImport from 'unplugin-auto-import/vite'
import { AntDesignResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Auto import resolvers for antd
    // Note: Using babel-plugin-import equivalent through vite
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
    chunkSizeWarningLimit: 400, // 降低警告阈值
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // Rollup 优化选项
    rollupOptions: {
      output: {
        // 更优化的 chunk 命名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // 静态资源内联阈值
        inlineDynamicImports: false,
        manualChunks: (id) => {
          // Node modules 外部化
          if (!id.includes('node_modules')) {
            return null
          }

          // React 核心 - 单独 chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }

          // React Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/history/')) {
            return 'router'
          }

          // Zustand 状态管理
          if (id.includes('node_modules/zustand/')) {
            return 'zustand'
          }

          // Tauri API
          if (id.includes('node_modules/@tauri-apps/api')) {
            return 'tauri-api'
          }

          // Ant Design Icons - 单独打包
          if (id.includes('node_modules/@ant-design/icons/') || id.includes('node_modules/@ant-design/icons-react/')) {
            return 'antd-icons'
          }

          // Ant Design 组件库 - 按功能拆分
          if (id.includes('node_modules/antd/')) {
            // 基础组件 (Button, Input, Select 等)
            const basicComponents = [
              'Button', 'Input', 'InputNumber', 'Textarea',
              'Select', 'Option', 'Checkbox', 'Radio', 'Switch',
              'Slider', 'DatePicker', 'TimePicker', 'Upload',
              'Dropdow', 'DropButton', 'ButtonGroup',
              'Space', 'Badge', 'Tag', 'Avatar',
              'Tooltip', 'Popover', 'Popconfirm',
              'Typography', 'Text', 'Paragraph', 'Title',
              'Link', '小火柴', '小火',
            ]
            for (const comp of basicComponents) {
              if (id.includes(`/es/${comp}/`) || id.includes(`/lib/${comp}/`)) {
                return 'antd-basic'
              }
            }

            // 布局组件
            const layoutComponents = ['Layout', 'Row', 'Col', 'Grid', 'Card', 'Tabs', 'TabPane', 'TabContent', 'Flex']
            for (const comp of layoutComponents) {
              if (id.includes(`/es/${comp}/`) || id.includes(`/lib/${comp}/`)) {
                return 'antd-layout'
              }
            }

            // 反馈组件
            const feedbackComponents = [
              'Modal', 'Drawer', 'Message', 'Notification', 'Alert',
              'Loading', 'Spin', 'Skeleton', 'Progress', 'Result',
              'Empty', 'confirm', 'info', 'success', 'warning', 'error',
            ]
            for (const comp of feedbackComponents) {
              if (id.includes(`/es/${comp}/`) || id.includes(`/lib/${comp}/`)) {
                return 'antd-feedback'
              }
            }

            // 数据展示
            const dataComponents = [
              'Table', 'List', 'Descriptions', 'Timeline',
              'Tree', 'TreeSelect', 'Steps', 'Step', 'Segmented',
              'Image', 'Calendar', 'Carousel',
            ]
            for (const comp of dataComponents) {
              if (id.includes(`/es/${comp}/`) || id.includes(`/lib/${comp}/`)) {
                return 'antd-data'
              }
            }

            // 表单组件
            const formComponents = [
              'Form', 'FormItem', 'FormProvider', 'useForm',
              'Cascader', 'AutoComplete', 'Mentions',
            ]
            for (const comp of formComponents) {
              if (id.includes(`/es/${comp}/`) || id.includes(`/lib/${comp}/`)) {
                return 'antd-form'
              }
            }

            // 导航组件
            const navComponents = [
              'Menu', 'MenuItem', 'SubMenu', 'MenuItemGroup',
              'Breadcrumb', 'Pagination', 'Steps', 'Step',
              'ConfigProvider',
            ]
            for (const comp of navComponents) {
              if (id.includes(`/es/${comp}/`) || id.includes(`/lib/${comp}/`)) {
                return 'antd-nav'
              }
            }

            // 其他 antd 组件
            return 'antd-misc'
          }

          // 其他库
          if (id.includes('node_modules/dayjs/')) {
            return 'dayjs'
          }

          if (id.includes('node_modules/axios/')) {
            return 'axios'
          }

          if (id.includes('node_modules/i18next/') || id.includes('node_modules/react-i18next/')) {
            return 'i18n'
          }

          // Ant Design 其他
          if (id.includes('node_modules/@ant-design/')) {
            return 'antd-other'
          }

          // 其他 vendor
          return 'vendor'
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'dayjs',
      'zustand',
      'antd',
    ],
    exclude: ['@ant-design/icons'],
  },
  esbuild: {
    legalComments: 'none',
    drop: ['console', 'debugger'],
    // ES2022+ 特性
    target: 'esnext',
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
})
