import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Table, Space, Modal, Input, Tag, Typography, Empty, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, VideoCameraOutlined, FileTextOutlined } from '@ant-design/icons';
import { getAppData, saveAppData } from '@/services/tauriService';
import { formatDate, formatDuration } from '@/utils/format';
import styles from './ProjectList.module.less';

const { Title, Text } = Typography;
const { Search } = Input;
const { confirm } = Modal;

interface Project {
  id: string;
  name: string;
  description: string;
  videoPath: string;
  videoInfo?: {
    duration: number;
    resolution: string;
  };
  createdAt: string;
  updatedAt: string;
  scriptCount: number;
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  useEffect(() => {
    loadProjects();
  }, []);
  
  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await getAppData<Project[]>('projects');
      if (projectsData) {
        setProjects(projectsData);
      }
    } catch {
      console.error('加载项目失败:', error);
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 创建新项目
  const handleCreateProject = () => {
    navigate('/project/create');
  };
  
  // 编辑项目
  const handleEditProject = (projectId: string) => {
    navigate(`/project/edit/${projectId}`);
  };
  
  // 查看项目详情
  const handleViewProject = (projectId: string) => {
    navigate(`/project/view/${projectId}`);
  };
  
  // 删除项目
  const handleDeleteProject = (project: Project) => {
    confirm({
      title: '确认删除项目',
      content: `确定要删除项目"${project.name}"吗？此操作不可恢复，相关的脚本也将被删除。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const updatedProjects = projects.filter(p => p.id !== project.id);
          await saveAppData('projects', updatedProjects);
          setProjects(updatedProjects);
          message.success('项目已删除');
        } catch {
          console.error('删除项目失败:', error);
          message.error('删除项目失败');
        }
      }
    });
  };
  
  // 搜索项目
  const handleSearch = (value: string) => {
    setSearchText(value);
  };
  
  // 过滤项目列表
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchText.toLowerCase()) ||
    project.description.toLowerCase().includes(searchText.toLowerCase())
  );
  
  // 表格列定义
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <div className={styles.projectName} onClick={() => handleViewProject(record.id)}>
          <span className={styles.nameText}>{text}</span>
          {record.videoInfo && (
            <Tag color="blue" className={styles.durationTag}>
              {formatDuration(record.videoInfo.duration)}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <div className={styles.description}>
          {text || <Text type="secondary">无描述</Text>}
        </div>
      )
    },
    {
      title: '视频',
      dataIndex: 'videoPath',
      key: 'videoPath',
      render: (path: string, record: Project) => (
        <div className={styles.videoInfo}>
          {path ? (
            <Tooltip title={path}>
              <Tag icon={<VideoCameraOutlined />} color="green">
                {path.split(/[\/\\]/).pop() || path}
              </Tag>
              {record.videoInfo && (
                <Tag color="blue">{record.videoInfo.resolution}</Tag>
              )}
            </Tooltip>
          ) : (
            <Text type="secondary">未添加视频</Text>
          )}
        </div>
      )
    },
    {
      title: '脚本数量',
      dataIndex: 'scriptCount',
      key: 'scriptCount',
      render: (count: number) => (
        <div className={styles.scriptCount}>
          {count > 0 ? (
            <Tag icon={<FileTextOutlined />} color="purple">
              {count} 个脚本
            </Tag>
          ) : (
            <Text type="secondary">无脚本</Text>
          )}
        </div>
      )
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date)
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Project) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditProject(record.id)}
            title="编辑"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteProject(record)}
            title="删除"
          />
        </Space>
      )
    }
  ];
  
  return (
    <div className={styles.projectList}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={4}>项目列表</Title>
          <div className={styles.actions}>
            <Search
              placeholder="搜索项目"
              allowClear
              onSearch={handleSearch}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250, marginRight: 16 }}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreateProject}
            >
              新建项目
            </Button>
          </div>
        </div>
        
        <Table
          dataSource={filteredProjects}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: total => `共 ${total} 个项目`
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <p>暂无项目</p>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={handleCreateProject}
                    >
                      创建第一个项目
                    </Button>
                  </div>
                }
              />
            )
          }}
          className={styles.table}
          onRow={(record) => ({
            onClick: () => handleViewProject(record.id),
            className: styles.tableRow
          })}
        />
      </Card>
    </div>
  );
};

export default ProjectList; 