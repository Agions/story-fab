/**
 * CommentaryEditor — 解说脚本编辑器
 */

import React from 'react';
import { useCommentary } from './use-commentary';
import CommentaryScriptEditor from './commentary-script-editor';
import type { CommentaryScriptOutput } from '@/types';

interface CommentaryEditorProps {
  script: CommentaryScriptOutput | null;
  isGenerating: boolean;
  onGenerate: () => void;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  onSegmentChange: (index: number, text: string) => void;
}

const CommentaryEditor: React.FC<CommentaryEditorProps> = ({
  script,
  isGenerating,
  onGenerate,
  apiKey,
  onApiKeyChange,
  onSegmentChange,
}) => {
  const { multiStyleMode: _multiStyleMode } = useCommentary('', '', 0, false);

  return (
    <CommentaryScriptEditor
      script={script}
      isGenerating={isGenerating}
      onGenerate={onGenerate}
      apiKey={apiKey}
      onApiKeyChange={onApiKeyChange}
      onSegmentChange={onSegmentChange}
    />
  );
};

export default CommentaryEditor;
