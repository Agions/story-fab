import React from 'react';
import { Drawer, List, Typography, Button, Empty } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/app';
import styles from './NotificationCenter.module.less';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const { notifications, clearNotifications } = useAppStore();

  const mockNotifications = [
    {
      id: 1,
      title: '项目导出完成',
      content: '您的项目"视频解说脚本"已成功导出',
      time: '10分钟前',
    },
    {
      id: 2,
      title: '新功能上线',
      content: '我们新增了AI智能分析功能，快来体验吧！',
      time: '1小时前',
    },
  ];

  return (
    <Drawer
      title="通知中心"
      placement="right"
      onClose={onClose}
      open={open}
      width={320}
      extra={
        <Button type="link" onClick={clearNotifications} disabled={!notifications}>
          清除全部
        </Button>
      }
    >
      {mockNotifications.length > 0 ? (
        <List
          className={styles.notificationList}
          itemLayout="vertical"
          dataSource={mockNotifications}
          renderItem={(item) => (
            <List.Item className={styles.notificationItem}>
              <div className={styles.notificationHeader}>
                <Typography.Text strong>{item.title}</Typography.Text>
                <Typography.Text type="secondary" className={styles.notificationTime}>
                  {item.time}
                </Typography.Text>
              </div>
              <Typography.Text className={styles.notificationContent}>
                {item.content}
              </Typography.Text>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={<BellOutlined style={{ fontSize: 48 }} />}
          description="暂无通知"
        />
      )}
    </Drawer>
  );
};

export default NotificationCenter; 