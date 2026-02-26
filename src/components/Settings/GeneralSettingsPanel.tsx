/**
 * 通用设置面板
 */
import React from 'react';
import { Card, Form, Switch, Select, Button, Space, Divider, message } from 'antd';
import { SettingOutlined, GlobalOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons';

const { Option } = Select;

interface GeneralSettingsPanelProps {
  autoSave: boolean;
  compactMode: boolean;
  language: string;
  theme: string;
  onAutoSaveChange: (v: boolean) => void;
  onCompactModeChange: (v: boolean) => void;
  onLanguageChange: (v: string) => void;
  onThemeChange: (v: string) => void;
  onReset: () => void;
}

const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({
  autoSave,
  compactMode,
  language,
  theme,
  onAutoSaveChange,
  onCompactModeChange,
  onLanguageChange,
  onThemeChange,
  onReset,
}) => {
  const handleReset = () => {
    onReset();
    message.success('设置已重置');
  };

  return (
    <Card title="通用设置" extra={<SettingOutlined />}>
      <Form layout="vertical">
        <Form.Item label="自动保存">
          <Switch
            checked={autoSave}
            onChange={onAutoSaveChange}
            checkedChildren="开启"
            unCheckedChildren="关闭"
          />
        </Form.Item>

        <Form.Item label="紧凑模式">
          <Switch
            checked={compactMode}
            onChange={onCompactModeChange}
            checkedChildren="开启"
            unCheckedChildren="关闭"
          />
        </Form.Item>

        <Form.Item label={<><GlobalOutlined /> 语言</>}>
          <Select value={language} onChange={onLanguageChange} style={{ width: 200 }}>
            <Option value="zh-CN">简体中文</Option>
            <Option value="en-US">English</Option>
            <Option value="ja-JP">日本語</Option>
          </Select>
        </Form.Item>

        <Form.Item label="主题">
          <Select value={theme} onChange={onThemeChange} style={{ width: 200 }}>
            <Option value="light">浅色</Option>
            <Option value="dark">深色</Option>
            <Option value="auto">跟随系统</Option>
          </Select>
        </Form.Item>

        <Divider />

        <Form.Item>
          <Space>
            <Button icon={<UndoOutlined />} onClick={handleReset}>
              重置为默认
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default GeneralSettingsPanel;
