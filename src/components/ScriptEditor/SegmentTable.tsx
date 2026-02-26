import React, { useMemo, useCallback, memo } from 'react';
import { Table, Space, Button, Tooltip } from 'antd';
import { EditOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { VideoSegment, formatDuration } from '@/services/videoService';
import { getTypeLabel } from './types';
import styles from './ScriptEditor.module.less';

interface SegmentTableProps {
  segments: VideoSegment[];
  onEdit: (index: number) => void;
  onPreview: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}

const SegmentTable: React.FC<SegmentTableProps> = ({
  segments,
  onEdit,
  onPreview,
  onDelete,
  onAdd,
}) => {
  const columns = useMemo(() => [
    {
      title: '时间',
      key: 'time',
      width: 180,
      render: (_: any, record: VideoSegment) => (
        <span>
          {formatDuration(record.start)} - {formatDuration(record.end)}
        </span>
      ),
    },
    {
      title: '时长',
      key: 'duration',
      width: 80,
      render: (_: any, record: VideoSegment) => (
        <span>{formatDuration(record.end - record.start)}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <span>{getTypeLabel(type)}</span>,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <div className={styles.contentCell}>
          {content || <span className={styles.emptyContent}>（无内容）</span>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: VideoSegment, index: number) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(index)}
            />
          </Tooltip>
          <Tooltip title="预览">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={() => onPreview(index)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(index)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [onEdit, onPreview, onDelete]);

  return (
    <Table
      rowKey={(_, index) => String(index)}
      dataSource={segments}
      columns={columns}
      pagination={false}
      className={styles.segmentsTable}
    />
  );
};

export default memo(SegmentTable);
