import React, { memo } from 'react';
import { Card } from 'antd';
import ExportPanel from '@/components/ExportPanel';
import styles from '../index.module.less';

interface ExportStepProps {
  onExport: (settings: any) => Promise<string>;
}

const ExportStep: React.FC<ExportStepProps> = ({ onExport }) => {
  return (
    <Card title="导出视频" className={styles.stepCard}>
      <ExportPanel onExport={onExport} />
    </Card>
  );
};

export default memo(ExportStep);
