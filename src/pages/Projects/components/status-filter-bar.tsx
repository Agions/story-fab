import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ProjectStatusFilter } from '@/types/project';

interface StatusFilter {
  label: string;
  value: number;
  color: string;
  filter: ProjectStatusFilter;
}

interface StatusFilterBarProps {
  statusFilters: StatusFilter[];
  currentFilter: ProjectStatusFilter;
  onFilterChange: (filter: ProjectStatusFilter) => void;
}

export const StatusFilterBar = React.memo<StatusFilterBarProps>(({
  statusFilters, currentFilter, onFilterChange,
}) => (
  <div className="flex flex-wrap gap-2 mb-4">
    {statusFilters.map((item, idx) => (
      <Badge
        key={idx}
        variant={currentFilter === item.filter ? 'default' : 'outline'}
        className="cursor-pointer px-3 py-1.5 text-sm"
        style={{
          background: currentFilter === item.filter ? `${item.color}15` : undefined,
          borderColor: currentFilter === item.filter ? item.color : undefined,
          color: currentFilter === item.filter ? item.color : undefined,
        }}
        onClick={() => onFilterChange(item.filter)}
      >
        {item.label} <strong>{item.value}</strong>
      </Badge>
    ))}
  </div>
));

StatusFilterBar.displayName = 'StatusFilterBar';
