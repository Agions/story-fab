/**
 * 主布局组件
 * 负责应用的整体布局结构，包括导航栏、侧边栏和内容区域
 * 
 * @author Agions
 * @date 2024
 */
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer, Tooltip, Badge, Avatar, Dropdown, Space, Typography } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  SettingOutlined,
  MenuOutlined,
  BulbOutlined,
  BulbFilled,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  GithubOutlined,
  ScissorOutlined,
  AppstoreOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import { useAppStore } from '@/store/app';
import NotificationCenter from '@/components/NotificationCenter';
import styles from './MainLayout.module.less';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// 页脚组件
const Footer = () => (
  <div className={styles.footer}>
    <div className={styles.footerContent}>
      <div className={styles.footerLinks}>
        <a href="https://github.com/agions/clipflow" target="_blank" rel="noopener noreferrer">
          <GithubOutlined /> GitHub
        </a>
        <a href="/privacy" target="_blank">隐私政策</a>
        <a href="/terms" target="_blank">使用条款</a>
      </div>
      <div className={styles.copyright}>
        <Text type="secondary">ClipFlow © {new Date().getFullYear()} Created by Agions</Text>
      </div>
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { notifications } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [tauriSupported, setTauriSupported] = useState(true);

  useEffect(() => {
    // 检查Tauri功能是否可用
    const checkTauriSupport = async () => {
      try {
        // 简单地检查是否可以导入Tauri API
        await import('@tauri-apps/api/app');
        setTauriSupported(true);
      } catch {
        console.warn('Tauri功能不可用:', error);
        setTauriSupported(false);
      }
    };
    
    checkTauriSupport();
    
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileDrawerOpen]);

  // 用户菜单选项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        console.log('用户登出');
        // 登出逻辑
      },
    },
  ];

  // 导航菜单项
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/projects',
      icon: <VideoCameraOutlined />,
      label: '项目管理',
    },
    {
      key: '/editor',
      icon: <ScissorOutlined />,
      label: '视频剪辑',
    },
    {
      key: '/scripts',
      icon: <FileTextOutlined />,
      label: '剧本管理',
    },
    {
      key: '/templates',
      icon: <AppstoreOutlined />,
      label: '模板中心',
    },
    {
      type: 'divider'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  // 当前路径对应的标题
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return '首页';
    if (path.startsWith('/projects')) return '项目管理';
    if (path.startsWith('/editor')) return '视频剪辑';
    if (path.startsWith('/scripts')) return '剧本管理';
    if (path.startsWith('/templates')) return '模板中心';
    if (path.startsWith('/settings')) return '系统设置';
    return 'ClipFlow';
  };

  const renderMenu = () => (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`]}
      defaultSelectedKeys={['/']}
      items={menuItems}
      onClick={({ key }) => {
        navigate(key);
        if (isMobile) {
          setMobileDrawerOpen(false);
        }
      }}
      className={styles.mainMenu}
    />
  );

  return (
    <Layout className={`${styles.layout} ${isDarkMode ? 'dark' : ''}`}>
      <Header className={styles.header}>
        <div className={styles.headerLeft}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileDrawerOpen(true)}
              className={styles.menuButton}
            />
          )}
          <div className={styles.logo} onClick={() => navigate('/')}>
            <FireOutlined className={styles.logoIcon} />
            <span className={styles.logoText}>ClipFlow</span>
          </div>
          {!isMobile && (
            <div className={styles.pageTitle}>
              {getPageTitle()}
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          <Tooltip title={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}>
            <Button 
              type="text" 
              icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />} 
              onClick={toggleTheme}
              className={styles.iconButton}
            />
          </Tooltip>
          
          {tauriSupported && (
            <Tooltip title="通知中心">
              <Badge count={notifications} size="small" offset={[-2, 2]}>
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  onClick={() => setNotificationDrawerOpen(true)}
                  className={styles.iconButton}
                />
              </Badge>
            </Tooltip>
          )}

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <div className={styles.avatarContainer}>
              <Avatar
                size="default"
                icon={<UserOutlined />}
                className={styles.avatar}
              />
            </div>
          </Dropdown>
        </div>
      </Header>
      <Layout className={styles.mainContainer}>
        {!isMobile ? (
          <Sider 
            width={220} 
            className={styles.sider}
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            theme={isDarkMode ? 'dark' : 'light'}
            breakpoint="lg"
          >
            {renderMenu()}
          </Sider>
        ) : (
          <Drawer
            title={
              <div className={styles.drawerHeader}>
                <FireOutlined className={styles.logoIcon} />
                <span className={styles.logoText}>ClipFlow</span>
              </div>
            }
            placement="left"
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
            bodyStyle={{ padding: 0 }}
            width={260}
            className={styles.mobileDrawer}
            closeIcon={null}
          >
            {renderMenu()}
          </Drawer>
        )}
        <Layout>
          <Content 
            className={styles.content}
            style={{
              marginLeft: isMobile ? 0 : (collapsed ? 80 : 220)
            }}
          >
            <div className={styles.contentInner}>
              <Outlet />
            </div>
            <Footer />
          </Content>
        </Layout>
      </Layout>

      {tauriSupported && (
        <NotificationCenter
          open={notificationDrawerOpen}
          onClose={() => setNotificationDrawerOpen(false)}
        />
      )}
    </Layout>
  );
};

export default MainLayout; 