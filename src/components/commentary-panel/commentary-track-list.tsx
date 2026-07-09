/**
 * CommentaryTrackList — 解说面板 Tab 内容区
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CommentaryEditor from './commentary-editor';
import CommentaryStyleSelector from './commentary-style-selector';
import CommentaryVoiceSelector from './commentary-voice-selector';
import CommentaryTimeline from './commentary-timeline';
import type { CommentaryScriptOutput, VoiceInfo, ScriptStylePreset } from '@/types';
import type { CommentaryPanelAction } from './commentary-panel-reducer';

const CommentaryTrackList: React.FC<{
  dispatch: React.Dispatch<CommentaryPanelAction>;
  apiKey: string;
  script: CommentaryScriptOutput | null;
  scripts: Map<ScriptStylePreset, CommentaryScriptOutput>;
  activeScriptStyle: ScriptStylePreset | undefined;
  multiStyleMode: boolean;
  isGenerating: boolean;
  voices: VoiceInfo[];
  selectedVoice: string;
  isPreviewing: boolean;
  selectedStyle: ScriptStylePreset;
  onGenerate: () => void;
  onMultiGenerate: () => void;
  onSegmentChange: (index: number, text: string) => void;
  onSetApiKey: (v: string) => void;
}> = ({
  dispatch,
  apiKey,
  script,
  scripts,
  activeScriptStyle,
  multiStyleMode,
  isGenerating,
  voices,
  selectedVoice,
  isPreviewing,
  selectedStyle,
  onGenerate,
  onMultiGenerate,
  onSegmentChange,
  onSetApiKey,
}) => {

  return (
    <Tabs value="script" onValueChange={(v) => dispatch({ type: 'SET_ACTIVE_TAB', payload: v as 'script' | 'style' | 'voice' | 'timeline' })}>
      <TabsList>
        <TabsTrigger value="script">脚本</TabsTrigger>
        <TabsTrigger value="style">风格</TabsTrigger>
        <TabsTrigger value="voice">音色</TabsTrigger>
        <TabsTrigger value="timeline">时间线</TabsTrigger>
      </TabsList>

      <TabsContent value="script">
        {multiStyleMode && scripts.size > 0 && activeScriptStyle ? (
          <div className="flex gap-2 mb-4">
            {Array.from(scripts.keys()).map((style) => (
              <button
                key={style}
                className={`px-3 py-1 rounded ${activeScriptStyle === style ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                onClick={() => {}}
              >
                {style}
              </button>
            ))}
          </div>
        ) : null}
        <CommentaryEditor
          script={multiStyleMode ? scripts.get(activeScriptStyle!) ?? null : script}
          isGenerating={isGenerating}
          onGenerate={multiStyleMode ? onMultiGenerate : onGenerate}
          apiKey={apiKey}
          onApiKeyChange={onSetApiKey}
          onSegmentChange={onSegmentChange}
        />
      </TabsContent>

      <TabsContent value="style">
        <CommentaryStyleSelector
          selected={multiStyleMode ? [selectedStyle] : selectedStyle}
          onChange={(s) => {
            if (multiStyleMode) {
              // setSelectedStyles handled elsewhere
            } else {
              dispatch({ type: 'SET_SELECTED_STYLE', payload: s as ScriptStylePreset });
            }
          }}
          multiSelect={multiStyleMode}
        />
      </TabsContent>

      <TabsContent value="voice">
        <CommentaryVoiceSelector
          voices={voices}
          selected={selectedVoice}
          onChange={() => {}}
          onPreview={() => {}}
          isPreviewing={isPreviewing}
        />
      </TabsContent>

      <TabsContent value="timeline">
        {script ? (
          <CommentaryTimeline segments={script.segments} voice={selectedVoice} />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>先生成解说脚本</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default CommentaryTrackList;