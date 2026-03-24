/**
 * KeyframePanel - 关键帧面板
 * 显示选中 clip 的关键帧，支持关键帧编辑
 */
import React, { memo, useCallback, useState, useMemo } from 'react'
import { Table, Button, Input, Select, Space, Popover, Empty } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  HolderOutlined,
} from '@ant-design/icons'
import type { Keyframe, KeyframeEase } from './types'

interface KeyframePanelProps {
  clipId: string
  keyframes: Keyframe[]
  onKeyframeAdd: (clipId: string, keyframe: Omit<Keyframe, 'id'>) => void
  onKeyframeUpdate: (clipId: string, keyframeId: string, updates: Partial<Keyframe>) => void
  onKeyframeDelete: (clipId: string, keyframeId: string) => void
  onClose: () => void
}

// 缓动曲线选项
const EASE_OPTIONS = [
  { value: 'linear', label: '线性 (Linear)' },
  { value: 'easeIn', label: '渐入 (Ease In)' },
  { value: 'easeOut', label: '渐出 (Ease Out)' },
  { value: 'easeInOut', label: '渐入渐出 (Ease In Out)' },
  { value: 'bezier', label: '贝塞尔 (Bezier)' },
]

// 属性类型选项
const PROPERTY_OPTIONS = [
  { value: 'opacity', label: '不透明度' },
  { value: 'position', label: '位置' },
  { value: 'scale', label: '缩放' },
  { value: 'rotation', label: '旋转' },
  { value: 'volume', label: '音量' },
  { value: 'filter', label: '滤镜' },
  { value: 'color', label: '颜色' },
]

const KeyframePanel: React.FC<KeyframePanelProps> = memo(({
  clipId,
  keyframes,
  onKeyframeAdd,
  onKeyframeUpdate,
  onKeyframeDelete,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Keyframe>>({})

  // 排序后的关键帧
  const sortedKeyframes = useMemo(() => {
    return [...keyframes].sort((a, b) => a.time - b.time)
  }, [keyframes])

  // 添加关键帧
  const handleAdd = useCallback(() => {
    const lastTime = sortedKeyframes.length > 0
      ? sortedKeyframes[sortedKeyframes.length - 1].time
      : 0

    onKeyframeAdd(clipId, {
      time: lastTime + 1,
      property: 'opacity',
      value: 100,
      ease: 'linear',
      label: '',
    })
  }, [clipId, sortedKeyframes, onKeyframeAdd])

  // 开始编辑
  const handleEdit = useCallback((keyframe: Keyframe) => {
    setEditingId(keyframe.id)
    setEditForm({ ...keyframe })
  }, [])

  // 保存编辑
  const handleSave = useCallback(() => {
    if (editingId && editForm) {
      onKeyframeUpdate(clipId, editingId, editForm)
      setEditingId(null)
      setEditForm({})
    }
  }, [clipId, editingId, editForm, onKeyframeUpdate])

  // 取消编辑
  const handleCancel = useCallback(() => {
    setEditingId(null)
    setEditForm({})
  }, [])

  // 删除关键帧
  const handleDelete = useCallback((keyframeId: string) => {
    onKeyframeDelete(clipId, keyframeId)
  }, [clipId, onKeyframeDelete])

  // 表格列定义
  const columns = [
    {
      title: '',
      key: 'drag',
      width: 32,
      render: () => <HolderOutlined style={{ cursor: 'grab', color: 'var(--text-tertiary)' }} />,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      render: (time: number, record: Keyframe) => {
        if (editingId === record.id) {
          return (
            <Input
              type="number"
              value={editForm.time ?? time}
              onChange={(e) => setEditForm(f => ({ ...f, time: parseFloat(e.target.value) }))}
              size="small"
              min={0}
              step={0.1}
            />
          )
        }
        return `${time.toFixed(2)}s`
      },
    },
    {
      title: '属性',
      dataIndex: 'property',
      key: 'property',
      width: 120,
      render: (property: string, record: Keyframe) => {
        if (editingId === record.id) {
          return (
            <Select
              value={editForm.property ?? property}
              onChange={(v) => setEditForm(f => ({ ...f, property: v }))}
              options={PROPERTY_OPTIONS}
              size="small"
              style={{ width: '100%' }}
            />
          )
        }
        return PROPERTY_OPTIONS.find(o => o.value === property)?.label || property
      },
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (value: number, record: Keyframe) => {
        if (editingId === record.id) {
          return (
            <Input
              type="number"
              value={editForm.value ?? value}
              onChange={(e) => setEditForm(f => ({ ...f, value: parseFloat(e.target.value) }))}
              size="small"
              step={1}
            />
          )
        }
        return `${value}%`
      },
    },
    {
      title: '缓动',
      dataIndex: 'ease',
      key: 'ease',
      width: 140,
      render: (ease: KeyframeEase, record: Keyframe) => {
        if (editingId === record.id) {
          return (
            <Select
              value={editForm.ease ?? ease}
              onChange={(v) => setEditForm(f => ({ ...f, ease: v }))}
              options={EASE_OPTIONS}
              size="small"
              style={{ width: '100%' }}
            />
          )
        }
        return EASE_OPTIONS.find(o => o.value === ease)?.label || ease
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Keyframe) => {
        if (editingId === record.id) {
          return (
            <Space size={4}>
              <Button
                type="text"
                icon={<SaveOutlined />}
                onClick={handleSave}
                size="small"
                style={{ color: 'var(--success-color)' }}
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleCancel}
                size="small"
              />
            </Space>
          )
        }
        return (
          <Space size={4}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              size="small"
              danger
            />
          </Space>
        )
      },
    },
  ]

  return (
    <div
      className="keyframe-panel"
      style={{
        width: 400,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 500 }}>关键帧</span>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="small"
          >
            添加
          </Button>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            size="small"
          />
        </Space>
      </div>

      {/* 关键帧列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {sortedKeyframes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无关键帧"
            style={{ margin: '40px 0' }}
          />
        ) : (
          <Table
            dataSource={sortedKeyframes}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 300 }}
            style={{ background: 'var(--bg-primary)' }}
          />
        )}
      </div>

      {/* 底部信息 */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-color)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
        }}
      >
        共 {sortedKeyframes.length} 个关键帧
      </div>
    </div>
  )
})

KeyframePanel.displayName = 'KeyframePanel'

export default KeyframePanel

export type { KeyframePanelProps }
