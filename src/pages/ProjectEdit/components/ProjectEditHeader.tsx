import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import type { ProjectSaveBehavior } from '../projectEditUtils';
import styles from '@/pages/ProjectEdit/index.module.less';

interface ProjectEditHeaderProps {
  isNewProject: boolean;
  loading: boolean;
  initialLoading: boolean;
  saving: boolean;
  saveBehavior: ProjectSaveBehavior;
  autoSaveEnabled: boolean;
  onBack: () => void;
  onSave: () => void;
  onSaveBehaviorChange: (v: ProjectSaveBehavior) => void;
  onAutoSaveToggle: (checked: boolean) => void;
}

export const ProjectEditHeader = React.memo<ProjectEditHeaderProps>(({
  isNewProject, loading, initialLoading, saving, saveBehavior,
  autoSaveEnabled, onBack, onSave, onSaveBehaviorChange, onAutoSaveToggle,
}) => (
  <div className={styles.header}>
    <Button variant="ghost" icon={<ArrowLeft />} onClick={onBack}>返回</Button>
    <h3 className="text-base font-semibold">{isNewProject ? '创建新项目' : '编辑项目'}</h3>
    <div className="flex items-center gap-4">
      <div className={styles.saveBehaviorControl}>
        <span className={styles.saveBehaviorLabel}>保存后：</span>
        <Select value={saveBehavior} onValueChange={(v: string) => onSaveBehaviorChange(v as ProjectSaveBehavior)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stay">留在编辑页</SelectItem>
            <SelectItem value="detail">跳转项目详情</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className={styles.saveBehaviorControl}>
        <span className={styles.saveBehaviorLabel}>自动保存：</span>
        <Switch size="sm" checked={autoSaveEnabled} onCheckedChange={onAutoSaveToggle} />
      </div>
      <Button
        variant="default" icon={<Save />} onClick={onSave}
        disabled={loading || initialLoading || saving}
      >
        保存项目
      </Button>
    </div>
  </div>
));

ProjectEditHeader.displayName = 'ProjectEditHeader';
