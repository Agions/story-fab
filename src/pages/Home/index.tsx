import { logger } from '@/shared/utils/logging';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { withErrorBoundary } from '@/components/common/error-boundary';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Row, Col } from '../../components/ui/grid';
import { Badge } from '../../components/ui/badge';
import {
  Video, Plus, Play, Rocket, Zap, FileText, Clock, CheckCircle, ArrowRight,
  FlaskConical, Scissors, Download, Folder, Loader2, Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { getFileSizeBytes } from '@/core/services/file/file-info-service';
import { listProjects, PROJECTS_CHANGED_EVENT } from '@/core/services/project/project-file-service';
import { preloadProjectEditPage, preloadProjectsPage } from '../../core/utils/route-preload';
import {
  extractProjectMediaMetrics,
  pickPreferredSizeMb,
  resolveProjectVideoPath,
} from '@/shared';
import styles from '@/pages/Home/index.module.less';
import { concurrentMap } from '@/shared/utils';

/* ─── Constants ─────────────────────────────────────────────────── */

const AMBER = '#c8956c';

const statIconClassMap: Record<string, string> = {
  '#c8956c': styles.statIconAmber,
  '#5a9e6f': styles.statIconSuccess,
  '#c49660': styles.statIconWarning,
  '#5a9e9e': styles.statIconCyan,
  '#6b8cce': styles.statIconBlue,
};

const activityDotClassMap: Record<string, string> = {
  '#c8956c': styles.activityDotAmber,
  '#5a9e6f': styles.activityDotSuccess,
  '#c49660': styles.activityDotWarning,
  '#5a9e9e': styles.activityDotCyan,
  '#6b8cce': styles.activityDotBlue,
};

const workflowIconClassMap: Record<string, string> = {
  '#c8956c': styles.workflowIconAmber,
  '#d4a574': styles.workflowIconGold,
  '#b8856a': styles.workflowIconWarm,
  '#5a9e9e': styles.workflowIconCyan,
  '#5a9e6f': styles.workflowIconSuccess,
  '#6b8cce': styles.workflowIconBlue,
};

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

const workflowSteps = [
  { icon: <Video size={18} />, title: '导入素材', desc: 'MP4 / MOV / WebM', color: AMBER },
  { icon: <Zap size={18} />, title: '智能分析', desc: '场景 · 关键帧 · 音频', color: '#c49660' },
  { icon: <FileText size={18} />, title: '脚本生成', desc: '10+ AI 模型', color: '#d4a574' },
  { icon: <FlaskConical size={18} />, title: '去重优化', desc: '原创性保障', color: '#5a9e9e' },
  { icon: <Scissors size={18} />, title: '智能剪辑', desc: '时间轴编排', color: '#5a9e6f' },
  { icon: <Download size={18} />, title: '导出发布', desc: '720p → 4K', color: '#6b8cce' },
];

const aiModels = [
  'GPT-5.3 Codex', 'o3', 'Claude Sonnet 4.6', 'Gemini 3.1 Pro',
  'Gemini 3.1 Flash', 'Qwen-Max', 'GLM-5', 'Kimi K2.5',
];

/* ─── Component ─────────────────────────────────────────────────── */

const Home = () => {
  const navigate = useNavigate();
  const { userSettings: settings } = useAppStore();
  const [projects, setProjects] = useState<HomeProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const loadProjects = useCallback(async (activeRef?: { current: boolean }) => {
    setProjectsLoading(true);
    try {
      const rawProjects = await listProjects();
      if (activeRef && !activeRef.current) return;
      const filtered = (Array.isArray(rawProjects) ? rawProjects : [])
        .filter((p) => typeof p.id === 'string');
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
          updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : (typeof project.createdAt === 'string' ? project.createdAt : new Date().toISOString()),
          status: project.status === 'completed' || project.status === 'processing' || project.status === 'archived' ? project.status : 'draft',
          durationSec: metrics.durationSec,
          sizeMb,
        } satisfies HomeProjectItem;
      });
      if (!activeRef || activeRef.current) setProjects(enriched);
    } catch (error) {
      logger.error('加载首页项目列表失败:', { error });
    } finally {
      if (!activeRef || activeRef.current) setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeRef = { current: true };
    void loadProjects(activeRef);
    const handleProjectsChanged = () => { void loadProjects(activeRef); };
    window.addEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
    return () => {
      activeRef.current = false;
      window.removeEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
    };
  }, [loadProjects]);

  /* ─── Derived data ──────────────────────────────────────────── */

  const recentProjects = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const ordered = settings.recentProjects
      .map((id) => projectMap.get(id))
      .filter((p): p is HomeProjectItem => Boolean(p))
      .slice(0, 4);
    if (ordered.length > 0) return ordered;
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [projects, settings.recentProjects]);

  const getRelativeTime = (dateText: string) => {
    const diff = Date.now() - new Date(dateText).getTime();
    if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / 60000))} 分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)} 天前`;
    return new Date(dateText).toLocaleDateString('zh-CN');
  };

  const statsData = useMemo(() => [
    {
      title: '总项目',
      value: projects.length,
      icon: <Video size={16} />,
      color: AMBER,
      bg: 'rgba(200, 149, 108, 0.1)',
      suffix: '个',
    },
    {
      title: '已完成',
      value: projects.filter((p) => p.status === 'completed').length,
      icon: <CheckCircle size={16} />,
      color: '#5a9e6f',
      bg: 'rgba(90, 158, 111, 0.1)',
      suffix: '个',
    },
    {
      title: '本月创作',
      value: (() => {
        const now = new Date();
        return projects.filter((p) => {
          if (!p.createdAt) return false;
          const d = new Date(p.createdAt);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;
      })(),
      icon: <Rocket size={16} />,
      color: '#c49660',
      bg: 'rgba(196, 150, 96, 0.1)',
      suffix: '个',
    },
    {
      title: '总时长',
      value: Number((projects.reduce((s, p) => s + (p.durationSec || 0), 0) / 60).toFixed(1)),
      icon: <Clock size={16} />,
      color: '#5a9e9e',
      bg: 'rgba(90, 158, 158, 0.1)',
      suffix: '分钟',
    },
    {
      title: '存储容量',
      value: Number((projects.reduce((s, p) => s + (p.sizeMb || 0), 0) / 1024).toFixed(2)),
      icon: <Folder size={16} />,
      color: '#6b8cce',
      bg: 'rgba(107, 140, 206, 0.1)',
      suffix: 'GB',
    },
  ], [projects]);

  const recentActivities = useMemo(() => {
    const ordered = [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
    if (ordered.length === 0) {
      return [{
        color: AMBER,
        title: '开始创建你的第一个项目',
        desc: '点击「新建项目」进入完整 AI 工作流',
        time: '现在',
        processing: false,
      }];
    }
    return ordered.map((project) => {
      const isCompleted = project.status === 'completed';
      const isProcessing = project.status === 'processing';
      return {
        color: isCompleted ? '#5a9e6f' : isProcessing ? '#c49660' : AMBER,
        title: project.name || '未命名项目',
        desc: isCompleted ? '项目已完成' : isProcessing ? '处理中' : '草稿已更新',
        time: getRelativeTime(project.updatedAt),
        processing: isProcessing,
      };
    });
  }, [projects]);

  /* ─── Greeting ──────────────────────────────────────────────── */

  const hours = new Date().getHours();
  const greeting = hours < 12 ? '早上好' : hours < 18 ? '下午好' : '晚上好';

  /* ─── Render ────────────────────────────────────────────────── */

  return (
    <div className={styles.container}>
      {/* ═══ Hero ═══ */}
      <Card className={styles.heroBanner}>
        <Row align="center" justify="between">
          <Col>
            <h2 className={styles.heroTitle}>{greeting}，欢迎回来</h2>
            <p className={styles.heroParagraph}>
              AI 驱动的影视解说创作平台 · 本地处理 · 隐私优先
            </p>
            <div className="flex gap-3">
              <Button
                size="lg"
                className="bg-white/20 border-0 hover:bg-white/30 text-white font-semibold"
                onClick={() => navigate('/project/new')}
                onMouseEnter={() => { void preloadProjectEditPage(); }}
              >
                <Plus size={16} className="mr-1.5" />
                新建项目
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10 font-medium"
                onClick={() => navigate('/projects')}
                onMouseEnter={() => { void preloadProjectsPage(); }}
              >
                <Folder size={16} className="mr-1.5" />
                项目管理
              </Button>
            </div>
          </Col>
          <Col>
            <div className={styles.heroIcon}>
              <Play size={36} />
            </div>
          </Col>
        </Row>
      </Card>

      {/* ═══ Stats ═══ */}
      <Row gutter={[12, 12]} className={styles.statsRow}>
        {statsData.map((item, idx) => (
          <Col key={idx} className={styles.flexGrow}>
              <Card className={styles.statsCard}>
               <div className="flex items-center gap-3">
                 <div
                   className={`${styles.statIcon} ${statIconClassMap[item.color] || ''}`}
                 >
                   {item.icon}
                 </div>
                <div>
                  <div className={styles.statLabel}>{item.title}</div>
                  <div className={styles.statValue}>
                    {item.value}
                    <span className={styles.statSuffix}>{item.suffix}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ═══ Recent Projects ═══ */}
      <Card className={styles.recentProjectsCard}>
        {projectsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className={`animate-spin ${styles.textTertiary}`} />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className={`${styles.textTertiary} ${styles.mb3}`}>
              暂无项目，开始你的第一次创作
            </p>
            <Button
              onClick={() => navigate('/project/new')}
              className="font-medium"
            >
              <Plus size={14} className="mr-1" />
              创建项目
            </Button>
          </div>
        ) : (
          <Row gutter={[12, 12]}>
            {recentProjects.map((project) => (
              <Col span={6} key={project.id}>
                <Card
                  className={styles.projectCard}
                  onClick={() => navigate(`/project/edit/${project.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/project/edit/${project.id}`); } }}
                  onMouseEnter={() => { void preloadProjectEditPage(); }}
                  role="button"
                  tabIndex={0}
                  aria-label={`打开项目 ${project.name || '未命名项目'}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className={`${styles.projectCardTitle} truncate`}>
                        {project.name || '未命名项目'}
                      </span>
                      <Badge
                        variant={project.status === 'completed' ? 'default' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {project.status === 'completed' ? '已完成' : '草稿'}
                      </Badge>
                    </div>
                     <p className={`text-xs truncate ${styles.textTertiary}`}>
                       {project.description || '无项目描述'}
                     </p>
                     <span className={`text-[10px] ${styles.textDisabled}`}>
                       {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                     </span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* ═══ Workflow + Activity ═══ */}
      <Row gutter={[12, 12]}>
        {/* Workflow Pipeline */}
        <Col span={12}>
          <Card className={styles.workflowCard}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className={styles.textTertiary} />
              <span className={`${styles.textTertiary} ${styles.textXs} ${styles.fontSemibold} ${styles.trackingWider} ${styles.uppercase}`}>
                创作流程
              </span>
            </div>
            <Row gutter={[8, 12]}>
              {workflowSteps.map((step, idx) => (
                <Col span={6} key={idx}>
                  <div className={styles.workflowItem}>
                    <div
                      className={`${styles.workflowIcon} ${workflowIconClassMap[step.color] || ''}`}
                    >
                      {step.icon}
                    </div>
                    <div className={styles.workflowStepTitle}>{step.title}</div>
                    <div className={styles.workflowStepDesc}>{step.desc}</div>
                  </div>
                </Col>
              ))}
            </Row>
            <div className="mt-5 flex justify-center">
              <Button
                className="font-semibold"
                onClick={() => navigate('/project/new')}
              >
                开始创作
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col span={12}>
          <Card className={styles.activitiesCard}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className={styles.textTertiary} />
              <span className={`${styles.textTertiary} ${styles.textXs} ${styles.fontSemibold} ${styles.trackingWider} ${styles.uppercase}`}>
                最近动态
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {recentActivities.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className={`${styles.activityDot} ${activityDotClassMap[item.color] || ''}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={styles.activityTitle}>{item.title}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={styles.activityDesc}>{item.desc}</span>
                      {item.processing && (
                        <span className={styles.processingTag}>
                          <Loader2 size={10} className="animate-spin" />
                          处理中
                        </span>
                      )}
                    </div>
                    <div className={styles.activityTime}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ═══ AI Models ═══ */}
      <Card className={styles.aiModelsCard}>
            <div className="flex items-center gap-2 mb-3">
              <Rocket size={13} className={styles.textTertiary} />
              <span className={`${styles.textTertiary} ${styles.textXs} ${styles.fontMedium}`}>
                支持的 AI 模型
              </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {aiModels.map((m) => (
            <span key={m} className={styles.aiModelTag}>
              {m}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default withErrorBoundary(Home, { name: 'Home' });
