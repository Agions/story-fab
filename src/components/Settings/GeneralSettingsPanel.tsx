/**
 * 通用设置面板
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Settings, RotateCcw } from 'lucide-react';
import { notify } from '../../shared';
import type { ProjectSaveBehavior } from '../../shared/constants/settings';

interface GeneralSettingsPanelProps {
  autoSave: boolean;
  compactMode: boolean;
  theme: string;
  projectSaveBehavior: ProjectSaveBehavior;
  onAutoSaveChange: (v: boolean) => void;
  onCompactModeChange: (v: boolean) => void;
  onThemeChange: (v: string) => void;
  onProjectSaveBehaviorChange: (v: ProjectSaveBehavior) => void;
  onReset: () => void;
}

const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({
  autoSave,
  compactMode,
  theme,
  projectSaveBehavior,
  onAutoSaveChange,
  onCompactModeChange,
  onThemeChange,
  onProjectSaveBehaviorChange,
  onReset,
}) => {
  const handleReset = () => {
    onReset();
    notify.success('设置已重置');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Settings size={16} />
          通用设置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium">自动保存</span>
            <span className="text-xs text-muted-foreground">自动保存项目更改</span>
          </div>
          <Switch
            checked={autoSave}
            onCheckedChange={onAutoSaveChange}
            aria-label="自动保存开关"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium">紧凑模式</span>
            <span className="text-xs text-muted-foreground">使用更紧凑的界面布局</span>
          </div>
          <Switch
            checked={compactMode}
            onCheckedChange={onCompactModeChange}
            aria-label="紧凑模式开关"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">主题</span>
          <select
            value={theme}
            onChange={e => onThemeChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm w-40"
            aria-label="主题选择"
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">项目保存后跳转</span>
          <select
            value={projectSaveBehavior}
            onChange={e => onProjectSaveBehaviorChange(e.target.value as ProjectSaveBehavior)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm w-44"
            aria-label="保存后跳转行为"
          >
            <option value="stay">留在编辑页</option>
            <option value="detail">跳转项目详情</option>
          </select>
        </div>

        <div className="h-px bg-border my-2" />

        <Button onClick={handleReset} aria-label="重置设置">
          <RotateCcw size={14} className="mr-1" />
          重置为默认
        </Button>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsPanel;
