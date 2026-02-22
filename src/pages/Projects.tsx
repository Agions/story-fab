import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Card, Row, Col, Input, Select,
  Table, Tag, Space, Modal, message, Empty, Dropdown, Progress, Tooltip
} from 'antd';
import { useStore } from '@/store/index';
import { Project } from '@/types';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  EllipsisOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
  ExportOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

const ProjectManager: React.FC = () => {
  const navigate = useNavigate();
  const { projects: storeProjects, deleteProject } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading time for smooth UI transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const statusConfig: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    processing: { color: 'processing', text: '制作中' },
    completed: { color: 'success', text: '已完成' },
    exported: { color: 'purple', text: '已导出' },
  };

  // Helper to map a Project from useStore to UI fields structure
  const getProjectUIStatus = (project: Project) => {
    let scriptCount = project.scripts?.length || 0;
    let videoCount = project.videoUrl ? 1 : 0;
    let status = 'draft';
    let progress = 0;

    if (project.analysis) {
      progress = 50;
      status = 'processing';
      if (scriptCount > 0) {
        progress = 100;
        status = 'completed';
      }
    } else if (project.videoUrl) {
      progress = 25;
      status = 'draft';
    }

    return { scriptCount, videoCount, status, progress };
  };

  const filteredProjects = storeProjects.filter(p => {
    const matchSearch = !searchText || p.name.includes(searchText) || p.description?.includes(searchText);
    const uiStatus = getProjectUIStatus(p).status;
    const matchStatus = statusFilter === 'all' || uiStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除此项目吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteProject(id);
        message.success('项目已删除');
      }
    });
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const projectActions = (project: Project) => ({
    items: [
      { key: 'edit', label: '编辑项目', icon: <EditOutlined />, onClick: () => navigate(`/project/edit/${project.id}`) },
      { key: 'editor', label: '进入工作台', icon: <PlayCircleOutlined />, onClick: () => navigate(`/editor/${project.id}`) },
      { key: 'export', label: '导出', icon: <ExportOutlined /> },
      { type: 'divider' as const },
      { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(project.id) },
    ]
  });

  // 网格视图
  const GridView = () => (
    <Row gutter={[16, 16]}>
      {/* 创建项目卡片 */}
      <Col xs={24} sm={12} md={8} lg={6}>
        <Card
          hoverable
          onClick={() => navigate('/project/new')}
          style={{ 
            borderRadius: 10, height: 220, 
            border: '2px dashed rgba(102, 126, 234, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' } }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea15, #764ba215)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#667eea', marginBottom: 12,
          }}>
            <PlusOutlined />
          </div>
          <Text strong style={{ color: '#667eea' }}>创建新项目</Text>
        </Card>
      </Col>

      {filteredProjects.map(project => {
        const uiStatus = getProjectUIStatus(project);
        return (
          <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
            <Card
              hoverable
              onClick={() => navigate(`/project/${project.id}`)}
              style={{ borderRadius: 10, height: 220, overflow: 'hidden' }}
              styles={{ body: { padding: 16, height: '100%', display: 'flex', flexDirection: 'column' } }}
            >
              {/* 顶部：状态和菜单 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Tag color={statusConfig[uiStatus.status]?.color || 'default'} style={{ margin: 0, borderRadius: 4 }}>
                  {statusConfig[uiStatus.status]?.text || '草稿'}
                </Tag>
                <Dropdown menu={projectActions(project)} trigger={['click']}>
                  <Button type="text" icon={<EllipsisOutlined />} size="small" onClick={e => e.stopPropagation()} />
                </Dropdown>
              </div>

              {/* 项目名 */}
              <Title level={5} ellipsis style={{ margin: '0 0 4px' }}>{project.name}</Title>
              <Text type="secondary" ellipsis style={{ fontSize: 12, marginBottom: 12 }}>{project.description}</Text>

              {/* 进度 */}
              <Progress 
                percent={uiStatus.progress} 
                size="small" 
                strokeColor={{ from: '#667eea', to: '#764ba2' }}
                style={{ marginBottom: 8 }}
              />

              {/* 底部信息 */}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={12}>
                  <Tooltip title="视频数"><Text type="secondary" style={{ fontSize: 11 }}><VideoCameraOutlined /> {uiStatus.videoCount}</Text></Tooltip>
                  <Tooltip title="脚本数"><Text type="secondary" style={{ fontSize: 11 }}><FolderOpenOutlined /> {uiStatus.scriptCount}</Text></Tooltip>
                </Space>
                <Text type="secondary" style={{ fontSize: 11 }}>{formatDate(project.updatedAt)}</Text>
              </div>
            </Card>
          </Col>
        );
      })}

      {filteredProjects.length === 0 && !loading && (
        <Col span={24}>
          <Empty description="暂无匹配的项目" style={{ padding: 60 }} />
        </Col>
      )}
    </Row>
  );

  // 列表视图
  const ListView = () => (
    <Table
      dataSource={filteredProjects}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10 }}
      onRow={(record) => ({ onClick: () => navigate(`/project/${record.id}`), style: { cursor: 'pointer' } })}
      columns={[
        {
          title: '项目名称',
          dataIndex: 'name',
          render: (name: string, record: Project) => (
            <div>
              <Text strong>{name}</Text>
              <div><Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text></div>
            </div>
          )
        },
        {
          title: '状态',
          key: 'status',
          width: 100,
          render: (_: any, record: Project) => {
            const uiStatus = getProjectUIStatus(record).status;
            return <Tag color={statusConfig[uiStatus]?.color}>{statusConfig[uiStatus]?.text}</Tag>;
          }
        },
        {
          title: '进度',
          key: 'progress',
          width: 140,
          render: (_: any, record: Project) => {
            const progress = getProjectUIStatus(record).progress;
            return <Progress percent={progress} size="small" strokeColor={{ from: '#667eea', to: '#764ba2' }} />;
          }
        },
        {
          title: '素材',
          key: 'assets',
          width: 100,
          render: (_: any, record: Project) => {
            const uiStatus = getProjectUIStatus(record);
            return (
              <Space size={8}>
                <Text type="secondary" style={{ fontSize: 12 }}><VideoCameraOutlined /> {uiStatus.videoCount}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}><FolderOpenOutlined /> {uiStatus.scriptCount}</Text>
              </Space>
            );
          }
        },
        {
          title: '更新时间',
          dataIndex: 'updatedAt',
          width: 120,
          render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(d)}</Text>
        },
        {
          title: '操作',
          width: 120,
          render: (_: any, record: Project) => (
            <Space>
              <Tooltip title="进入工作台">
                <Button type="text" icon={<PlayCircleOutlined />} onClick={e => { e.stopPropagation(); navigate(`/editor/${record.id}`); }} />
              </Tooltip>
              <Dropdown menu={projectActions(record)} trigger={['click']}>
                <Button type="text" icon={<EllipsisOutlined />} onClick={e => e.stopPropagation()} />
              </Dropdown>
            </Space>
          )
        },
      ]}
    />
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 工具栏 */}
      <Card bordered={false} style={{ borderRadius: 10, marginBottom: 16 }} styles={{ body: { padding: '12px 20px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space size={12}>
            <Search
              placeholder="搜索项目..."
              allowClear
              style={{ width: 240 }}
              onSearch={v => setSearchText(v)}
              onChange={e => !e.target.value && setSearchText('')}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'draft', label: '草稿' },
                { value: 'processing', label: '制作中' },
                { value: 'completed', label: '已完成' },
                { value: 'exported', label: '已导出' },
              ]}
            />
          </Space>
          
          <Space size={8}>
            <Button.Group>
              <Tooltip title="网格视图">
                <Button 
                  icon={<AppstoreOutlined />} 
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                />
              </Tooltip>
              <Tooltip title="列表视图">
                <Button 
                  icon={<UnorderedListOutlined />}
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                />
              </Tooltip>
            </Button.Group>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/project/new')}
              style={{ 
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', borderRadius: 6,
              }}
            >
              新建项目
            </Button>
          </Space>
        </div>
      </Card>

      {/* 项目统计 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: '全部', value: storeProjects.length, color: '#667eea', filter: 'all' },
          { label: '草稿', value: storeProjects.filter(p => getProjectUIStatus(p).status === 'draft').length, color: '#8c8c8c', filter: 'draft' },
          { label: '制作中', value: storeProjects.filter(p => getProjectUIStatus(p).status === 'processing').length, color: '#1890ff', filter: 'processing' },
          { label: '已完成', value: storeProjects.filter(p => getProjectUIStatus(p).status === 'completed').length, color: '#52c41a', filter: 'completed' },
          { label: '已导出', value: storeProjects.filter(p => getProjectUIStatus(p).status === 'exported').length, color: '#722ed1', filter: 'exported' },
        ].map((item, idx) => (
          <Col key={idx}>
            <Tag
              style={{ 
                cursor: 'pointer', padding: '4px 12px', borderRadius: 6, fontSize: 13,
                background: statusFilter === item.filter ? `${item.color}15` : undefined,
                borderColor: statusFilter === item.filter ? item.color : undefined,
                color: statusFilter === item.filter ? item.color : undefined,
              }}
              onClick={() => setStatusFilter(item.filter)}
            >
              {item.label} <Text strong style={{ color: 'inherit' }}>{item.value}</Text>
            </Tag>
          </Col>
        ))}
      </Row>

      {/* 内容区 */}
      {viewMode === 'grid' ? <GridView /> : <ListView />}
    </div>
  );
};

export default ProjectManager;
