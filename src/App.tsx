import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, HashRouter, Navigate } from 'react-router-dom';

import './App.css';

import ErrorBoundary from './components/common/ErrorBoundary';
const loadAppProvider = () => import('./providers/AppProvider');
const loadLayout = () => import('./components/Layout/Layout');
const AppProvider = lazy(loadAppProvider);
const Layout = lazy(loadLayout);

// 懒加载页面组件 - 优化首屏加载
const loadHome = () => import('./pages/Home/index');
const loadProjects = () => import('./pages/Projects/index');
const loadProjectEdit = () => import('./pages/ProjectEdit/index');
const loadProjectDetail = () => import('./pages/ProjectDetail/index');
const loadScriptDetail = () => import('./pages/ScriptDetail/index');
const loadWorkspace = () => import('./pages/AIVideoEditor/index');
const loadSettings = () => import('./pages/Settings/index');
const Home = lazy(loadHome);
const Projects = lazy(loadProjects);
const ProjectEdit = lazy(loadProjectEdit);
const ProjectDetail = lazy(loadProjectDetail);
const ScriptDetail = lazy(loadScriptDetail);
const Workspace = lazy(loadWorkspace);
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
        animation: 'StoryFab-spin 0.9s linear infinite',
      }}
    />
  </div>
);

const App: React.FC = () => {
  useEffect(() => {
    const warmup = () => {
      void loadProjects();
      void loadProjectEdit();
      void loadSettings();
      void loadWorkspace();
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
                <Route path="/projects" element={<Projects />} />
                <Route path="/project/new" element={<ProjectEdit />} />
                <Route path="/project/edit/:projectId" element={<ProjectEdit />} />
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/project/:projectId/script/:scriptId" element={<ScriptDetail />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/workspace/:projectId" element={<Workspace />} />
                <Route path="/editor" element={<Workspace />} />
                <Route path="/editor/:projectId" element={<Workspace />} />
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
