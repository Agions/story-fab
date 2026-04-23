/**
 * CutDeck Layout — AI Cinema Studio Design
 * 三区制布局：AI工作流侧栏 | 预览区 | 片段卡片流
 *
 * Redesigned per frontend-design-pro principles:
 * - OKLCH color space / warm-tinted dark backgrounds
 * - 4px base spacing grid
 * - cubic-bezier(0.16, 1, 0.3, 1) easing / max 200ms micro-interactions
 * - prefers-reduced-motion respected
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShortcutOverlay } from '@/components/ShortcutOverlay';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Video,
  Settings,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  CircleHelp,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import styles from './Layout.module.less';

interface LayoutProps {
  children: React.ReactNode;
}

// Hook to extract page info from location pathname
const usePageInfo = (pathname: string) => {
  return useMemo(() => {
    if (pathname === '/') return { selectedKey: '/', pageTitle: '首页' };
    if (pathname.startsWith('/projects') || pathname.startsWith('/project') || pathname.startsWith('/editor')) {
      return { selectedKey: '/projects', pageTitle: '我的项目' };
    }
    if (pathname.startsWith('/settings')) return { selectedKey: '/settings', pageTitle: '设置' };
    return { selectedKey: '/', pageTitle: 'CutDeck' };
  }, [pathname]);
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shortcutOverlayOpen, setShortcutOverlayOpen] = useState(false);
  const reducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const { selectedKey, pageTitle } = usePageInfo(location.pathname);

  // Auto-collapse on narrow screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { key: '/', icon: <Home size={18} />, label: '首页', onClick: () => navigate('/') },
    { key: '/projects', icon: <Video size={18} />, label: '我的项目', onClick: () => navigate('/projects') },
    { key: '/settings', icon: <Settings size={18} />, label: '设置', onClick: () => navigate('/settings') },
  ];

  return (
    <div className={styles.shell}>
      {/* ── Left Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        {/* Logo */}
        <div className={styles.logo} onClick={() => navigate('/')} role="button" tabIndex={0}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 160 160" fill="none" aria-hidden="true">
              <rect width="160" height="160" rx="20" fill="#1C1D2E"/>
              <polygon points="68,50 104,68 68,86" fill="url(#pg)"/>
              <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#d4a574"/></linearGradient></defs>
            </svg>
          </div>
          {!sidebarCollapsed && <span className={styles.logoText}>CutDeck</span>}
        </div>

        {/* New Project Button */}
        {!sidebarCollapsed && (
          <button className={styles.newProjectBtn} onClick={() => navigate('/editor/new')}>
            <Plus size={16} />
            <span>新建项目</span>
          </button>
        )}
        {sidebarCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<button className={styles.newProjectBtnIcon} />}
                onClick={() => navigate('/editor/new')}
              >
                <Plus size={16} />
              </TooltipTrigger>
              <TooltipContent side="right">新建项目</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Nav */}
        <nav className={styles.nav} role="navigation" aria-label="主导航">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`${styles.navItem} ${selectedKey === item.key ? styles.active : ''}`}
              onClick={item.onClick}
              title={sidebarCollapsed ? item.label : undefined}
              aria-current={selectedKey === item.key ? 'page' : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!sidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
              {selectedKey === item.key && !reducedMotion.current && <span className={styles.navIndicator} aria-hidden="true" />}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className={styles.sidebarBottom}>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? '展开' : '收起'}
            aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </aside>

      {/* ── Top Bar ── */}
      <header className={styles.topbar} role="banner">
        <div className={styles.topbarLeft}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>
        <div className={styles.topbarRight}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<button className={styles.iconBtn} />} onClick={() => setShortcutOverlayOpen(true)}>
                <CircleHelp size={18} />
              </TooltipTrigger>
              <TooltipContent>键盘快捷键</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<button className={styles.iconBtn} />}>
                <Bell size={18} />
              </TooltipTrigger>
              <TooltipContent>通知</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <button className={styles.userBtn} aria-label="用户菜单">
            <div className={styles.avatar} aria-hidden="true">A</div>
            <span className={styles.userName}>Agions</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className={`${styles.content} ${sidebarCollapsed ? styles.contentExpanded : ''}`} id="main-content">
        {children}
      </main>

      {/* Global keyboard shortcut overlay */}
      <ShortcutOverlay
        open={shortcutOverlayOpen}
        onOpenChange={setShortcutOverlayOpen}
      />
    </div>
  );
};

export default Layout;
