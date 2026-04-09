import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, HashRouter, Navigate } from 'react-router-dom';

import './App.css';

import ErrorBoundary from './components/common/ErrorBoundary';
const loadAppProvider = () => import('./providers/AppProvider');
const loadLayout = () => import('./components/Layout');
const AppProvider = lazy(loadAppProvider);
const Layout = lazy(loadLayout);

// 懒加载页面组件 - 优化首屏加载
const loadHome = () => import('./pages/Home/index');
const loadDashboard = () => import('./pages/Dashboard/index');
const loadProjectManager = () => import('./pages/Projects/index');
const loadProjectEdit = () => import('./pages/ProjectEdit/index');
const loadProjectDetail = () => import('./pages/ProjectDetail/index');
const loadScriptDetail = () => import('./pages/ScriptDetail/index');
const loadVideoEditor = () => import('./pages/VideoEditor/index');
const loadAIVideoEditor = () => import('./pages/AIVideoEditor/index');
const loadSettings = () => import('./pages/Settings/index');
const Home = lazy(loadHome);
const Dashboard = lazy(loadDashboard);
const ProjectManager = lazy(loadProjectManager);
const ProjectEdit = lazy(loadProjectEdit);
const ProjectDetail = lazy(loadProjectDetail);
const ScriptDetail = lazy(loadScriptDetail);
const VideoEditor = lazy(loadVideoEditor);
const AIVideoEditor = lazy(loadAIVideoEditor);
const Settings = lazy(loadSettings);

// 加载占位符 - 骨架屏
const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid rgba(255, 159, 67, 0.25)',
        borderTopColor: '#FF9F43',
        borderRadius: '50%',
        animation: 'cutdeck-spin 0.9s linear infinite',
      }}
    />
  </div>
);

const App: React.FC = () => {
  useEffect(() => {
    const warmup = () => {
      // 空闲预热关键路由，降低首次侧栏切换卡顿
      void loadDashboard();
      void loadProjectManager();
      void loadProjectEdit();
      void loadSettings();
      void loadAIVideoEditor();
    };

    const idleRequest = (window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    const idleCancel = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;

    if (typeof idleRequest === 'function') {
      const id = idleRequest(warmup, { timeout: 1200 });
      return () => {
        if (typeof idleCancel === 'function') idleCancel(id);
      };
    }

    const timer = window.setTimeout(warmup, 500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <AppProvider>
          <HashRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectManager />} />
                <Route path="/project/new" element={<ProjectEdit />} />
                <Route path="/project/edit/:projectId" element={<ProjectEdit />} />
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/project/:projectId/script/:scriptId" element={<ScriptDetail />} />
                <Route path="/editor" element={<VideoEditor />} />
                <Route path="/editor/:projectId" element={<VideoEditor />} />
                <Route path="/script/:scriptId" element={<ScriptDetail />} />
                <Route path="/ai-editor" element={<AIVideoEditor />} />
                <Route path="/workflow" element={<AIVideoEditor />} />
                <Route path="/ai-clip" element={<AIVideoEditor />} />
                <Route path="/ai-narrate" element={<AIVideoEditor />} />
                <Route path="/ai-mix" element={<AIVideoEditor />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </HashRouter>
        </AppProvider>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
