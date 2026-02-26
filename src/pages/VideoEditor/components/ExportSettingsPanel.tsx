import React, { memo } from 'react';
import { Card, Typography, Dropdown, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import styles from '../VideoEditor.module.less';

const { Text, Title } = Typography;

interface ExportSettingsPanelProps {
  outputFormat: string;
  videoQuality: string;
  onFormatChange: (format: string) => void;
  onQualityChange: (quality: string) => void;
}

const formatOptions = [
  { key: 'mp4', label: 'MP4' },
  { key: 'mov', label: 'MOV' },
  { key: 'webm', label: 'WebM' },
];

const qualityOptions = [
  { key: 'low', label: '低 (720p)' },
  { key: 'medium', label: '中 (1080p)' },
  { key: 'high', label: '高 (原始分辨率)' },
];

const getQualityLabel = (quality: string) => {
  switch (quality) {
    case 'low':
      return '低 (720p)';
    case 'medium':
      return '中 (1080p)';
    case 'high':
      return '高 (原始分辨率)';
    default:
      return quality;
  }
};

const ExportSettingsPanel: React.FC<ExportSettingsPanelProps> = ({
  outputFormat,
  videoQuality,
  onFormatChange,
  onQualityChange,
}) => {
  return (
    <div className={styles.settingsPanel}>
      <Title level={5} className={styles.sectionTitle}>导出设置</Title>

      <Card className={styles.settingCard}>
        <div className={styles.settingItem}>
          <Text strong>输出格式</Text>
          <Dropdown
            menu={{
              items: formatOptions,
              onClick: ({ key }) => onFormatChange(key),
            }}
          >
            <Button>
              {outputFormat.toUpperCase()} <DownloadOutlined />
            </Button>
          </Dropdown>
        </div>

        <div className={styles.settingItem}>
          <Text strong>视频质量</Text>
          <Dropdown
            menu={{
              items: qualityOptions,
              onClick: ({ key }) => onQualityChange(key),
            }}
          >
            <Button>
              {getQualityLabel(videoQuality)} <DownloadOutlined />
            </Button>
          </Dropdown>
        </div>
      </Card>
    </div>
  );
};

export default memo(ExportSettingsPanel);
