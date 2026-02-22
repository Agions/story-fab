import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Typography, 
  Space, 
  Statistic, 
  List, 
  Avatar, 
  Dropdown, 
  Tag, 
  Empty, 
  Tooltip,
  Input,
  Segmented
} from 'antd';
import { 
  PlusOutlined, 
  ClockCircleOutlined, 
  FireOutlined, 
  VideoCameraOutlined, 
  BarChartOutlined, 
  MoreOutlined, 
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  FolderOutlined,
  StarOutlined,
  StarFilled,
  AppstoreOutlined,
  BarsOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.less';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface Project {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  updatedAt: Date;
  size: number;
  starred: boolean;
  tags: string[];
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: '热门短剧《再见爱人》片段1',
    thumbnail: 'https://picsum.photos/300/169?random=1',
    duration: 75, // 秒
    updatedAt: new Date(2025, 4, 15, 14, 30),
    size: 45.8, // MB
    starred: true,
    tags: ['情感', '热门']
  },
  {
    id: '2',
    title: '搞笑段子合集：春节特辑',
    thumbnail: 'https://picsum.photos/300/169?random=2',
    duration: 120,
    updatedAt: new Date(2025, 4, 14, 9, 15),
    size: 68.2,
    starred: false,
    tags: ['搞笑', '节日']
  },
  {
    id: '3',
    title: '城市日出航拍素材',
    thumbnail: 'https://picsum.photos/300/169?random=3',
    duration: 45,
    updatedAt: new Date(2025, 4, 12, 16, 45),
    size: 102.5,
    starred: true,
    tags: ['风景', '航拍']
  },
  {
    id: '4',
    title: '《都市传说》第三集片段',
    thumbnail: 'https://picsum.photos/300/169?random=4',
    duration: 90,
    updatedAt: new Date(2025, 4, 10, 11, 20),
    size: 54.1,
    starred: false,
    tags: ['剧情', '悬疑']
  },
  {
    id: '5',
    title: '产品宣传片：智能家居',
    thumbnail: 'https://picsum.photos/300/169?random=5',
    duration: 60,
    updatedAt: new Date(2025, 4, 8, 10, 30),
    size: 38.7,
    starred: false,
    tags: ['商业', '科技']
  },
  {
    id: '6',
    title: '旅行Vlog：桂林山水',
    thumbnail: 'https://picsum.photos/300/169?random=6',
    duration: 180,
    updatedAt: new Date(2025, 4, 5, 18, 10),
    size: 215.3,
    starred: true,
    tags: ['旅行', 'Vlog']
  }
];

// 格式化时间显示
const formatTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

