import { logger } from '@/utils/logger';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Card, Row, Col,
  Space, Tag, Timeline, Progress, Spin
} from 'antd';
import {
  VideoCameraOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ExperimentOutlined,
  ScissorOutlined,
  SoundOutlined,
  ExportOutlined,
  ProjectOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { getFileSizeBytes, listProjects, PROJECTS_CHANGED_EVENT } from '@/services/tauri';
import { preloadProjectEditPage, preloadProjectsPage } from '@/core/utils/route-preload';
import {
  extractProjectMediaMetrics,
  pickPreferredSizeMb,
  resolveProjectVideoPath,
  type RawProjectRecord,
} from '@/shared';

const { Title, Paragraph, Text } = Typography;

interface HomeProjectItem {
  id: string;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt: string;
  status?: 'draft' | 'processing' | 'completed' | 'archived';
  durationSec?: number;
  sizeMb?: number;
}

// 工作流步骤 - 科技暗黑配色
const workflowSteps = [
  { icon: <VideoCameraOutlined />, title: '上传视频', desc: '支持 MP4/MOV/WebM', color: '#6366f1' },
  { icon: <ThunderboltOutlined />, title: '智能分析', desc: '场景检测 · 关键帧', color: '#8b5cf6' },
  { icon: <FileTextOutlined />, title: '脚本生成', desc: '8大AI模型 · 7种模板', color: '#a855f7' },
  { icon: <ExperimentOutlined />, title: '去重优化', desc: '原创性保障', color: '#06b6d4' },
  { icon: <ScissorOutlined />, title: '智能剪辑', desc: '时间轴编排', color: '#10b981' },
  { icon: <ExportOutlined />, title: '导出发布', desc: '720p ~ 4K', color: '#f43f5e' },
];

// AI 模型标签 - 2026年3月最新模型
const aiModels = ['GPT-5.3 Codex', 'o3', 'Claude Sonnet 4.6', 'Gemini 3.1 Pro Preview', 'Gemini 3.1 Flash Lite Preview', 'Qwen-Max-Latest', 'GLM-5', 'Kimi K2.5'];

// 并发限制：避免大量文件操作同时发起
const concurrentMap = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit = 8
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (index < items.length) {
        const i = index++;
        results[i] = await fn(items[i]);
      }
    })()
  );
  await Promise.all(workers);
  return results;
};

