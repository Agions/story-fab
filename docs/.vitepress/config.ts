import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/story-fab/',
  title: 'StoryFab',
  description: 'AI 影视/短剧解说创作工具 — 本地 AI 驱动，智能拆条 · 解说生成 · 配音合成',
  lang: 'zh-CN',
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#1a1a2e' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'StoryFab 文档中心' }],
    ['meta', { name: 'description', content: 'AI 影视/短剧解说创作工具，支持剪辑模式和解说模式，智能拆条 + 解说生成 + 配音合成，一站式本地完成。' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'StoryFab',

    nav: [
      { text: '指南', link: '/guide/', activeMatch: '/guide/' },
      { text: '开发', link: '/dev/', activeMatch: '/dev/' },
      { text: '参考', link: '/reference/', activeMatch: '/reference/' },
      { text: '更新日志', link: '/CHANGELOG' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '安装指南', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/quick-start' },
          ],
        },
        {
          text: '核心功能',
          items: [
            { text: 'AI 分析', link: '/guide/ai-analysis' },
            { text: '脚本生成', link: '/guide/script-generation' },
            { text: '解说模式', link: '/guide/commentary-mode' },
            { text: '视频导出', link: '/guide/export' },
          ],
        },
        {
          text: '使用技巧',
          items: [
            { text: '键盘快捷键', link: '/guide/keyboard-shortcuts' },
            { text: '配置指南', link: '/guide/configuration' },
          ],
        },
      ],

      '/dev/': [
        {
          text: '架构设计',
          items: [
            { text: '系统概览', link: '/dev/architecture' },
            { text: '前端架构', link: '/dev/frontend' },
            { text: '后端架构', link: '/dev/backend' },
          ],
        },
        {
          text: '开发指南',
          items: [
            { text: '项目结构', link: '/dev/project-structure' },
            { text: 'Tauri 命令', link: '/dev/tauri-commands' },
            { text: 'AI 服务', link: '/dev/ai-services' },
            { text: '构建发布', link: '/dev/build-release' },
          ],
        },
        {
          text: '核心模块',
          items: [
            { text: '解说工作流', link: '/dev/commentary-workflow' },
            { text: '导演 Agent', link: '/dev/director-agent' },
            { text: '脚本生成', link: '/dev/script-generation' },
          ],
        },
      ],

      '/reference/': [
        {
          text: '参考资料',
          items: [
            { text: '环境变量', link: '/reference/config' },
            { text: 'CLI 用法', link: '/reference/cli' },
            { text: '常见问题', link: '/reference/faq' },
          ],
        },
      ],
    },

    editLink: {
      pattern: 'https://github.com/Agions/story-fab/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Agions/story-fab' },
    ],

    footer: {
      message: '基于 MIT 协议开源',
      copyright: 'Copyright © 2024-present StoryFab · Agions',
    },

    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },

  vite: {
    server: {
      port: 3000,
    },
  },
})