import React, { memo } from 'react';
import { List, Space, Button, Tooltip, Typography, Tag } from 'antd';
import { EditOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { VideoSegment, formatDuration } from '@/services/video';
import { getTypeLabel } from './types';
import styles from './ScriptEditor.module.less';

const { Text } = Typography;

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
  return (
    <List
      className={styles.segmentsTable}
      dataSource={segments}
      locale={{ emptyText: '暂无片段，请先添加' }}
      renderItem={(record: VideoSegment, index: number) => (
        <List.Item
          key={`${record.start}-${record.end}-${index}`}
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
                <Tag>{getTypeLabel((record as any).type || '')}</Tag>
                <Text>{formatDuration((record as any).start)} - {formatDuration((record as any).end)}</Text>
                <Text type="secondary">时长 {formatDuration((record as any).end - (record as any).start)}</Text>
              </Space>
            }
            description={
              <div className={styles.contentCell}>
                {(record as any).content || <span className={styles.emptyContent}>（无内容）</span>}
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
};

export default memo(SegmentTable);
