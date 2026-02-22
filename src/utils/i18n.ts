import { useState, useEffect, useCallback } from 'react';

// 语言类型
export type Language = 'zh' | 'en';

// 定义翻译字典接口
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// 翻译数据
const translations: Translations = {
  zh: {
    // 通用
    'app.name': 'ClipFlow',
    'app.save': '保存',
    'app.cancel': '取消',
    'app.confirm': '确认',
    'app.delete': '删除',
    'app.edit': '编辑',
    'app.add': '添加',

    // 主题设置
    'theme.mode': '主题模式',
    'theme.light': '亮色',
    'theme.dark': '暗色',
    'theme.auto': '自动',
    'theme.toggle': '切换亮/暗色主题',

    // 设置页面
    'settings.title': '设置',
    'settings.subtitle': '自定义您的应用程序设置和AI模型配置',
    'settings.save': '保存设置',
    'settings.saved': '设置已保存',
    'settings.saveSuccess': '您的设置已成功保存并应用',
    'settings.models': 'AI模型',
    'settings.general': '通用设置',
    'settings.about': '关于',
    'settings.privacy': '隐私',
    // AI模型
    'settings.models.title': 'AI模型',
    'settings.models.message': '选择您偏好的AI模型',
    'settings.models.description': '请选择您想要使用的AI模型，并配置相应的API密钥。不同模型有不同的功能和价格。',
    'settings.models.available': '可用模型',
    'settings.models.selectPreferred': '选择您喜欢的AI模型作为默认选项',
    'settings.models.canChange': '您可以随时更改默认模型，或为特定任务选择不同的模型。某些模型可能需要额外的API密钥配置。',
    // API密钥
    'settings.api.title': 'API密钥',
    'settings.api.message': '配置AI服务提供商API密钥',
    'settings.api.description': '为了使用各种AI模型，您需要配置相应服务提供商的API密钥。这些密钥仅存储在您的本地设备，不会传输到其他位置。',
    'settings.api.keyConfig': 'API密钥配置',
    'settings.api.domesticServices': '国内AI服务',
    'settings.api.howToGet': '如何获取API密钥',
    'settings.api.missing': 'API密钥缺失',
    'settings.api.enterFirst': '请输入API密钥后再进行测试',
    'settings.api.valid': 'API密钥有效',
    'settings.api.invalid': 'API密钥无效',
    'settings.api.validationError': '验证API密钥时发生错误，请稍后再试',
    'settings.api.test': '测试',
    // 通用设置
    'settings.general.title': '通用设置',
    'settings.general.autoSave': '自动保存',
    'settings.general.autoSaveDesc': '自动保存您的编辑，避免意外丢失数据',
    'settings.general.lineNumbers': '显示行号',
    'settings.general.lineNumbersDesc': '在编辑器中显示行号，方便代码导航和引用',
    'settings.general.autoUpdate': '自动更新',
    'settings.general.autoUpdateDesc': '启用自动更新，确保您始终使用最新版本',
    'settings.general.performance': '性能与导出',
    'settings.general.highQuality': '高质量导出',
    'settings.general.highQualityDesc': '导出更高质量的视频和图像，可能需要更多处理时间',
    'settings.general.transcode': '启用转码',
    'settings.general.transcodeDesc': '自动转码上传的视频，以适应不同的播放设备（需更多系统资源）',
    'settings.general.language': '界面语言',
    'settings.general.languageDesc': '选择应用界面的显示语言',
  },
  en: {
    // 通用
    'app.name': 'ClipFlow',
    'app.save': 'Save',
    'app.cancel': 'Cancel',
    'app.confirm': 'Confirm',
    'app.delete': 'Delete',
    'app.edit': 'Edit',
    'app.add': 'Add',

    // 主题设置
    'theme.mode': 'Theme Mode',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'Auto',
    'theme.toggle': 'Toggle Light/Dark Theme',

    // 设置页面
    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your application settings and AI model configuration',
    'settings.save': 'Save Settings',
    'settings.saved': 'Settings Saved',
    'settings.saveSuccess': 'Your settings have been successfully saved and applied',
    'settings.models': 'AI Models',
    'settings.general': 'General Settings',
    'settings.about': 'About',
    'settings.privacy': 'Privacy',
    // AI模型
    'settings.models.title': 'AI Models',
    'settings.models.message': 'Choose your preferred AI model',
    'settings.models.description': 'Please select the AI model you want to use and configure the corresponding API key. Different models have different features and prices.',
    'settings.models.available': 'Available Models',
    'settings.models.selectPreferred': 'Select your favorite AI model as the default option',
    'settings.models.canChange': 'You can change the default model at any time, or choose different models for specific tasks. Some models may require additional API key configuration.',
    // API密钥
    'settings.api.title': 'API Keys',
    'settings.api.message': 'Configure AI service provider API keys',
    'settings.api.description': 'To use various AI models, you need to configure the corresponding service provider API keys. These keys are only stored on your local device and will not be transmitted elsewhere.',
    'settings.api.keyConfig': 'API Key Configuration',
    'settings.api.domesticServices': 'Domestic AI Services',
    'settings.api.howToGet': 'How to Get API Keys',
    'settings.api.missing': 'API Key Missing',
    'settings.api.enterFirst': 'Please enter an API key before testing',
    'settings.api.valid': 'API Key Valid',
    'settings.api.invalid': 'API Key Invalid',
    'settings.api.validationError': 'An error occurred when validating the API key, please try again later',
    'settings.api.test': 'Test',
    // 通用设置
    'settings.general.title': 'General Settings',
    'settings.general.autoSave': 'Auto Save',
    'settings.general.autoSaveDesc': 'Automatically save your edits to avoid accidental data loss',
    'settings.general.lineNumbers': 'Show Line Numbers',
    'settings.general.lineNumbersDesc': 'Display line numbers in the editor for easy code navigation and reference',
    'settings.general.autoUpdate': 'Auto Update',
    'settings.general.autoUpdateDesc': 'Enable automatic updates to ensure you are always using the latest version',
    'settings.general.performance': 'Performance and Export',
    'settings.general.highQuality': 'High Quality Export',
    'settings.general.highQualityDesc': 'Export higher quality videos and images, may require more processing time',
    'settings.general.transcode': 'Enable Transcoding',
    'settings.general.transcodeDesc': 'Automatically transcode uploaded videos to suit different playback devices (requires more system resources)',
    'settings.general.language': 'Interface Language',
    'settings.general.languageDesc': 'Select the display language for the application interface',
  }
};

