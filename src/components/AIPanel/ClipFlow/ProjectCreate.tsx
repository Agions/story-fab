/**
 * 步骤1: 创建项目
 * 
 * 数据输出: project (ProjectData)
 * 流转到: VideoUpload
 */
import React, { useState } from 'react';
import { Form, Input, Select, Button, Card, Space, Typography, message } from 'antd';
import { PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useClipFlow } from '../AIEditorContext';
import type { ProjectData } from '@/core/types';
import styles from './ClipFlow.module.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ProjectCreateProps {
  onNext?: () => void;
}

const ProjectCreate: React.FC<ProjectCreateProps> = ({ onNext }) => {
  const { state, setProject, goToNextStep } = useClipFlow();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 项目类型选项
  const projectTypeOptions = [
    { value: 'marketing', label: '营销推广', desc: '产品宣传、活动推广' },
    { value: 'education', label: '教育培训', desc: '课程讲解、技能培训' },
    { value: 'entertainment', label: '娱乐内容', desc: '搞笑集锦、影视解说' },
    { value: 'news', label: '新闻资讯', desc: '热点解读、时事评论' },
    { value: 'custom', label: '自定义', desc: '其他类型项目' },
  ];

  // 处理创建项目
  const handleCreateProject = async (values: {
    name: string;
    type: string;
    description?: string;
  }) => {
    setLoading(true);
    try {
      // 创建项目数据
      const newProject: ProjectData = {
        id: `project_${Date.now()}`,
        name: values.name,
        description: values.description,
        status: 'draft',
        videos: [],
        scripts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          videoQuality: 'high',
          outputFormat: 'mp4',
          resolution: '1080p',
          frameRate: 30,
          audioCodec: 'aac',
          videoCodec: 'h264',
          subtitleEnabled: true,
          subtitleStyle: {
            fontFamily: '思源黑体',
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            outline: true,
            outlineColor: '#000000',
            position: 'bottom',
            alignment: 'center',
          },
        },
      };

      // 保存到状态
      setProject(newProject);
      message.success('项目创建成功');
      
      // 跳转到下一步
      if (onNext) {
        onNext();
      } else {
        goToNextStep();
      }
    } catch (error) {
      message.error('项目创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 如果已有项目，显示项目信息
  if (state.project) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          <Title level={4}>当前项目</Title>
          <Paragraph>
            项目已创建，您可以继续下一步或重新创建
          </Paragraph>
        </div>

        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text type="secondary">项目名称</Text>
              <Title level={5} style={{ margin: '4px 0 0' }}>
                {state.project.name}
              </Title>
            </div>
            {state.project.description && (
              <div>
                <Text type="secondary">项目描述</Text>
                <Paragraph style={{ margin: '4px 0 0' }}>
                  {state.project.description}
                </Paragraph>
              </div>
            )}
            <div>
              <Text type="secondary">创建时间</Text>
              <Paragraph style={{ margin: '4px 0 0' }}>
                {new Date(state.project.createdAt).toLocaleString('zh-CN')}
              </Paragraph>
            </div>
            <Button 
              type="primary" 
              icon={<ArrowRightOutlined />}
              onClick={goToNextStep}
              block
            >
              下一步：上传视频
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  // 创建项目表单
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <Title level={4}>创建新项目</Title>
        <Paragraph>
          为您的视频剪辑项目设置基本信息
        </Paragraph>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
          initialValues={{
            type: 'marketing',
          }}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[
              { required: true, message: '请输入项目名称' },
              { min: 2, message: '项目名称至少2个字符' },
            ]}
          >
            <Input 
              placeholder="例如：产品宣传视频" 
              maxLength={50}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="项目类型"
            rules={[{ required: true, message: '请选择项目类型' }]}
          >
            <Select placeholder="选择项目类型">
              {projectTypeOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  <Space direction="vertical" size={0}>
                    <span>{opt.label}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {opt.desc}
                    </Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="项目描述（可选）"
          >
            <TextArea 
              placeholder="简要描述项目的目标和内容..." 
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<PlusOutlined />}
              block
              size="large"
            >
              创建项目
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectCreate;
