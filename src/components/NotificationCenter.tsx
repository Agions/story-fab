import React from 'react';
import { Button } from './ui/button';
import { Bell } from 'lucide-react';
import { useAppStore } from '@/store';
import styles from '@/components/NotificationCenter.module.less';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const { notifications, clearNotifications } = useAppStore();

  // 通知数据 (从store获取)
  const notificationList = Array.from({ length: notifications }, (_, idx) => ({
    key: `notification-${idx + 1}`,
    title: `系统通知 ${idx + 1}`,
    time: '刚刚',
    content: '你有一条新的系统通知。'
  }));

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-bg-secondary border-l border-border shadow-xl flex flex-col ${styles.drawer}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">通知中心</h2>
          <Button
            variant="link"
            onClick={clearNotifications}
            disabled={notifications <= 0}
            className="text-xs text-accent-primary h-auto p-0"
          >
            清除全部
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {notificationList.length > 0 ? (
            <div className={styles.notificationList}>
              {notificationList.map(item => (
                <div key={item.key} className={styles.notificationItem + ' px-4 py-3 border-b border-border'}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary">{item.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bell size={48} className="mb-3 opacity-30" />
              <p className="text-sm">暂无通知</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
