/**
 * TimelinePlayhead - 播放头组件
 * 显示当前播放位置，支持拖拽跳转
 */
import React, { memo, useCallback, useState, useRef, useEffect } from 'react'
import type { TimelineScale } from './types'

interface TimelinePlayheadProps {
  currentTime: number
  scale: TimelineScale
  scrollLeft: number
  containerHeight: number
  onSeek: (time: number) => void
}

const TimelinePlayhead: React.FC<TimelinePlayheadProps> = memo(({
  currentTime,
  scale,
  scrollLeft,
  containerHeight,
  onSeek,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const playheadRef = useRef<HTMLDivElement>(null)

  // 计算播放头位置
  const position = currentTime * scale.pixelsPerSecond - scrollLeft

  // 拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  // 拖拽处理
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      // 计算新的播放位置
      const container = playheadRef.current?.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left + scrollLeft
      const newTime = x / scale.pixelsPerSecond
      onSeek(Math.max(0, newTime))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, scale.pixelsPerSecond, scrollLeft, onSeek])

  // 点击跳转到位置
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const container = playheadRef.current?.parentElement
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left + scrollLeft
    const newTime = x / scale.pixelsPerSecond
    onSeek(Math.max(0, newTime))
  }, [scale.pixelsPerSecond, scrollLeft, onSeek])

  // 如果播放头在可见区域外，不渲染
  if (position < -50 || position > window.innerWidth + 50) {
    return null
  }

  return (
    <div
      ref={playheadRef}
      className="timeline-playhead"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: position,
        cursor: 'pointer',
        zIndex: 100,
      }}
    >
      {/* 播放头线 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'var(--primary-color)',
          transform: 'translateX(-1px)',
          boxShadow: isDragging 
            ? '0 0 8px var(--primary-color)' 
            : '0 0 4px var(--primary-color)',
          transition: isDragging ? 'none' : 'box-shadow 0.15s ease',
        }}
      />

      {/* 播放头顶部三角形 */}
      <div
        style={{
          position: 'absolute',
          left: -6,
          top: 0,
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '10px solid var(--primary-color)',
          transform: 'translateX(-6px)',
          filter: isDragging 
            ? 'drop-shadow(0 0 4px var(--primary-color))' 
            : 'none',
        }}
      />

      {/* 拖拽热区（扩大点击区域） */}
      <div
        style={{
          position: 'absolute',
          left: -10,
          top: 0,
          bottom: 0,
          width: 20,
          cursor: 'ew-resize',
        }}
      />
    </div>
  )
})

TimelinePlayhead.displayName = 'TimelinePlayhead'

export default TimelinePlayhead

export type { TimelinePlayheadProps }
