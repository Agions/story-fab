import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { Project } from '../types';
import { notify } from '../shared';
import styles from './ProjectForm.module.less';

interface ProjectFormProps {
  initialValues?: Partial<Project>;
  onSubmit: (values: Partial<Project>) => Promise<void>;
  loading?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
}) => {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [videoUrl, setVideoUrl] = useState(initialValues?.videoUrl || '');
  const [errors, setErrors] = useState<{ name?: string; description?: string; videoUrl?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = '请输入项目名称';
    if (!description.trim()) newErrors.description = '请输入项目描述';
    if (!videoUrl.trim()) {
      newErrors.videoUrl = '请输入视频链接';
    } else {
      try {
        new URL(videoUrl);
      } catch {
        newErrors.videoUrl = '请输入有效的视频链接';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit({ name, description, videoUrl });
      notify.success('保存成功');
    } catch (error) {
      notify.error(error, '保存失败');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form + ' flex flex-col gap-4'}>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">项目名称</label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="请输入项目名称"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">项目描述</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="请输入项目描述"
          rows={4}
          className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.description ? 'border-destructive' : ''}`}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">视频链接</label>
        <Input
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="请输入视频链接"
          className={errors.videoUrl ? 'border-destructive' : ''}
        />
        {errors.videoUrl && <p className="text-xs text-destructive">{errors.videoUrl}</p>}
      </div>

      <Button type="submit" disabled={loading} className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white self-start">
        {loading ? '保存中...' : '保存'}
      </Button>
    </form>
  );
};

export default ProjectForm;
