import React, { memo } from 'react';
import { List, Space, Button, Tooltip, Typography, Tag } from 'antd';
import { EditOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatDuration } from '@/core/video';
import type { ScriptSegment } from '@/core/types';
import { getTypeLabel } from './types';
import styles from './ScriptEditor.module.less';

const { Text } = Typography;

interface SegmentTableProps {
  segments: ScriptSegment[];
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
  return (
    <List
      className={styles.segmentsTable}
      dataSource={segments}
      locale={{ emptyText: '暂无片段，请先添加' }}
      renderItem={(record: ScriptSegment, index: number) => (
        <List.Item
          key={`${record.startTime}-${record.endTime}-${index}`}
          actions={[
            <Tooltip key="edit" title="编辑">
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(index)} />
            </Tooltip>,
            <Tooltip key="preview" title="预览">
              <Button type="text" icon={<PlayCircleOutlined />} onClick={() => onPreview(index)} />
            </Tooltip>,
            <Tooltip key="delete" title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(index)} />
            </Tooltip>,
          ]}
        >
          <List.Item.Meta
            title={
              <Space size={10} wrap>
          <Tag>{getTypeLabel(record.type || '')}</Tag>
                <Text>{formatDuration(record.startTime)} - {formatDuration(record.endTime)}</Text>
                <Text type="secondary">时长 {formatDuration(record.endTime - record.startTime)}</Text>
              </Space>
            }
            description={
              <div className={styles.contentCell}>
                {record.content || <span className={styles.emptyContent}>（无内容）</span>}
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
};

export default memo(SegmentTable);
