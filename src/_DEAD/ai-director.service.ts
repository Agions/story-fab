import { invoke } from '@tauri-apps/api/core';
import type { Scene, ScriptSegment } from '@/core/types';

export interface AIDirectorPlanInput {
  mode: 'ai-commentary' | 'ai-mixclip' | 'ai-first-person';
  targetDuration: number;
  autoOriginalOverlay: boolean;
  scenes: Array<Pick<Scene, 'id' | 'startTime' | 'endTime' | 'type'>>;
  segments: Array<Pick<ScriptSegment, 'id' | 'content'>>;
}

export interface AIDirectorPlanOutput {
  pacingFactor: number;
  beatCount: number;
  preferredTransition: 'fade' | 'cut' | 'dissolve';
  confidence: number;
}

export interface AutonomousRenderInput {
  inputPath: string;
  outputPath: string;
  startTime?: number;
  endTime?: number;
  transition?: 'cut' | 'fade' | 'dissolve';
  transitionDuration?: number;
  burnSubtitles?: boolean;
  subtitles?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  applyOverlayMarkers?: boolean;
  overlayMixMode?: 'pip' | 'full';
  overlayOpacity?: number;
  overlayMarkers?: Array<{
    start: number;
    end: number;
    label: string;
  }>;
  segments?: Array<{
    start: number;
    end: number;
  }>;
}

const FALLBACK_PLAN: AIDirectorPlanOutput = {
  pacingFactor: 1,
  beatCount: 8,
  preferredTransition: 'fade',
  confidence: 0.6,
};

export class AIDirectorService {
  async buildPlan(input: AIDirectorPlanInput): Promise<AIDirectorPlanOutput> {
    try {
      const plan = await invoke<AIDirectorPlanOutput>('run_ai_director_plan', { input });
      if (!plan) return FALLBACK_PLAN;
      return plan;
    } catch {
      return this.buildFallbackPlan(input);
    }
  }

  async renderAutonomousCut(input: AutonomousRenderInput): Promise<string> {
    return invoke<string>('render_autonomous_cut', { input });
  }

  private buildFallbackPlan(input: AIDirectorPlanInput): AIDirectorPlanOutput {
    const sceneCount = input.scenes.length;
    const segmentCount = input.segments.length;
    const density = sceneCount / Math.max(segmentCount, 1);
    const pacingFactor =
      input.mode === 'ai-mixclip'
        ? 1.08
        : input.mode === 'ai-first-person'
          ? 0.95
          : 1.0;

    return {
      pacingFactor,
      beatCount: Math.max(6, Math.min(24, Math.round(input.targetDuration / 4))),
      preferredTransition: density > 1.2 ? 'cut' : 'fade',
      confidence: 0.55,
    };
  }
}

export const aiDirectorService = new AIDirectorService();
