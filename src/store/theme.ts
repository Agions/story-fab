/**
 * Theme 工具函数
 */
import { useAppStore } from './appStore';

/**
 * 获取当前主题
 */
export const useTheme = () => useAppStore((state) => state.theme);

/**
 * 切换主题
 */
export const useToggleTheme = () => useAppStore((state) => state.setTheme);
