import React from 'react';
import { Form, Input } from 'antd';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types';
import { notify } from '@/shared';
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
  const [form] = Form.useForm();

  const handleSubmit = async (values: Partial<Project>) => {
    try {
      await onSubmit(values);
      notify.success('保存成功');
    } catch (error) {
      notify.error(error, '保存失败');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
      className={styles.form}
    >
      <Form.Item
        name="name"
        label="项目名称"
        rules={[{ required: true, message: '请输入项目名称' }]}
      >
        <Input placeholder="请输入项目名称" />
      </Form.Item>

      <Form.Item
        name="description"
        label="项目描述"
        rules={[{ required: true, message: '请输入项目描述' }]}
      >
        <Input.TextArea
          placeholder="请输入项目描述"
          rows={4}
        />
      </Form.Item>

      <Form.Item
        name="videoUrl"
        label="视频链接"
        rules={[
          { required: true, message: '请输入视频链接' },
          { type: 'url', message: '请输入有效的视频链接' },
        ]}
      >
        <Input placeholder="请输入视频链接" />
      </Form.Item>

      <Form.Item>
        <Button type="submit" disabled={loading} className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white">
          {loading ? '保存中...' : '保存'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm; 
