import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import styles from '@/pages/ProjectEdit/index.module.less';

interface ProjectFormProps {
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}

export const ProjectForm = React.memo<ProjectFormProps>(({ name, description, onNameChange, onDescriptionChange }) => (
  <Card className={styles.card}>
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">项目名称</label>
        <Input
          placeholder="请输入项目名称"
          maxLength={100}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">项目描述</label>
        <textarea
          className="flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
          placeholder="请输入项目描述（选填）"
          rows={2}
          maxLength={500}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
    </div>
  </Card>
));

ProjectForm.displayName = 'ProjectForm';
