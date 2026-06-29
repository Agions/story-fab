/**
 * Secure API Keys Hook
 *
 * Stores API keys in Tauri Store (file-based, OS-encrypted) instead of localStorage.
 * Provides the same interface as useLocalStorage for backward compatibility.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllApiKeys, setApiKey, deleteApiKey } from '@/core/services/auth/api-key-service';
import { logger } from '@/shared/utils/logging';

export interface ApiKeyConfig {
  key: string;
  isValid?: boolean;
}

export function useSecureApiKeys(
  initialValue: Record<string, ApiKeyConfig> = {}
): [Record<string, ApiKeyConfig>, (value: Record<string, ApiKeyConfig> | ((prev: Record<string, ApiKeyConfig>) => Record<string, ApiKeyConfig>)) => void] {
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyConfig>>(initialValue);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadKeys() {
      try {
        const keys = await getAllApiKeys();
        if (!cancelled) {
          const configs: Record<string, ApiKeyConfig> = {};
          for (const [provider, key] of Object.entries(keys)) {
            configs[provider] = { key };
          }
          setApiKeys(configs);
        }
      } catch {
        if (!cancelled) setApiKeys(initialValue);
      }
    }
    loadKeys();
    return () => { cancelled = true; };
  }, [initialValue]);

  const secureSetApiKeys = useCallback((
    value: Record<string, ApiKeyConfig> | ((prev: Record<string, ApiKeyConfig>) => Record<string, ApiKeyConfig>)
  ) => {
    setApiKeys(prev => {
      const next = value instanceof Function ? value(prev) : value;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const currentKeys = await getAllApiKeys();
          const providersToDelete = new Set(Object.keys(currentKeys));

          for (const [provider, config] of Object.entries(next)) {
            providersToDelete.delete(provider);
            if (config.key.trim()) {
              await setApiKey(provider, config.key);
            } else {
              await deleteApiKey(provider);
            }
          }

          for (const provider of providersToDelete) {
            await deleteApiKey(provider);
          }
        } catch (error) {
          logger.error('[useSecureApiKeys] 保存失败:', error);
        }
      }, 100);

      return next;
    });
  }, []);

  return [apiKeys, secureSetApiKeys];
}
