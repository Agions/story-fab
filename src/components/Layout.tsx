import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Tooltip, Avatar, Typography, Dropdown, Badge, Space, theme } from 'antd';
import { 
  HomeOutlined, 
  ProjectOutlined, 
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Layout.module.less';
import { useTheme } from '@/context/ThemeContext';

const { Sider, Content, Header } = AntLayout;
const { Title, Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [browserWidth, setBrowserWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setBrowserWidth(window.innerWidth);
      if (window.innerWidth < 768 && !collapsed) setCollapsed(true);
      else if (window.innerWidth >= 1200 && collapsed) setCollapsed(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  const getSelectedKey = () => {
    if (location.pathname === '/') return '/';
    if (location.pathname.startsWith('/projects') || location.pathname.startsWith('/project') || location.pathname.startsWith('/editor')) return '/projects';
    if (location.pathname.startsWith('/settings')) return '/settings';
    return '/';
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
      onClick: () => navigate('/projects')
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings')
    }
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return '首页';
    if (path.startsWith('/projects')) return '项目管理';
    if (path.startsWith('/project/new')) return '创建项目';
    if (path.startsWith('/project/edit')) return '编辑项目';
    if (path.startsWith('/project/')) return '项目详情';
    if (path.startsWith('/editor')) return '视频工作台';
    if (path.startsWith('/settings')) return '系统设置';
    return 'ClipFlow';
  };

  const userMenu = {
    items: [
      { key: 'profile', label: '个人信息', icon: <UserOutlined /> },
      { key: 'preferences', label: '偏好设置', icon: <SettingOutlined /> },
      { type: 'divider' as const },
      { key: 'logout', label: '退出登录', danger: true }
    ],
    onClick: (e: any) => {
      if (e.key === 'preferences') navigate('/settings');
    }
  };

  return (
    <AntLayout className={styles.layout} style={{ minHeight: '100vh' }}>
      <Sider 
        className={styles.sider} 
        theme="light"
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        collapsedWidth={64}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          borderRight: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }} onClick={() => navigate('/')}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            flexShrink: 0
          }}>
            C
          </div>
          {!collapsed && (
            <Title level={4} style={{ margin: '0 0 0 12px', fontSize: 18, whiteSpace: 'nowrap' }}>
              ClipFlow
            </Title>
          )}
        </div>
        
        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ border: 'none', marginTop: 8 }}
        />
        
        {/* 折叠按钮 */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Tooltip title={collapsed ? '展开' : '收起'} placement="right">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: 'rgba(0,0,0,0.45)' }}
            />
          </Tooltip>
        </div>
      </Sider>
      
      <AntLayout style={{ marginLeft: collapsed ? 64 : 220, transition: 'margin-left 0.2s' }}>
        {/* 顶部栏 */}
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          height: 56,
          lineHeight: '56px',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <Text strong style={{ fontSize: 16 }}>{getPageTitle()}</Text>
          
          <Space size={4}>
            <Tooltip title="帮助">
              <Button type="text" shape="circle" icon={<QuestionCircleOutlined />} size="small" />
            </Tooltip>
            <Tooltip title="通知">
              <Badge count={0} size="small">
                <Button type="text" shape="circle" icon={<BellOutlined />} size="small" />
              </Badge>
            </Tooltip>
            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <Button type="text" style={{ padding: '0 8px' }}>
                <Space>
                  <Avatar size="small" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>U</Avatar>
                  {browserWidth > 768 && <span style={{ fontSize: 13 }}>用户</span>}
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        
        {/* 内容区 */}
        <Content style={{
          padding: 24,
          minHeight: 'calc(100vh - 56px)',
          background: isDarkMode ? '#141414' : '#f5f5f5',
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
