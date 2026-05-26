import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/story-fab/',
  title: 'StoryFab',
  description: 'AI-Driven Professional Video Editing Desktop Application',
  lang: 'en-US',
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#00d4ff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'StoryFab Docs' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'StoryFab Docs',

    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'Dev', link: '/dev/', activeMatch: '/dev/' },
      { text: 'Reference', link: '/reference/', activeMatch: '/reference/' },
      { text: 'Changelog', link: '/CHANGELOG' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Core Workflow',
          items: [
            { text: 'AI Analysis', link: '/guide/ai-analysis' },
            { text: 'Script Generation', link: '/guide/script-generation' },
            { text: 'Video Export', link: '/guide/export' },
          ],
        },
        {
          text: 'Usage',
          items: [
            { text: 'Keyboard Shortcuts', link: '/guide/keyboard-shortcuts' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],

      '/dev/': [
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/dev/architecture' },
            { text: 'Frontend Architecture', link: '/dev/frontend' },
            { text: 'Backend Architecture', link: '/dev/backend' },
          ],
        },
        {
          text: 'Development',
          items: [
            { text: 'Project Structure', link: '/dev/project-structure' },
            { text: 'Tauri Commands', link: '/dev/tauri-commands' },
            { text: 'AI Services', link: '/dev/ai-services' },
            { text: 'Build & Release', link: '/dev/build-release' },
          ],
        },
      ],

      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Environment Variables', link: '/reference/config' },
            { text: 'CLI Usage', link: '/reference/cli' },
            { text: 'FAQ', link: '/reference/faq' },
          ],
        },
      ],
    },

    editLink: {
      pattern: 'https://github.com/Agions/story-fab/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Agions/story-fab' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present StoryFab',
    },

    search: {
      provider: 'local',
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
