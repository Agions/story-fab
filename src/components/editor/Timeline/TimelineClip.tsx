/**
 * TimelineClip - 片段组件
 * 渲染单个 clip，支持拖拽和调整大小
 */
import React, { memo, useCallback, useState, useRef, useEffect } from 'react'
import type { TimelineClip as TimelineClipType, TimelineScale } from './types'

interface TimelineClipProps {
  clip: TimelineClipType
  scale: TimelineScale
  isSelected: boolean
  isLocked: boolean
  onSelect: (clipId: string, e: React.MouseEvent) => void
  onUpdate: (clipId: string, updates: Partial<TimelineClipType>) => void
}

// Clip 类型对应的颜色
const CLIP_TYPE_COLORS: Record<string, string> = {
  video: '#3b82f6',
  audio: '#22c55e',
  subtitle: '#f59e0b',
  transition: '#8b5cf6',
  effect: '#ec4899',
}

// 拖拽状态
type DragState = 'none' | 'move' | 'resize-left' | 'resize-right'

const TimelineClip: React.FC<TimelineClipProps> = memo(({
  clip,
  scale,
  isSelected,
  isLocked,
  onSelect,
  onUpdate,
}) => {
  const [dragState, setDragState] = useState<DragState>('none')
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)
  const clipRef = useRef<HTMLDivElement>(null)

  // 计算 clip 位置和宽度
  const left = clip.startTime * scale.pixelsPerSecond
  const width = (clip.endTime - clip.startTime) * scale.pixelsPerSecond
  const color = CLIP_TYPE_COLORS[clip.type] || CLIP_TYPE_COLORS.video

  // 处理选中
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLocked) {
      onSelect(clip.id, e)
    }
  }, [clip.id, isLocked, onSelect])

  // 开始拖拽移动
  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    if (isLocked || !isSelected) return
    e.preventDefault()
    e.stopPropagation()
    setDragState('move')
    setDragStartX(e.clientX)
    setDragStartTime(clip.startTime)
  }, [isLocked, isSelected, clip.startTime])

  // 开始调整左侧
  const handleResizeLeftStart = useCallback((e: React.MouseEvent) => {
    if (isLocked) return
    e.preventDefault()
    e.stopPropagation()
    setDragState('resize-left')
    setDragStartX(e.clientX)
    setDragStartTime(clip.startTime)
  }, [isLocked, clip.startTime])

  // 开始调整右侧
  const handleResizeRightStart = useCallback((e: React.MouseEvent) => {
    if (isLocked) return
    e.preventDefault()
    e.stopPropagation()
    setDragState('resize-right')
    setDragStartX(e.clientX)
    setDragStartTime(clip.endTime)
  }, [isLocked, clip.endTime])

  // 拖拽处理
  useEffect(() => {
    if (dragState === 'none') return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX
      const deltaTime = deltaX / scale.pixelsPerSecond

      if (dragState === 'move') {
        const newStartTime = Math.max(0, dragStartTime + deltaTime)
        const duration = clip.endTime - clip.startTime
        onUpdate(clip.id, {
          startTime: newStartTime,
          endTime: newStartTime + duration,
        })
      } else if (dragState === 'resize-left') {
        const newStartTime = Math.max(0, Math.min(dragStartTime + deltaTime, clip.endTime - 0.1))
        onUpdate(clip.id, { startTime: newStartTime })
      } else if (dragState === 'resize-right') {
        const newEndTime = Math.max(clip.startTime + 0.1, dragStartTime + deltaTime)
        onUpdate(clip.id, { endTime: newEndTime })
      }
    }

    const handleMouseUp = () => {
      setDragState('none')
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, dragStartX, dragStartTime, scale.pixelsPerSecond, clip, onUpdate])

  // 双击编辑
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: 打开 clip 编辑器
  }, [])

  return (
    <div
      ref={clipRef}
      className={`timeline-clip timeline-clip-${clip.type}`}
      data-clip-id={clip.id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left,
        top: 4,
        width: Math.max(width, 20), // 最小宽度 20px
        height: 'calc(100% - 8px)',
        background: isSelected 
          ? `linear-gradient(135deg, ${color}dd 0%, ${color}99 100%)`
          : `linear-gradient(135deg, ${color}cc 0%, ${color}88 100%)`,
        borderRadius: 4,
        border: isSelected 
          ? '2px solid var(--primary-color)' 
          : '1px solid var(--border-color)',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
        transition: dragState !== 'none' ? 'none' : 'box-shadow 0.15s ease',
        boxShadow: isSelected 
          ? '0 0 0 2px var(--primary-color), 0 2px 8px rgba(0,0,0,0.15)' 
          : '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: isSelected ? 10 : 1,
      }}
    >
      {/* 左侧调整手柄 */}
      <div
        className="resize-handle resize-handle-left"
        onMouseDown={handleResizeLeftStart}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: isLocked ? 'not-allowed' : 'ew-resize',
          background: isSelected 
            ? 'rgba(255,255,255,0.3)' 
            : 'transparent',
          borderRadius: '4px 0 0 4px',
        }}
      />

      {/* Clip 内容 */}
      <div
        style={{
          padding: '4px 12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* 缩略图预览 */}
        {clip.thumbnail && (
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 32,
              height: 32,
              borderRadius: 4,
              background: `url(${clip.thumbnail}) center/cover`,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          />
        )}

        {/* 标题 */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingLeft: clip.thumbnail ? 40 : 0,
          }}
        >
          {clip.name || 'Untitled'}
        </div>

        {/* 时长 */}
        <div
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.7)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {clip.endTime - clip.startTime < 60
            ? `${(clip.endTime - clip.startTime).toFixed(1)}s`
            : `${Math.floor((clip.endTime - clip.startTime) / 60)}:${((clip.endTime - clip.startTime) % 60).toFixed(0).padStart(2, '0')}`
          }
        </div>
      </div>

      {/* 右侧调整手柄 */}
      <div
        className="resize-handle resize-handle-right"
        onMouseDown={handleResizeRightStart}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: isLocked ? 'not-allowed' : 'ew-resize',
          background: isSelected 
            ? 'rgba(255,255,255,0.3)' 
            : 'transparent',
          borderRadius: '0 4px 4px 0',
        }}
      />

      {/* 移动手柄 */}
      <div
        className="move-handle"
        onMouseDown={handleMoveStart}
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          top: 0,
          height: 8,
          cursor: isLocked || !isSelected ? 'pointer' : 'move',
          background: isSelected 
            ? 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)'
            : 'transparent',
          borderRadius: '4px 4px 0 0',
        }}
      />

      {/* 选中状态指示器 */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'var(--primary-color)',
          }}
        />
      )}
    </div>
  )
})

TimelineClip.displayName = 'TimelineClip'

export default TimelineClip

export type { TimelineClipProps }