// 格式化时长显示
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [viewMode, setViewMode] = useState<string | number>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  
  // 统计数据
  const totalProjects = projects.length;
  const totalDuration = projects.reduce((sum, project) => sum + project.duration, 0);
  const totalSize = projects.reduce((sum, project) => sum + project.size, 0);
  
  // 搜索和过滤项目
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);
  
  // 切换收藏状态
  const toggleStar = (id: string) => {
    setProjects(projects.map(project => 
      project.id === id 
        ? { ...project, starred: !project.starred } 
        : project
    ));
  };
  
  // 删除项目
  const deleteProject = (id: string) => {
    setProjects(projects.filter(project => project.id !== id));
  };
  
  // 创建新项目
  const createNewProject = () => {
    navigate('/editor/new');
  };
  
  // 打开项目
  const openProject = (id: string) => {
    navigate(`/editor/${id}`);
  };
  
  // 项目操作菜单
  const projectMenu = (id: string) => ({
    items: [
      {
        key: '1',
        label: '编辑项目',
        icon: <EditOutlined />,
        onClick: () => openProject(id)
      },
      {
        key: '2',
        label: '复制项目',
        icon: <CopyOutlined />,
        onClick: () => console.log('复制项目', id)
      },
      {
        key: '3',
        label: '删除项目',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => deleteProject(id)
      },
    ],
  });
  
  // 渲染网格视图中的项目卡片
  const renderGridItem = (project: Project) => (
    <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
      <Card 
        className={styles.projectCard}
        cover={
          <div className={styles.thumbnailContainer}>
            <img 
              alt={project.title} 
              src={project.thumbnail} 
              className={styles.thumbnail}
              onClick={() => openProject(project.id)}
            />
            <div className={styles.duration}>
              {formatDuration(project.duration)}
            </div>
            <Button 
              className={styles.starButton}
              type="text" 
              icon={project.starred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(project.id);
              }}
            />
          </div>
        }
        actions={[
          <Tooltip title="编辑项目">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openProject(project.id)}
            />
          </Tooltip>,
          <Tooltip title="导出视频">
            <Button 
              type="text" 
              icon={<CloudUploadOutlined />} 
              onClick={() => console.log('导出', project.id)}
            />
          </Tooltip>,
          <Dropdown menu={projectMenu(project.id)} placement="bottomRight" trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ]}
      >
        <Card.Meta
          title={
            <Tooltip title={project.title}>
              <div className={styles.projectTitle}>{project.title}</div>
            </Tooltip>
          }
          description={
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <div className={styles.projectInfo}>
                <Text type="secondary">{formatTime(project.updatedAt)}</Text>
                <Text type="secondary">{project.size.toFixed(1)} MB</Text>
              </div>
              <div className={styles.projectTags}>
                {project.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </Space>
          }
        />
      </Card>
    </Col>
  );
  
  // 渲染列表视图中的项目
  const renderListItem = (project: Project) => (
    <List.Item
      key={project.id}
      actions={[
        <Button
          type="text"
          icon={project.starred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
          onClick={() => toggleStar(project.id)}
        />,
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => openProject(project.id)}
        />,
        <Button
          type="text"
          icon={<CloudUploadOutlined />}
          onClick={() => console.log('导出', project.id)}
        />,
        <Dropdown menu={projectMenu(project.id)} placement="bottomRight" trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ]}
    >
      <List.Item.Meta
        avatar={
          <div className={styles.listThumbnailContainer}>
            <img 
              alt={project.title} 
              src={project.thumbnail} 
              className={styles.listThumbnail}
            />
            <div className={styles.listDuration}>
              {formatDuration(project.duration)}
            </div>
          </div>
        }
        title={<a onClick={() => openProject(project.id)}>{project.title}</a>}
        description={
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <div className={styles.projectInfo}>
              <Text type="secondary">更新于: {formatTime(project.updatedAt)}</Text>
              <Text type="secondary">大小: {project.size.toFixed(1)} MB</Text>
            </div>
            <div className={styles.projectTags}>
              {project.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </Space>
        }
      />
    </List.Item>
  );
  
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <div>
          <Title level={2}>我的项目</Title>
          <Paragraph type="secondary">管理和编辑您的短视频项目</Paragraph>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={createNewProject}
          className={styles.newProjectButton}
        >
          新建项目
        </Button>
      </div>
      
      {/* 统计数据 */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="项目总数"
              value={totalProjects}
              prefix={<FolderOutlined />}
              className={styles.statistic}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总时长"
              value={(totalDuration / 60).toFixed(1)}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
              className={styles.statistic}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="存储容量"
              value={(totalSize / 1024).toFixed(2)}
              suffix="GB"
              prefix={<BarChartOutlined />}
              className={styles.statistic}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 项目筛选工具栏 */}
      <div className={styles.projectToolbar}>
        <Search
          placeholder="搜索项目..."
          allowClear
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 250 }}
          prefix={<SearchOutlined />}
        />
        <Segmented
          options={[
            {
              value: 'grid',
              icon: <AppstoreOutlined />,
            },
            {
              value: 'list',
              icon: <BarsOutlined />,
            },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>
      
      {/* 项目列表 */}
      {filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <Row gutter={[16, 16]} className={styles.projectGrid}>
            {filteredProjects.map(renderGridItem)}
          </Row>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={filteredProjects}
            renderItem={renderListItem}
            className={styles.projectList}
          />
        )
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            searchQuery ? "没有找到匹配的项目" : "还没有创建任何项目"
          }
          className={styles.emptyState}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={createNewProject}>
            创建第一个项目
          </Button>
        </Empty>
      )}
      
      {/* 快速工具 */}
      <Card title="快速工具" className={styles.quickTools}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Card className={styles.toolCard} onClick={() => navigate('/templates')}>
              <VideoCameraOutlined className={styles.toolIcon} />
              <div className={styles.toolTitle}>模板库</div>
              <div className={styles.toolDesc}>使用专业模板快速创建</div>
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card className={styles.toolCard} onClick={() => navigate('/assets')}>
              <FolderOutlined className={styles.toolIcon} />
              <div className={styles.toolTitle}>素材库</div>
              <div className={styles.toolDesc}>管理您的视频素材</div>
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card className={styles.toolCard} onClick={() => navigate('/ai-tools')}>
              <FireOutlined className={styles.toolIcon} />
              <div className={styles.toolTitle}>AI 助手</div>
              <div className={styles.toolDesc}>智能生成内容与剪辑</div>
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card className={styles.toolCard} onClick={() => navigate('/settings')}>
              <BarChartOutlined className={styles.toolIcon} />
              <div className={styles.toolTitle}>数据分析</div>
              <div className={styles.toolDesc}>查看您的创作数据</div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard; 