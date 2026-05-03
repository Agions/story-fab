import React from 'react';
import { Badge } from '@/components/ui/badge';

type ProjectUIStatus = 'draft' | 'processing' | 'completed';

interface StatusFilter {
  label: string;
  value: number;
  color: string;
  filter: ProjectUIStatus | 'all';
}

interface StatusFilterBarProps {
  statusFilters: StatusFilter[];
  currentFilter: ProjectUIStatus | 'all';
  onFilterChange: (filter: ProjectUIStatus | 'all') => void;
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
