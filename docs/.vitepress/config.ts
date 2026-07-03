import { defineConfig } from 'vitepress';

export default defineConfig({
  base: '/story-fab/',
  title: 'StoryFab',
  description: 'AI 影视解说创作工坊 · 本地优先 · 隐私安全 · 全链路自动化',
  lang: 'zh-CN',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'stylesheet', href: '/styles/custom.css' }],
    ['meta', { name: 'theme-color', content: '#0B0F1F' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'StoryFab 文档' }],
    [
      'meta',
      {
        name: 'description',
        content: '本地优先的 AI 影视解说创作工具。剪辑模式 + 解说模式，全链路本地处理。',
      },
    ],
    [
      'meta',
      {
        name: 'keywords',
        content: 'AI, 视频创作, 影视解说, Tauri, React, TypeScript, Rust, 本地处理, 隐私',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'StoryFab',

    nav: [
      { text: '开始', link: '/getting-started/introduction' },
      { text: '功能', link: '/features/commentary-mode' },
      { text: '配置', link: '/configuration/configuration' },
      { text: '开发者', link: '/developer/architecture' },
      { text: '参考', link: '/reference/api' },
      { text: '更新日志', link: '/CHANGELOG' },
      { text: 'GitHub', link: 'https://github.com/Agions/story-fab' },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: '开始使用',
          items: [
            { text: '介绍', link: '/getting-started/introduction' },
            { text: '安装指南', link: '/getting-started/installation' },
            { text: '快速开始', link: '/getting-started/quick-start' },
          ],
        },
      ],
      '/features/': [
        {
          text: '功能指南',
          items: [
            { text: '剪辑模式', link: '/features/commentary-mode' },
            { text: '解说模式', link: '/features/ai-analysis' },
            { text: '脚本生成', link: '/features/script-generation' },
            { text: '导出设置', link: '/features/export' },
          ],
        },
      ],
      '/configuration/': [
        {
          text: '配置',
          items: [
            { text: '高级配置', link: '/configuration/configuration' },
            { text: '快捷键', link: '/configuration/keyboard-shortcuts' },
          ],
        },
      ],
      '/developer/': [
        {
          text: '架构',
          items: [
            { text: '系统架构', link: '/developer/architecture' },
            { text: '项目结构', link: '/developer/project-structure' },
          ],
        },
        {
          text: '开发',
          items: [
            { text: '解说工作流', link: '/developer/commentary-workflow' },
            { text: 'AI 服务', link: '/developer/ai-services' },
            { text: 'Tauri 命令', link: '/developer/tauri-commands' },
            { text: '测试指南', link: '/developer/testing' },
            { text: '构建发布', link: '/developer/build-release' },
            { text: '部署指南', link: '/developer/deployment' },
          ],
        },
      ],
      '/reference/': [
        {
          text: '参考资料',
          items: [
            { text: 'API 参考', link: '/reference/api' },
            { text: '配置参考', link: '/reference/config' },
            { text: '常见问题', link: '/reference/faq' },
          ],
        },
      ],
    },

    editLink: {
      pattern: 'https://github.com/Agions/story-fab/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/Agions/story-fab' }],

    footer: {
      message: '基于 MIT 协议开源',
      copyright: 'Copyright © 2026 Agions · 由 VitePress 驱动',
    },

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        maxSuggestions: 10,
      },
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },
  },

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: false,
    toc: { level: [2, 3] },
  },

  vite: {
    server: { fs: { strict: false } },
  },
});
