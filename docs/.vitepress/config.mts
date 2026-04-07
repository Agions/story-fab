import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CutDeck',
  description: 'AI 驱动的专业智能视频剪辑工具 — Cinematic Dark × Warm Amber',

  // GitHub Pages 路径前缀
  base: '/CutDeck/',

  // 忽略死链接，兼容多版本文档
  ignoreDeadLinks: true,

  lang: 'zh-CN',
  cleanUrls: true,

  // 禁用自动主题切换，由 CSS 完全控制深色主题
  appearance: true,  // 默认浅色，用户可手动切换深色

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/CutDeck/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#1a1a2e' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'CutDeck' }],
    ['meta', { name: 'description', content: 'AI 驱动的专业智能视频剪辑工具，支持智能混剪、剧情分析、字幕生成等全链路 AI 剪辑能力' }],
  ],

  vite: {
    css: {
      preprocessorOptions: {}
    }
  },

  // VitePress 主题配置
  themeConfig: {
    // 深色模式切换按钮（默认开启）
    // appearance: 'force-dark' | 'force-light' | boolean
    // 已在上方 appearance 字段控制


    logo: '/logo.svg',
    siteTitle: 'CutDeck',

    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/quick-start' },
          { text: '批量处理', link: '/guide/batch-processing' },
          { text: 'AI 智能拆条', link: '/guide/clip-repurpose' },
          { text: '短视频创作', link: '/guide/short-video' },
          { text: '字幕处理', link: '/guide/subtitle' },
          { text: '导出格式', link: '/guide/export' },
        ]
      },
      { text: '功能介绍', link: '/features' },
      {
        text: '配置',
        items: [
          { text: '安装配置', link: '/installation' },
          { text: 'AI 模型配置', link: '/ai-config' },
          { text: '项目结构', link: '/project-structure' },
        ]
      },
      {
        text: '更多',
        items: [
          { text: '架构概览', link: '/architecture' },
          { text: '安全设计', link: '/security' },
          { text: '贡献指南', link: '/contributing' },
          { text: '常见问题', link: '/faq' },
          { text: '更新日志', link: '/changelog' },
        ]
      },
      {
        text: 'GitHub',
        link: 'https://github.com/Agions/CutDeck'
      }
    ],

    // 侧边栏
    sidebar: {
      '/': [
        {
          text: '快速导航',
          items: [
            { text: '首页', link: '/' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '功能介绍', link: '/features' },
          ]
        },
        {
          text: 'AI 视频创作指南',
          items: [
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '批量处理', link: '/guide/batch-processing' },
            { text: '短视频创作', link: '/guide/short-video' },
            { text: '字幕处理', link: '/guide/subtitle' },
            { text: '导出格式', link: '/guide/export' },
          ]
        },
        {
          text: '配置指南',
          items: [
            { text: '安装配置', link: '/installation' },
            { text: 'AI 模型配置', link: '/ai-config' },
            { text: '项目结构', link: '/project-structure' },
          ]
        },
        {
          text: '参考',
          items: [
            { text: '架构概览', link: '/architecture' },
            { text: '安全设计', link: '/security' },
            { text: '常见问题', link: '/faq' },
            { text: '更新日志', link: '/changelog' },
          ]
        },
      ],
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '5 分钟快速开始', link: '/guide/quick-start' },
            { text: 'AI 智能拆条', link: '/guide/clip-repurpose' },
            { text: '短视频创作', link: '/guide/short-video' },
            { text: '字幕处理', link: '/guide/subtitle' },
            { text: '批量处理', link: '/guide/batch-processing' },
            { text: '导出格式', link: '/guide/export' },
          ]
        },
      ],
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Agions/CutDeck' },
    ],

    // 页脚
    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2025-2026 Agions. 基于开源精神构建。'
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/Agions/CutDeck/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    // 本地搜索
    search: {
      provider: 'local',
      options: {
        placeholder: '搜索文档...',
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索'
          }
        }
      }
    },

    // 返回顶部
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    // 大纲（右侧标题导航）
    outline: {
      level: [2, 3],
      label: '目录'
    },

  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },

  sitemap: {
    hostname: 'https://agions.github.io/CutDeck'
  }
})
