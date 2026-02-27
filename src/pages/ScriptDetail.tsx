import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, Spin, message, Divider, Modal, Tag } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined, ExportOutlined, RobotOutlined } from '@ant-design/icons';
import { useStore } from '@/store';
import ScriptEditor from '@/components/ScriptEditor';
import { exportScriptToFile, saveProjectToFile } from '@/services/tauriService';
import styles from './ScriptDetail.module.less';

const { Title, Text } = Typography;

const ScriptDetail: React.FC = () => {
  const { projectId, scriptId } = useParams<{ projectId: string; scriptId: string }>();
  const navigate = useNavigate();
  const { projects, updateProject } = useStore();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [script, setScript] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId || !scriptId) {
      message.error('参数错误');
      navigate('/projects');
      return;
    }

    const currentProject = projects.find(p => p.id === projectId);
    if (!currentProject) {
      message.error('找不到项目');
      navigate('/projects');
      return;
    }

    const currentScript = currentProject.scripts?.find((s: any) => s.id === scriptId);
    if (!currentScript) {
      message.error('找不到脚本');
      navigate(`/projects/${projectId}`);
      return;
    }

    setProject(currentProject);
    setScript(currentScript);
    setSegments(currentScript.content || []);
    setLoading(false);
  }, [projectId, scriptId, projects, navigate]);

  const handleSegmentsChange = (newSegments: any[]) => {
    setSegments(newSegments);
  };

  const handleSave = async () => {
    if (!project || !script) return;

    try {
      setLoading(true);

      // 更新脚本
      const updatedScript = {
        ...script,
        content: segments,
        updatedAt: new Date().toISOString()
      };

      // 更新项目中的脚本
      const updatedScripts = project.scripts.map((s: any) => 
        s.id === script.id ? updatedScript : s
      );

      // 更新项目
      const updatedProject = {
        ...project,
        scripts: updatedScripts,
        updatedAt: new Date().toISOString()
      };

      // 更新状态和store
      setProject(updatedProject);
      setScript(updatedScript);
      updateProject(updatedProject);

      // 保存到文件
      await saveProjectToFile(updatedProject);
      
      message.success('保存成功');
    } catch {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!project || !script) return;

    try {
      await exportScriptToFile(
        {
          projectName: project.name,
          createdAt: script.createdAt,
          segments: segments
        },
        `${project.name}_脚本_${new Date().toISOString().slice(0, 10)}.txt`
      );
    } catch {
      console.error('导出脚本失败:', error);
      message.error('导出失败');
    }
  };

  const handleDelete = () => {
    if (!project || !script) return;

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个脚本吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 过滤掉要删除的脚本
          const updatedScripts = project.scripts.filter((s: any) => s.id !== script.id);
          
          // 更新项目
          const updatedProject = {
            ...project,
            scripts: updatedScripts,
            updatedAt: new Date().toISOString()
          };

          // 更新store
          updateProject(updatedProject);

          // 保存到文件
          await saveProjectToFile(updatedProject);
          
          message.success('删除成功');
          navigate(`/projects/${project.id}`);
        } catch {
          console.error('删除脚本失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  if (loading) {
    return <Spin size="large" tip="加载中..." />;
  }

  if (!project || !script) {
    return <div>资源不存在</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            返回项目
          </Button>
          
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
          >
            保存
          </Button>
          
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
            disabled={segments.length === 0}
          >
            导出
          </Button>
          
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            删除
          </Button>
        </Space>
      </div>

      <Card className={styles.infoCard}>
        <Title level={4}>{project.name} - 脚本编辑</Title>
        <div className={styles.scriptInfo}>
          <Text type="secondary">创建于 {new Date(script.createdAt).toLocaleString()}</Text>
          {script.modelUsed && (
            <Tag color="blue" icon={<RobotOutlined />} className={styles.modelTag}>
              由 {script.modelUsed} 生成
            </Tag>
          )}
        </div>
        <Divider />
        <div className={styles.stats}>
          <Space>
            <Text>片段数量: {segments.length}</Text>
            <Text>总时长: {segments.reduce((total, seg) => total + (seg.endTime - seg.startTime), 0)} 秒</Text>
          </Space>
        </div>
      </Card>
      
      <div className={styles.editorContainer}>
        <ScriptEditor
          segments={segments}
          onSegmentsChange={handleSegmentsChange}
        />
      </div>
    </div>
  );
};

export default ScriptDetail; 