// 获取浏览器语言
const getBrowserLanguage = (): Language => {
  const navigatorLang = navigator.language.toLowerCase();
  return navigatorLang.startsWith('zh') ? 'zh' : 'en';
};

// 默认语言
const defaultLanguage = getBrowserLanguage();

// 语言相关的日期格式化选项
const dateFormatOptions: Record<Language, Intl.DateTimeFormatOptions> = {
  zh: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  en: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }
};

// 数字格式化选项
const numberFormatOptions: Record<Language, Intl.NumberFormatOptions> = {
  zh: {
    maximumFractionDigits: 2
  },
  en: {
    maximumFractionDigits: 2
  }
};

// 文件大小单位
const fileSizeUnits = {
  zh: ['B', 'KB', 'MB', 'GB', 'TB'],
  en: ['B', 'KB', 'MB', 'GB', 'TB']
};

// 创建自定义的useTranslation钩子
export function useTranslation() {
  const [language, setLanguage] = useState<Language>(
    localStorage.getItem('app_language') as Language || defaultLanguage
  );

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  // 翻译函数
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || key;

    // 替换参数
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }

    return text;
  }, [language]);

  // 切换语言
  const changeLanguage = useCallback((newLang: Language) => {
    setLanguage(newLang);
  }, []);

  // 格式化日期
  const formatDate = useCallback((date: Date | string | number): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return new Intl.DateTimeFormat(
      language === 'zh' ? 'zh-CN' : 'en-US',
      dateFormatOptions[language]
    ).format(dateObj);
  }, [language]);

  // 格式化数字
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat(
      language === 'zh' ? 'zh-CN' : 'en-US',
      numberFormatOptions[language]
    ).format(num);
  }, [language]);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

    return `${formatNumber(size)} ${fileSizeUnits[language][i]}`;
  }, [language, formatNumber]);

  // 格式化时长
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return language === 'zh'
        ? `${hours}小时${minutes}分钟`
        : `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return language === 'zh'
        ? `${minutes}分${secs}秒`
        : `${minutes}m ${secs}s`;
    } else {
      return language === 'zh'
        ? `${secs}秒`
        : `${secs}s`;
    }
  }, [language]);

  return {
    t,
    language,
    changeLanguage,
    formatDate,
    formatNumber,
    formatFileSize,
    formatDuration
  };
}

export default useTranslation; 