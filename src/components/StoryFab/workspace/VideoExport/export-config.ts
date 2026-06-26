/**
 * VideoExport 配置数据
 * 导出格式、平台预设、质量选项
 */

export const FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4', desc: '通用格式', emoji: '🎬' },
  { value: 'mov', label: 'MOV', desc: 'Apple 高质量', emoji: '🍎' },
  { value: 'gif', label: 'GIF', desc: '动画格式', emoji: '🎞️' },
] as const;

export const PLATFORM_PRESETS = [
  {
    value: 'douyin',
    label: '抖音',
    emoji: '🎵',
    aspectRatio: '9:16',
    resolution: '1080p',
    bitrate: 10,
    tips: '竖屏短视频，建议 9:16，推荐高清画质',
  },
  {
    value: 'xiaohongshu',
    label: '小红书',
    emoji: '📕',
    aspectRatio: '3:4',
    resolution: '1080p',
    bitrate: 8,
    tips: '图文/视频混合，注意封面设计',
  },
  {
    value: 'bilibili',
    label: 'B站',
    emoji: '📺',
    aspectRatio: '16:9',
    resolution: '1080p',
    bitrate: 12,
    tips: '横屏为主，支持高码率，推荐 1080p 高清',
  },
  {
    value: 'youtube_shorts',
    label: 'YouTube Shorts',
    emoji: '▶️',
    aspectRatio: '9:16',
    resolution: '1080p',
    bitrate: 10,
    tips: '竖屏短视频，≤60秒，配字幕更佳',
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    emoji: '🌐',
    aspectRatio: '9:16',
    resolution: '1080p',
    bitrate: 10,
    tips: '竖屏优先，建议添加字幕和特效',
  },
] as const;

export const QUALITY_OPTIONS = [
  { value: '1080p', label: 'Full HD' },
  { value: '720p', label: 'HD' },
  { value: '480p', label: 'SD' },
] as const;

export const RESOLUTION_OPTIONS = [
  { value: '1080p', label: '1080p Full HD', res: '1920×1080' },
  { value: '720p', label: '720p HD', res: '1280×720' },
  { value: '480p', label: '480p SD', res: '854×480' },
  { value: '2k', label: '2K QHD', res: '2560×1440' },
] as const;

export const FPS_OPTIONS = [
  { value: 24, label: '24 fps' },
  { value: 30, label: '30 fps' },
  { value: 60, label: '60 fps' },
] as const;