import React, { memo } from 'react';
import { Card } from 'antd';
import ScriptEditor from '@/components/ScriptEditor';
import type { ScriptData, VideoAnalysis } from '@/core/types';
import styles from '../index.module.less';

interface ScriptEditStepProps {
  script?: ScriptData;
  scenes?: VideoAnalysis['scenes'];
  onSave: (script: ScriptData) => void;
}

const ScriptEditStep: React.FC<ScriptEditStepProps> = ({ script, scenes, onSave }) => {
  if (!script) {
    return (
      <Card title="编辑脚本" className={styles.stepCard}>
        <div>暂无脚本数据</div>
      </Card>
    );
  }

  return (
    <Card title="编辑脚本" className={styles.stepCard}>
      <ScriptEditor script={script} onSave={onSave} scenes={scenes} />
    </Card>
  );
};

export default memo(ScriptEditStep);
