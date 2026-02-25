/**
 * 国际化配置
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 中文翻译
const zhCN = {
  translation: {
    // 通用
    common: {
      loading: '加载中...',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      search: '搜索',
      reset: '重置',
      submit: '提交',
      success: '成功',
      error: '错误',
      warning: '警告',
      info: '提示',
      yes: '是',
      no: '否',
    },
    // 导航
    nav: {
      home: '首页',
      projects: '项目管理',
      settings: '设置',
      help: '帮助',
    },
    // 项目
    project: {
      create: '创建项目',
      name: '项目名称',
      description: '项目描述',
      template: '项目模板',
      status: {
        draft: '草稿',
        processing: '处理中',
        completed: '已完成',
        failed: '失败',
      },
    },
    // 编辑器
    editor: {
      video: '视频',
      script: '文案',
      subtitle: '字幕',
      voice: '配音',
      preview: '预览',
      timeline: '时间线',
    },
    // AI 功能
    ai: {
      analyze: 'AI 分析',
      generate: 'AI 生成',
      narration: '视频解说',
      firstPerson: '第一人称',
      remix: 'AI 混剪',
      analyzing: '分析中...',
      generating: '生成中...',
    },
    // 导出
    export: {
      title: '导出视频',
      format: '输出格式',
      resolution: '分辨率',
      quality: '画质',
      exporting: '导出中...',
    },
    // 错误
    error: {
      network: '网络错误，请检查网络连接',
      server: '服务器错误，请稍后重试',
      upload: '上传失败，请重试',
      notFound: '请求的资源不存在',
    },
  },
};

// 英文翻译
const enUS = {
  translation: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      reset: 'Reset',
      submit: 'Submit',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      yes: 'Yes',
      no: 'No',
    },
    nav: {
      home: 'Home',
      projects: 'Projects',
      settings: 'Settings',
      help: 'Help',
    },
    project: {
      create: 'Create Project',
      name: 'Project Name',
      description: 'Description',
      template: 'Template',
      status: {
        draft: 'Draft',
        processing: 'Processing',
        completed: 'Completed',
        failed: 'Failed',
      },
    },
    editor: {
      video: 'Video',
      script: 'Script',
      subtitle: 'Subtitle',
      voice: 'Voice',
      preview: 'Preview',
      timeline: 'Timeline',
    },
    ai: {
      analyze: 'AI Analyze',
      generate: 'AI Generate',
      narration: 'Video Narration',
      firstPerson: 'First Person',
      remix: 'AI Remix',
      analyzing: 'Analyzing...',
      generating: 'Generating...',
    },
    export: {
      title: 'Export Video',
      format: 'Format',
      resolution: 'Resolution',
      quality: 'Quality',
      exporting: 'Exporting...',
    },
    error: {
      network: 'Network error, please check your connection',
      server: 'Server error, please try again later',
      upload: 'Upload failed, please retry',
      notFound: 'Resource not found',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': zhCN,
      'en-US': enUS,
    },
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
