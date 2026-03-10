/**
 * 音乐处理步骤
 * 自动配乐工作流步骤
 */
import { logger } from '@/utils/logger';
import { autoMusicService, type MusicTrack, type MusicMatchResult } from '../auto-music.service';

export interface MusicStepInput {
  videoDuration: number;
  preferredGenre?: string;
  preferredMood?: string;
  customTracks?: MusicTrack[];
}

export interface MusicStepOutput {
  tracks: MusicMatchResult[];
  totalDuration: number;
  recommendations: MusicTrack[];
  usedSource: 'preset' | 'upload' | 'ai';
}

/**
 * 音乐处理步骤
 */
export async function musicStep(input: MusicStepInput): Promise<MusicStepOutput> {
  logger.info('[MusicStep] 开始处理配乐', input);

  try {
    // 如果有自定义音乐，先上传
    if (input.customTracks && input.customTracks.length > 0) {
      for (const track of input.customTracks) {
        if (track.localPath) {
          // 添加到音乐库
          await autoMusicService.addMusicFromUrl(track.localPath, {
            name: track.name,
            genre: track.genre,
            mood: track.mood,
            duration: track.duration,
            tags: track.tags,
          });
        }
      }
    }

    // 推荐音乐
    const result = await autoMusicService.recommendMusic({
      videoDuration: input.videoDuration,
      preferredGenre: input.preferredGenre as any,
      preferredMood: input.preferredMood as any,
    });

    logger.info('[MusicStep] 配乐推荐完成', {
      trackCount: result.recommendations.length,
      totalDuration: result.totalDuration,
    });

    return {
      tracks: result.tracks,
      totalDuration: result.totalDuration,
      recommendations: result.recommendations,
      usedSource: 'preset',
    };
  } catch (error) {
    logger.error('[MusicStep] 配乐处理失败', error);
    throw error;
  }
}

export default musicStep;
