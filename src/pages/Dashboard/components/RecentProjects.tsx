/**
 * 最近项目列表组件
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  List,
  Dropdown,
  Tag,
  Empty,
  Tooltip,
  Input,
  Segmented,
  Button,
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  StarOutlined,
  StarFilled,
  AppstoreOutlined,
  BarsOutlined,
  SearchOutlined,
  FileTextOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Project, ProjectStatus } from '../types';
import styles from '../index.module.less';

const { Search } = Input;

/** 状态配置 */
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  completed: {
    label: '已完成',
    className: styles.statusCompleted,
    icon: <CheckCircleOutlined />,
  },
  processing: {
    label: 'AI 分析中',
    className: styles.statusProcessing,
    icon: <SyncOutlined />,
  },
  draft: {
    label: '草稿',
    className: styles.statusDraft,
    icon: <FileTextOutlined />,
  },
  failed: {
    label: '失败',
    className: styles.statusDraft,
    icon: <FileTextOutlined />,
  },
};

/** 状态标签组件 */
const StatusBadge: React.FC<{ status: ProjectStatus }> = React.memo(({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`${styles.statusBadge} ${config.className}`}>
      <span className={styles.statusDot} />
      {config.icon}
      {config.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

/** 格式化时间显示 */
const formatTime = (date: Date | string): string => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天 ' + targetDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '昨天 ' + targetDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return targetDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

/** 格式化时长 */
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/** 项目卡片组件 - 使用 React.memo 避免不必要的重渲染 */
interface ProjectCardProps {
  project: Project;
  onOpenProject: (id: string) => void;
  onToggleStar: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = React.memo(({ project, onOpenProject, onToggleStar }) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenProject(project.id);
    }
  }, [onOpenProject, project.id]);

  const menuItems = useMemo(() => [
    {
      key: 'edit',
      label: '编辑项目',
      icon: <EditOutlined />,
      onClick: () => onOpenProject(project.id),
    },
    {
      key: 'duplicate',
      label: '复制项目',
      icon: <CopyOutlined />,
      onClick: () => {},
    },
    {
      key: 'delete',
      label: '删除项目',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {},
    },
  ], [onOpenProject, project.id]);

  return (
    <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
      <Card
        className={styles.projectCard}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        cover={
          <div className={styles.thumbnailContainer}>
            <img
              alt={project.title}
              src={project.thumbnail}
              className={styles.thumbnail}
              loading="lazy"
              decoding="async"
              draggable={false}
              onClick={() => onOpenProject(project.id)}
            />
            <div className={styles.duration}>{formatDuration(project.duration)}</div>
            <Tooltip title={project.starred ? '取消收藏' : '收藏'}>
              <Button
                className={styles.starButton}
                type="text"
                icon={
                  project.starred ? (
                    <StarFilled style={{ color: '#FF9F43' }} />
                  ) : (
                    <StarOutlined />
                  )
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(project.id);
                }}
                aria-label={project.starred ? '取消收藏' : '收藏项目'}
              />
            </Tooltip>
            <div className={styles.thumbnailOverlay}>
              <VideoCameraOutlined className={styles.viewIcon} />
            </div>
          </div>
        }
        actions={[
          <Tooltip key="edit" title="编辑项目">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onOpenProject(project.id)}
              aria-label="编辑项目"
            />
          </Tooltip>,
          <Tooltip key="export" title="导出视频">
            <Button
              type="text"
              icon={<CloudUploadOutlined />}
              onClick={() => {}}
              aria-label="导出视频"
            />
          </Tooltip>,
          <Dropdown
            key="more"
            menu={{ items: menuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} aria-label="更多操作" />
          </Dropdown>,
        ]}
      >
        <div className={styles.projectInfo}>
          <div className={styles.projectTitle}>{project.title}</div>
          <div className={styles.projectMeta}>
            <span className={styles.projectTime}>
              <ClockCircleOutlined />
              {formatTime(project.updatedAt)}
            </span>
            <span className={styles.projectSize}>{project.size.toFixed(1)} MB</span>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </Card>
    </Col>
  );
});
ProjectCard.displayName = 'ProjectCard';

