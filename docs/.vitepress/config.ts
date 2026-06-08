import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/story-fab/',
  title: 'StoryFab',
  description: 'AI 影视解说创作工坊 · 本地优先',
  lang: 'zh-CN',
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#0B0F1F' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'StoryFab 文档' }],
    ['meta', { name: 'description', content: '本地优先的 AI 影视解说创作工具。剪辑模式 + 解说模式，全链路本地处理。' }],
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
            { text: '安装', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/quick-start' },
          ],
        },
        {
          text: '功能',
          items: [
            { text: '解说模式', link: '/guide/commentary-mode' },
            { text: 'AI 分析', link: '/guide/ai-analysis' },
            { text: '脚本生成', link: '/guide/script-generation' },
            { text: '导出', link: '/guide/export' },
          ],
        },
        {
          text: '其他',
          items: [
            { text: '配置', link: '/guide/configuration' },
            { text: '快捷键', link: '/guide/keyboard-shortcuts' },
          ],
        },
      ],

      '/dev/': [
        {
          text: '架构',
          items: [
            { text: '系统概览', link: '/dev/architecture' },
            { text: '架构优化 ADR', link: '/dev/architecture-optimization' },
            { text: '前端', link: '/dev/frontend' },
            { text: '后端', link: '/dev/backend' },
          ],
        },
        {
          text: '开发',
          items: [
            { text: '项目结构', link: '/dev/project-structure' },
            { text: 'Tauri 命令', link: '/dev/tauri-commands' },
            { text: '构建发布', link: '/dev/build-release' },
          ],
        },
        {
          text: '模块',
          items: [
            { text: '解说工作流', link: '/dev/commentary-workflow' },
            { text: '导演 Agent', link: '/dev/director-agent' },
            { text: '脚本生成', link: '/dev/script-generation' },
            { text: 'AI 服务', link: '/dev/ai-services' },
          ],
        },
      ],

      '/reference/': [
        {
          text: '参考',
          items: [
            { text: '配置', link: '/reference/config' },
            { text: 'CLI', link: '/reference/cli' },
            { text: 'FAQ', link: '/reference/faq' },
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
      copyright: 'Copyright © 2026 StoryFab',
    },

    search: {
      provider: 'local',
      options: { detailedView: true },
    },
  },

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: false,
  },

  vite: {
    server: { fs: { strict: false } },
  },
})