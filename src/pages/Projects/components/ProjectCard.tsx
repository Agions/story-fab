import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { MoreHorizontal, Video, FolderOpen } from 'lucide-react';
import type { ProjectView, ProjectUIStatus } from '../types';

type ProjectUIStats = {
  scriptCount: number;
  videoCount: number;
  status: ProjectUIStatus;
  progress: number;
};

interface ProjectCardProps {
  project: ProjectView;
  uiStatus: ProjectUIStats;
  statusConfig: Record<ProjectUIStatus, { color: string; text: string }>;
  formatDate: (d: string) => string;
  onOpen: () => void;
  onDelete: () => void;
  onPreload: () => void;
  projectActions: (project: ProjectView) => Array<{
    key: string;
    label?: string;
    icon?: React.ReactNode;
    danger?: boolean;
    onClick?: () => void;
    type?: 'divider';
  }>;
}

export const ProjectCard = React.memo<ProjectCardProps>(({
  project, uiStatus, statusConfig, formatDate,
  onOpen, onDelete, onPreload, projectActions,
}) => (
  <Card
    className="cursor-pointer overflow-hidden"
    style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}
    onClick={onOpen}
  >
    <div className="flex justify-between items-start mb-3">
      <Badge variant={uiStatus.status === 'completed' ? 'default' : uiStatus.status === 'processing' ? 'default' : 'secondary'}>
        {statusConfig[uiStatus.status]?.text || '草稿'}
      </Badge>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={onPreload}
          >
            <MoreHorizontal size={16} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>操作</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1">
            {projectActions(project).filter((a) => a.key !== 'divider').map((action) => (
              <Button
                key={action.key}
                variant="ghost"
                className={`justify-start ${action.danger ? 'text-destructive' : ''}`}
                onClick={() => {
                  if (action.onClick) action.onClick();
                }}
              >
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <h5 className="font-medium truncate mb-1">{project.name}</h5>
    <p className="text-xs text-muted-foreground truncate mb-3">{project.description || '无项目描述'}</p>

    <Progress value={uiStatus.progress} className="mb-3" />

    <div className="mt-auto flex justify-between items-center">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1">
              <Video size={12} /> {uiStatus.videoCount}
            </TooltipTrigger>
            <TooltipContent>视频数</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1">
              <FolderOpen size={12} /> {uiStatus.scriptCount}
            </TooltipTrigger>
            <TooltipContent>脚本数</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span className="text-xs text-muted-foreground">{formatDate(project.updatedAt)}</span>
    </div>
  </Card>
));

ProjectCard.displayName = 'ProjectCard';
