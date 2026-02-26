import type { AIClipConfig } from './types';

export function exportClipConfig(config: AIClipConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importClipConfig(json: string, defaultConfig: AIClipConfig): AIClipConfig {
  return { ...defaultConfig, ...JSON.parse(json) };
}
