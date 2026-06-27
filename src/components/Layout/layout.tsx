/**
 * StoryFab Layout — Cinematic Darkroom
 *
 * Professional film-editing-suite shell with a narrow icon rail,
 * thin top bar, and maximum content area. Warm charcoal + amber accents.
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ShortcutOverlay } from '@/components/ShortcutOverlay';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Video, Settings, Bell, Plus,
} from 'lucide-react';
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@/components/ui/tooltip';
import styles from './layout.module.less';

interface LayoutProps {
  children: React.ReactNode;
}

const usePageInfo = (pathname: string) => {
  return useMemo(() => {
    if (pathname === '/') return { selectedKey: '/', pageTitle: '首页' };
    if (pathname.startsWith('/projects') || pathname.startsWith('/project') || pathname.startsWith('/editor') || pathname.startsWith('/workspace')) {
      return { selectedKey: '/projects', pageTitle: '项目' };
    }
    if (pathname.startsWith('/settings')) return { selectedKey: '/settings', pageTitle: '设置' };
    return { selectedKey: '/', pageTitle: 'StoryFab' };
  }, [pathname]);
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [shortcutOverlayOpen, setShortcutOverlayOpen] = useState(false);
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const { selectedKey, pageTitle } = usePageInfo(location.pathname);

  const handleLogoKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/');
    }
  }, [navigate]);

  const navItems = useMemo(() => [
    { key: '/', icon: <Home size={18} />, label: '首页', onClick: () => navigate('/') },
    { key: '/projects', icon: <Video size={18} />, label: '项目', onClick: () => navigate('/projects') },
    { key: '/settings', icon: <Settings size={18} />, label: '设置', onClick: () => navigate('/settings') },
  ], [navigate]);

  return (
    <TooltipProvider>
      <div className={styles.shell}>
        {/* ── Left Icon Rail ── */}
        <aside className={styles.sidebar}>
          {/* Logo */}
          <div
            className={styles.logo}
            onClick={() => navigate('/')}
            onKeyDown={handleLogoKeyDown}
            role="button"
            tabIndex={0}
            aria-label="StoryFab 首页"
          >
            <div className={styles.logoIcon}>
              <svg width="28" height="28" viewBox="0 0 160 160" fill="none" aria-hidden="true">
                <rect width="160" height="160" rx="20" fill="#1C1D2E" />
                <polygon points="68,50 104,68 68,86" fill="url(#pg)" />
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#fff" />
                    <stop offset="1" stopColor="#d4a574" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* New Project */}
          <Tooltip>
            <TooltipTrigger
              render={
                <button className={styles.newProjectBtnIcon} onClick={() => navigate('/project/new')} aria-label="新建项目" />
              }
            >
              <Plus size={16} />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              新建项目
            </TooltipContent>
          </Tooltip>

          {/* Navigation */}
          <nav className={styles.nav} role="navigation" aria-label="主导航">
            {navItems.map((item) => {
              const isActive = selectedKey === item.key;
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger
                    render={
                      <button
                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        onClick={item.onClick}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={item.label}
                      />
                    }
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {isActive && !reducedMotion.current && (
                      <span className={styles.navIndicator} aria-hidden="true" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className={styles.sidebarBottom}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    className={styles.iconBtn}
                    onClick={() => setShortcutOverlayOpen(true)}
                    aria-label="键盘快捷键"
                  />
                }
              >
                <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>?</span>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                快捷键
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* ── Top Bar ── */}
        <header className={styles.topbar} role="banner">
          <div className={styles.topbarLeft}>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
          </div>
          <div className={styles.topbarRight}>
            <Tooltip>
              <TooltipTrigger render={<button className={styles.iconBtn} aria-label="通知" />}>
                <Bell size={16} />
              </TooltipTrigger>
              <TooltipContent>通知</TooltipContent>
            </Tooltip>
            <button className={styles.userBtn} aria-label="用户菜单">
              <div className={styles.avatar} aria-hidden="true">A</div>
              <span className={styles.userName}>Agions</span>
            </button>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className={styles.content} id="main-content">
          {children}
        </main>

        <ShortcutOverlay open={shortcutOverlayOpen} onOpenChange={setShortcutOverlayOpen} />
      </div>
    </TooltipProvider>
  );
};

export default Layout;