interface RecentProjectsProps {
  projects: Project[];
  loading: boolean;
  onOpenProject: (id: string) => void;
  onToggleStar: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onCreateProject: () => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = React.memo(({
  projects,
  loading,
  onOpenProject,
  onToggleStar,
  onDeleteProject,
  onCreateProject,
}) => {
  const [viewMode, setViewMode] = useState<string | number>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // 搜索过滤 - 使用 useMemo 避免每次渲染时重新计算
  const filteredProjects = useMemo(() => {
    if (searchQuery.trim() === '') return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  // 快捷操作菜单 - 使用 useMemo 避免每次渲染时重新创建
  const getProjectMenuItems = useCallback((id: string) => [
    {
      key: 'edit',
      label: '编辑项目',
      icon: <EditOutlined />,
      onClick: () => onOpenProject(id),
    },
    {
      key: 'duplicate',
      label: '复制项目',
      icon: <CopyOutlined />,
      onClick: () => {},
    },
    {
      key: 'delete',
      label: '删除项目',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDeleteProject(id),
    },
  ], [onOpenProject, onDeleteProject]);

  // 键盘事件处理 - 使用 useCallback
  const handleProjectKeyDown = useCallback((projectId: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenProject(projectId);
    }
  }, [onOpenProject]);

  // 列表项组件 - 使用 React.memo 避免不必要的重渲染
  const ListItem: React.FC<{ project: Project }> = React.memo(({ project: projectProp }) => {
    const menuItems = useMemo(() => getProjectMenuItems(projectProp.id), [getProjectMenuItems, projectProp.id]);

    return (
      <List.Item
        role="button"
        tabIndex={0}
        onKeyDown={handleProjectKeyDown(projectProp.id)}
        aria-label={`项目: ${projectProp.title}`}
        actions={[
          <Tooltip key="star" title={projectProp.starred ? '取消收藏' : '收藏'}>
            <Button
              type="text"
              icon={
                projectProp.starred ? (
                  <StarFilled style={{ color: '#FF9F43' }} />
                ) : (
                  <StarOutlined />
                )
              }
              onClick={() => onToggleStar(projectProp.id)}
              aria-label={projectProp.starred ? '取消收藏' : '收藏项目'}
            />
          </Tooltip>,
          <Tooltip key="edit" title="编辑项目">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onOpenProject(projectProp.id)}
              aria-label="编辑项目"
            />
          </Tooltip>,
          <Tooltip key="export" title="导出视频">
            <Button
              type="text"
              icon={<CloudUploadOutlined />}
              onClick={() => {}}
              aria-label="导出视频"
            />
          </Tooltip>,
          <Dropdown
            key="more"
            menu={{ items: menuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} aria-label="更多操作" />
          </Dropdown>,
        ]}
      >
        <List.Item.Meta
          avatar={
            <div className={styles.listThumbnailContainer}>
              <img
                alt={projectProp.title}
                src={projectProp.thumbnail}
                className={styles.listThumbnail}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <div className={styles.listDuration}>
                {formatDuration(projectProp.duration)}
              </div>
            </div>
          }
          title={
            <a onClick={() => onOpenProject(projectProp.id)}>
              {projectProp.title}
            </a>
          }
          description={
            <div className={styles.projectMeta}>
              <span className={styles.projectTime}>
                <ClockCircleOutlined />
                {formatTime(projectProp.updatedAt)}
              </span>
              <span className={styles.projectSize}>{projectProp.size.toFixed(1)} MB</span>
            </div>
          }
        />
      </List.Item>
    );
  });
  ListItem.displayName = 'ListItem';

  // 视图切换处理器
  const handleViewModeChange = useCallback((value: string | number) => {
    setViewMode(value);
  }, []);

  // 搜索处理器
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <>
      {/* 搜索工具栏 */}
      <div className={styles.projectToolbar}>
        <div className={styles.searchInput}>
          <Search
            placeholder="搜索项目..."
            allowClear
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
          />
        </div>
        <div className={styles.viewToggle}>
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
            onChange={handleViewModeChange}
          />
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <Row gutter={[16, 16]} className={styles.projectGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card className={styles.skeletonCard} loading />
            </Col>
          ))}
        </Row>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <Row gutter={[16, 16]} className={styles.projectGrid}>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpenProject={onOpenProject}
                onToggleStar={onToggleStar}
              />
            ))}
          </Row>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={filteredProjects}
            renderItem={(project) => <ListItem key={project.id} project={project} />}
            className={styles.projectList}
          />
        )
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#8888A0', fontFamily: '"Figtree", sans-serif' }}>
              {searchQuery ? '没有找到匹配的项目' : '还没有创建任何项目'}
            </span>
          }
          className={styles.emptyState}
        >
          <button
            className={styles.emptyButton}
            onClick={onCreateProject}
          >
            <PlusOutlined />
            创建第一个项目
          </button>
        </Empty>
      )}
    </>
  );
});

export default RecentProjects;
RecentProjects.displayName = 'RecentProjects';