const Home = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { settings } = useSettings();
  const [projects, setProjects] = useState<HomeProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const loadProjects = useCallback(async (activeRef?: { current: boolean }) => {
    setProjectsLoading(true);
    try {
      const rawProjects = await listProjects();
      if (activeRef && !activeRef.current) {
        return;
      }
      const filtered = (Array.isArray(rawProjects) ? rawProjects : []).filter(
        (project) => typeof project.id === 'string'
      );
      const enriched = await concurrentMap(filtered, async (project) => {
          const metrics = extractProjectMediaMetrics(project);
          const videoPath = resolveProjectVideoPath(project);
          const exactSizeMb = videoPath ? (await getFileSizeBytes(videoPath)) / 1024 / 1024 : 0;
          const sizeMb = pickPreferredSizeMb(exactSizeMb, metrics.explicitSizeMb, metrics.estimatedSizeMb);
          return {
            id: String(project.id),
            name: typeof project.name === 'string' ? project.name : '未命名项目',
            description: typeof project.description === 'string' ? project.description : '',
            createdAt: typeof project.createdAt === 'string' ? project.createdAt : new Date().toISOString(),
            updatedAt: typeof project.updatedAt === 'string'
              ? project.updatedAt
              : (typeof project.createdAt === 'string' ? project.createdAt : new Date().toISOString()),
            status: project.status === 'completed' || project.status === 'processing' || project.status === 'archived'
              ? project.status
              : 'draft',
            durationSec: metrics.durationSec,
            sizeMb,
          } satisfies HomeProjectItem;
        });
      if (!activeRef || activeRef.current) {
        setProjects(enriched);
      }
    } catch (error) {
      logger.error('加载首页项目列表失败:', { error });
    } finally {
      if (!activeRef || activeRef.current) {
        setProjectsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const activeRef = { current: true };
    void loadProjects(activeRef);
    const handleProjectsChanged = () => {
      void loadProjects(activeRef);
    };
    window.addEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
    return () => {
      activeRef.current = false;
      window.removeEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
    };
  }, [loadProjects]);

  const recentProjects = useMemo(() => {
    const projectMap = new Map(projects.map((project) => [project.id, project]));
    const orderedByRecent = settings.recentProjects
      .map((projectId) => projectMap.get(projectId))
      .filter((project): project is HomeProjectItem => Boolean(project))
      .slice(0, 4);

    if (orderedByRecent.length > 0) {
      return orderedByRecent;
    }

    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [projects, settings.recentProjects]);

  const getRelativeTime = (dateText: string) => {
    const time = new Date(dateText).getTime();
    const now = Date.now();
    const diff = now - time;
    if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / (60 * 1000)))} 分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`;
    return new Date(dateText).toLocaleDateString('zh-CN');
  };

  const statsData = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((project) => project.status === 'completed').length;
    const totalDurationMinutes = projects.reduce((sum, project) => sum + (project.durationSec || 0), 0) / 60;
    const totalSizeGb = projects.reduce((sum, project) => sum + (project.sizeMb || 0), 0) / 1024;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const createdThisMonth = projects.filter((project) => {
      if (!project.createdAt) {
        return false;
      }
      const createdAt = new Date(project.createdAt);
      return createdAt.getFullYear() === currentYear && createdAt.getMonth() === currentMonth;
    }).length;
    return [
      { title: '总项目', value: total, icon: <VideoCameraOutlined />, color: '#6366f1', suffix: '个' },
      { title: '已完成', value: completed, icon: <CheckCircleOutlined />, color: '#10b981', suffix: '个' },
      { title: '本月创作', value: createdThisMonth, icon: <RocketOutlined />, color: '#f59e0b', suffix: '个' },
      { title: '总时长', value: Number(totalDurationMinutes.toFixed(1)), icon: <ClockCircleOutlined />, color: '#06b6d4', suffix: '分钟' },
      { title: '存储容量', value: Number(totalSizeGb.toFixed(2)), icon: <ProjectOutlined />, color: '#8b5cf6', suffix: 'GB' },
    ];
  }, [projects]);

  const recentActivities = useMemo(() => {
    const ordered = [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);

    if (ordered.length === 0) {
      return [{
        color: '#6366f1',
        title: '开始创建你的第一个项目',
        desc: '点击“创建新项目”进入完整 AI 工作流',
        time: '现在',
        processing: false,
      }];
    }

    return ordered.map((project) => {
      const isCompleted = project.status === 'completed';
      const isProcessing = project.status === 'processing';
      return {
        color: isCompleted ? '#10b981' : isProcessing ? '#f59e0b' : '#6366f1',
        title: project.name || '未命名项目',
        desc: isCompleted ? '项目已完成' : isProcessing ? '处理中' : '草稿已更新',
        time: getRelativeTime(project.updatedAt),
        processing: isProcessing,
      };
    });
  }, [projects]);

  const hours = new Date().getHours();
  const greeting = hours < 12 ? '早上好' : hours < 18 ? '下午好' : '晚上好';

  // 背景样式
  const containerStyle: React.CSSProperties = {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 24px',
  };

  // 科技暗黑卡片样式
  const cardStyle: React.CSSProperties = {
    background: isDarkMode ? 'rgba(18, 18, 26, 0.8)' : '#fff',
    border: isDarkMode ? '1px solid #2a2a3a' : '1px solid #e8e8e8',
    borderRadius: 12,
  };

  // Hero 区域渐变背景
  const heroGradient = isDarkMode
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #a855f7 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <div style={containerStyle}>
      {/* 欢迎横幅 - 霓虹发光效果 */}
      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          background: heroGradient,
          borderRadius: 16,
          overflow: 'hidden',
          position: 'relative',
        }}
        styles={{ body: { padding: '40px 36px', position: 'relative', zIndex: 1 } }}
      >
        {/* 科技网格背景装饰 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: isDarkMode
            ? 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
            : 'none',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }} />

        {/* 光晕效果 */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{
              color: '#fff',
              margin: 0,
              fontWeight: 600,
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}>
              {greeting}，欢迎使用 CutDeck
            </Title>
            <Paragraph style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 16,
              margin: '8px 0 20px',
            }}>
              AI 驱动的专业视频内容创作平台
            </Paragraph>
            <Space size={12}>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/project/new')}
                onMouseEnter={() => { void preloadProjectEditPage(); }}
                style={{
                  background: '#fff',
                  color: '#667eea',
                  border: 'none',
                  fontWeight: 600,
                  height: 44,
                  borderRadius: 8,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                }}
              >
                创建新项目
              </Button>
              <Button
                size="large"
                icon={<ProjectOutlined />}
                onClick={() => navigate('/projects')}
                onMouseEnter={() => { void preloadProjectsPage(); }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  height: 44,
                  borderRadius: 8,
                }}
              >
                项目管理
              </Button>
            </Space>
          </Col>
          <Col>
            <div style={{
              fontSize: 80,
              color: 'rgba(255,255,255,0.15)',
              lineHeight: 1,
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))',
            }}>
              <PlayCircleOutlined />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 - 发光边框效果 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsData.map((item, idx) => (
          <Col xs={12} sm={8} lg={4} key={idx}>
            <Card
              bordered={false}
              style={{
                ...cardStyle,
                borderRadius: 12,
                transition: 'all 0.3s ease',
              }}
              styles={{ body: { padding: '20px 24px' } }}
              hoverable
              onMouseEnter={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.borderColor = item.color;
                card.style.boxShadow = `0 0 20px ${item.color}30`;
                card.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.borderColor = isDarkMode ? '#2a2a3a' : '#e8e8e8';
                card.style.boxShadow = 'none';
                card.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: isDarkMode ? `${item.color}20` : `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: item.color,
                  border: `1px solid ${item.color}30`,
                }}>
                  {item.icon}
                </div>
                <div>
                  <Text style={{
                    fontSize: 12,
                    color: isDarkMode ? '#94a3b8' : 'rgba(0,0,0,0.45)',
                  }}>
                    {item.title}
                  </Text>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: isDarkMode ? '#f1f5f9' : 'rgba(0,0,0,0.87)',
                  }}>
                    {item.value}
                    <span style={{
                      fontSize: 13,
                      fontWeight: 400,
                      color: isDarkMode ? '#64748b' : 'rgba(0,0,0,0.45)',
                      marginLeft: 2,
                    }}>
                      {item.suffix}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        bordered={false}
        style={{ ...cardStyle, marginBottom: 24, borderRadius: 12 }}
        title={
          <Space>
            <ClockCircleOutlined style={{ color: '#6366f1' }} />
            <span style={{ fontWeight: 600 }}>最近项目</span>
          </Space>
        }
        extra={
          <Button type="link" onMouseEnter={() => { void preloadProjectsPage(); }} onClick={() => navigate('/projects')}>
            查看全部
          </Button>
        }
      >
        {projectsLoading ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : recentProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Text type="secondary">暂无项目，先创建一个项目开始创作。</Text>
            <div style={{ marginTop: 10 }}>
              <Button type="primary" icon={<PlusOutlined />} onMouseEnter={() => { void preloadProjectEditPage(); }} onClick={() => navigate('/project/new')}>
                创建项目
              </Button>
            </div>
          </div>
        ) : (
          <Row gutter={[12, 12]}>
            {recentProjects.map((project) => (
              <Col xs={24} sm={12} md={12} lg={6} key={project.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 10,
                    border: isDarkMode ? '1px solid #2a2a3a' : '1px solid #f0f0f0',
                  }}
                  styles={{ body: { padding: 14 } }}
                  onClick={() => navigate(`/project/edit/${project.id}`)}
                  onMouseEnter={() => { void preloadProjectEditPage(); }}
                >
                  <Text strong ellipsis style={{ display: 'block' }}>
                    {project.name || '未命名项目'}
                  </Text>
                  <Text type="secondary" ellipsis style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                    {project.description || '无项目描述'}
                  </Text>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color="blue">{project.status === 'completed' ? '已完成' : '草稿'}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {/* 工作流程概览 - 霓虹边框 */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <RocketOutlined style={{ color: '#6366f1' }} />
                <span style={{ fontWeight: 600 }}>创作流程</span>
              </Space>
            }
            bordered={false}
            style={{
              ...cardStyle,
              height: '100%',
              borderRadius: 12,
            }}
          >
            <Row gutter={[12, 16]}>
              {workflowSteps.map((step, idx) => (
                <Col xs={12} sm={8} key={idx}>
                  <div style={{
                    padding: '16px 12px',
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(99, 102, 241, 0.08)' : '#fafafa',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid transparent',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.borderColor = step.color;
                      target.style.transform = 'translateY(-2px)';
                      target.style.boxShadow = `0 4px 20px ${step.color}30`;
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.borderColor = 'transparent';
                      target.style.transform = 'none';
                      target.style.boxShadow = 'none';
                    }}
                  >
                    {/* 悬停时显示渐变背景 */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(135deg, ${step.color}10 0%, transparent 100%)`,
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      pointerEvents: 'none',
                    }} className="step-bg" />

                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: isDarkMode ? `${step.color}20` : `${step.color}15`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: step.color,
                      marginBottom: 8,
                      border: `1px solid ${step.color}30`,
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      {step.icon}
                    </div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: isDarkMode ? '#f1f5f9' : 'rgba(0,0,0,0.87)',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      {step.title}
                    </div>
                    <Text style={{
                      fontSize: 11,
                      color: isDarkMode ? '#64748b' : 'rgba(0,0,0,0.45)',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      {step.desc}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/project/new')}
                onMouseEnter={() => { void preloadProjectEditPage(); }}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: 8,
                  height: 40,
                  fontWeight: 500,
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                }}
              >
                开始创作 <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </Col>

        {/* 最近动态 - 暗色时间线 */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#06b6d4' }} />
                <span style={{ fontWeight: 600 }}>最近动态</span>
              </Space>
            }
            bordered={false}
            style={{
              ...cardStyle,
              height: '100%',
              borderRadius: 12,
            }}
          >
            <Timeline
              items={recentActivities.map((item) => ({
                color: item.color,
                children: (
                  <div style={{ paddingBottom: 8 }}>
                    <Text strong style={{ color: isDarkMode ? '#f1f5f9' : 'rgba(0,0,0,0.87)' }}>
                      {item.title}
                    </Text>
                    <div>
                      <Text style={{
                        fontSize: 12,
                        color: isDarkMode ? '#94a3b8' : 'rgba(0,0,0,0.65)',
                      }}>
                        {item.desc}
                      </Text>
                      {item.processing && (
                        <Tag color="processing" style={{ marginLeft: 8 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <LineChartOutlined spin /> 处理中
                          </span>
                        </Tag>
                      )}
                    </div>
                    <Text style={{
                      fontSize: 11,
                      color: isDarkMode ? '#64748b' : 'rgba(0,0,0,0.45)',
                    }}>
                      {item.time}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* AI 模型支持 - 霓虹标签 */}
      <Card
        bordered={false}
        style={{
          ...cardStyle,
          marginTop: 16,
          borderRadius: 12,
        }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <Text style={{
            color: isDarkMode ? '#94a3b8' : 'rgba(0,0,0,0.65)',
          }}>
            <ThunderboltOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
            支持的 AI 模型
          </Text>
          <Space size={6} wrap>
            {aiModels.map((m) => (
              <Tag
                key={m}
                style={{
                  margin: 0,
                  borderRadius: 4,
                  fontSize: 11,
                  background: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                  border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.2)',
                  color: isDarkMode ? '#a5b4fc' : '#6366f1',
                }}
              >
                {m}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Home;
