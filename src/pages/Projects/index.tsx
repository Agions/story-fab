import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { ProjectsToolbar } from './components/ProjectsToolbar';
import { StatusFilterBar } from './components/StatusFilterBar';
import { ProjectCard } from './components/ProjectCard';
import { useProjectList, statusConfig, getProjectUIStatus, formatDate } from '../../hooks/useProjectList';
import { preloadProjectEditPage, preloadVideoEditorPage } from '../../core/utils/route-preload';
import type { ProjectView } from './types';
import React from 'react';
import { Edit3, Trash2, Play, Download } from 'lucide-react';

const loadProjectsListView = () => import('./components/ProjectsListView');
const ProjectsListView = React.lazy(loadProjectsListView);

const ProjectManager: React.FC = () => {
  const navigate = useNavigate();
  const { settings, addRecentProject } = useSettings();
  
  const {
    viewMode,
    searchText,
    statusFilter,
    loading,
    deleteConfirmId,
    filteredProjects,
    statusFilters,
    setViewMode,
    setSearchText,
    setStatusFilter,
    setDeleteConfirmId,
    confirmDelete,
  } = useProjectList({ recentProjects: settings.recentProjects });

  const projectActions = (project: ProjectView): Array<{
    key: string;
    label?: string;
    icon?: React.ReactNode;
    danger?: boolean;
    onClick?: () => void;
    type?: 'divider';
  }> => [
    { key: 'edit', label: '编辑项目', icon: <Edit3 size={14} />, onClick: () => navigate(`/project/edit/${project.id}`) },
    { key: 'editor', label: '进入工作台', icon: <Play size={14} />, onClick: () => navigate(`/editor/${project.id}`) },
    { key: 'export', label: '导出', icon: <Download size={14} /> },
    { key: 'divider', type: 'divider' as const },
    { key: 'delete', label: '删除', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleteConfirmId(project.id) },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 工具栏 */}
      <Suspense fallback={null}>
        <ProjectsToolbar
          searchText={searchText}
          statusFilter={statusFilter}
          viewMode={viewMode}
          onSearchChange={setSearchText}
          onStatusFilterChange={setStatusFilter}
          onViewModeChange={setViewMode}
          onNewProject={() => navigate('/project/new')}
        />
      </Suspense>

      {/* 项目统计 */}
      <Suspense fallback={null}>
        <StatusFilterBar
          statusFilters={statusFilters}
          currentFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </Suspense>

      {/* 内容区 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* 创建项目卡片 */}
          <div
            className="rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            style={{ height: 220 }}
            onClick={() => navigate('/project/new')}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/10 flex items-center justify-center text-primary mb-3">
              <Plus size={22} />
            </div>
            <span className="text-primary font-medium">创建新项目</span>
          </div>

          {filteredProjects.map(project => {
            const uiStatus = getProjectUIStatus(project);
            return (
              <ProjectCard
                key={project.id}
                project={project}
                uiStatus={uiStatus}
                statusConfig={statusConfig}
                formatDate={formatDate}
                onOpen={() => {
                  addRecentProject(project.id);
                  navigate(`/project/${project.id}`);
                }}
                onDelete={() => setDeleteConfirmId(project.id)}
                onPreload={() => { void preloadProjectEditPage(); void preloadVideoEditorPage(); }}
                projectActions={projectActions}
              />
            );
          })}

          {filteredProjects.length === 0 && !loading && (
            <div className="col-span-24 text-center py-16 text-muted-foreground">
              暂无匹配的项目
            </div>
          )}
        </div>
      ) : (
        <Suspense fallback={<div className="text-center py-8"><Skeleton className="w-48 h-8 mx-auto" /></div>}>
          <ProjectsListView
            projects={filteredProjects}
            loading={loading}
            statusConfig={statusConfig}
            getProjectUIStatus={getProjectUIStatus}
            formatDate={formatDate}
            onOpenProject={(projectId) => {
              addRecentProject(projectId);
              navigate(`/project/${projectId}`);
            }}
            onOpenEditor={(projectId) => {
              addRecentProject(projectId);
              navigate(`/editor/${projectId}`);
            }}
            onPreloadProject={() => { void preloadProjectEditPage(); }}
            onPreloadEditor={() => { void preloadVideoEditorPage(); }}
            projectActions={projectActions}
          />
        </Suspense>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <AlertDialog open onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>删除后无法恢复，确定要删除此项目吗？</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => confirmDelete(deleteConfirmId)}
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ProjectManager;