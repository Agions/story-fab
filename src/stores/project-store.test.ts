/**
 * ProjectStore — 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectStore } from './project-store';

beforeEach(() => {
  useProjectStore.setState({
    state: {
      mode: 'clip',
      currentStep: 'project-create',
      selectedFeature: 'smartClip',
      project: null,
      currentVideo: null,
      analysis: null,
      isAnalyzing: false,
      analysisProgress: 0,
      subtitleData: { ocr: null, asr: null },
      isGeneratingSubtitle: false,
      subtitleProgress: 0,
      scriptData: { narration: null, remix: null },
      isGeneratingScript: false,
      scriptProgress: 0,
      voiceData: { audioUrl: null, voiceSettings: { voiceId: 'zh-CN-XiaoxiaoNeural', speed: 1, volume: 1 } },
      isSynthesizingVoice: false,
      voiceProgress: 0,
      synthesisData: { finalVideoUrl: null, settings: { syncAudioVideo: false, addSubtitles: false, addWatermark: false } },
      isSynthesizing: false,
      synthesisProgress: 0,
      exportSettings: null,
      isExporting: false,
      exportProgress: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
      commentaryPlan: { segments: [], totalDuration: 0 },
      directorPhase: 'pending',
      semanticSegments: [],
      stepStatus: {
        'project-create': false,
        'video-upload': false,
        'ai-analyze': false,
        'clip-repurpose': false,
        'semantic-segment': false,
        'director-review': false,
        'script-generate': false,
        'video-synth': false,
        'voice-synth': false,
        'video-export': false,
      },
    },
    dispatch: () => {},
  });
});

describe('useProjectStore', () => {
  describe('setMode', () => {
    it('dispatches SET_MODE', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      useProjectStore.getState().setMode('clip');
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', payload: 'clip' });
    });
  });

  describe('setVideo', () => {
    it('dispatches SET_VIDEO with video payload', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      const video = {
        id: 'v1',
        path: '/tmp/v.mp4',
        name: 'v.mp4',
        duration: 10,
        width: 1920,
        height: 1080,
        fps: 30,
        format: 'mp4',
        size: 1024,
        thumbnail: '',
        createdAt: new Date().toISOString(),
      };
      useProjectStore.getState().setVideo(video);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_VIDEO', payload: video });
    });
  });

  describe('setAnalysis', () => {
    it('dispatches SET_ANALYSIS with analysis payload', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      const analysis = {
        id: 'a1',
        videoId: 'v1',
        scenes: [],
        keyframes: [],
        objects: [],
        emotions: [],
        summary: '',
        stats: { sceneCount: 0, objectCount: 0, avgSceneDuration: 0, sceneTypes: {}, objectCategories: {}, dominantEmotions: {} },
        createdAt: new Date().toISOString(),
      };
      useProjectStore.getState().setAnalysis(analysis);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ANALYSIS', payload: analysis });
    });
  });

  describe('goToNextStep', () => {
    it('dispatches SET_STEP', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      useProjectStore.getState().goToNextStep();
      expect(dispatch).toHaveBeenCalled();
      const call = dispatch.mock.calls[0][0];
      expect(call.type).toBe('SET_STEP');
      expect(call.payload).toBeDefined();
    });
  });

  describe('goToPrevStep', () => {
    it('dispatches SET_STEP', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      // Set to a step that has a previous step
      useProjectStore.getState().setStep('video-upload');
      useProjectStore.getState().goToPrevStep();
      expect(dispatch).toHaveBeenCalled();
      const call = dispatch.mock.calls[0][0];
      expect(call.type).toBe('SET_STEP');
      expect(call.payload).toBeDefined();
    });
  });

  describe('updateVideo', () => {
    it('does nothing when currentVideo is null', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      useProjectStore.getState().updateVideo({ name: 'new.mp4' });
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('resets state via set', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      useProjectStore.getState().reset();
      // reset calls set() directly, not dispatch
      expect(useProjectStore.getState().state.mode).toBe('clip');
    });
  });

  describe('setters', () => {
    it('setOcrSubtitle dispatches SET_OCR_SUBTITLE', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      useProjectStore.getState().setOcrSubtitle([{ startTime: 0, endTime: 1, text: 'hi' }]);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_OCR_SUBTITLE', payload: [{ startTime: 0, endTime: 1, text: 'hi' }] });
    });

    it('setAsrSubtitle dispatches SET_ASR_SUBTITLE', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      useProjectStore.getState().setAsrSubtitle([{ startTime: 0, endTime: 1, text: 'hi', speaker: 'a' }]);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ASR_SUBTITLE', payload: [{ startTime: 0, endTime: 1, text: 'hi', speaker: 'a' }] });
    });

    it('setDuration dispatches SET_DURATION', () => {
      const dispatch = vi.fn();
      useProjectStore.setState({ dispatch });
      useProjectStore.getState().setDuration(120);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_DURATION', payload: 120 });
    });
  });
});
