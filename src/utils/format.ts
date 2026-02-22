/**
 * 格式化日期为YYYY-MM-DD格式
 * @param date 日期对象或日期字符串
 * @returns 格式化的日期字符串
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期和时间为YYYY-MM-DD HH:MM:SS格式
 * @param date 日期对象或日期字符串
 * @returns 格式化的日期时间字符串
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化时间
 * @param seconds 秒数
 * @returns 格式化后的时间字符串 mm:ss
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 将秒数格式化为hh:mm:ss的时间格式
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const hoursStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = secs.toString().padStart(2, '0');
  
  return `${hoursStr}${minutesStr}:${secondsStr}`;
};

/**
 * 将字节大小格式化为人类可读格式
 * @param bytes 字节数
 * @returns 格式化后的大小字符串 (如: 1.5 MB)
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 截断文本并添加省略号
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * 格式化时长为友好显示（例如：2小时30分钟）
 * @param seconds 秒数
 * @returns 格式化后的友好时长字符串
 */
export const formatFriendlyDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '0秒';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}小时`;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}分钟`;
  }
  
  if (secs > 0 && hours === 0) {
    result += `${secs}秒`;
  }
  
  return result || '0秒';
};

/**
 * 格式化数字，添加千分位分隔符
 * @param num 数字
 * @returns 格式化后的数字字符串
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

/**
 * 转换为百分比格式
 * @param value 0-1之间的数值
 * @param decimals 小数位数
 * @returns 百分比字符串
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  if (isNaN(value)) {
    return '0%';
  }
  
  const percent = value * 100;
  return `${percent.toFixed(decimals)}%`;
}; 