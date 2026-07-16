/**
 * 语言代码映射 — 字幕模块共享常量
 * 合并原 subtitle-service.ts 中重复定义的三份 langMap
 */

/** ASR 识别语言码 (4-key) */
export const ASR_LANG_CODES: Record<string, 'zh_cn' | 'en_us' | 'ja_jp' | 'ko_kr'> = {
  'zh-CN': 'zh_cn',
  en: 'en_us',
  'ja-JP': 'ja_jp',
  'ko-KR': 'ko_kr',
};

/** 翻译目标语言名称 (15-key) */
export const TRANSLATION_LANG_NAMES: Record<string, string> = {
  en: 'English',
  'zh-CN': '中文',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ru: 'Русский',
  pt: 'Português',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  ar: 'العربية',
  it: 'Italiano',
};

/** 语言名 → ISO 代码 (用于 normalizeLangCode) */
export const LANG_NAME_TO_CODE: Record<string, string> = {
  chinese: 'zh',
  english: 'en',
  japanese: 'ja',
  korean: 'ko',
  french: 'fr',
  german: 'de',
  spanish: 'es',
  russian: 'ru',
  portuguese: 'pt',
  italian: 'it',
  dutch: 'nl',
  polish: 'pl',
  vietnamese: 'vi',
  thai: 'th',
  arabic: 'ar',
  hindi: 'hi',
};

/** 标准化语言代码：先查 LANG_NAME_TOCODE，失败则返回小写输入 */
export function normalizeLangCode(lang: string): string {
  const lower = lang.toLowerCase();
  return LANG_NAME_TO_CODE[lower] ?? lower;
}
