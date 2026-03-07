import React, { Suspense, lazy } from 'react';
import { Routes, Route, HashRouter, Navigate } from 'react-router-dom';

import './App.css';

import ErrorBoundary from './components/common/ErrorBoundary';
const AppProvider = lazy(() => import('./providers/AppProvider'));
const Layout = lazy(() => import('./components/Layout'));

// 懒加载页面组件 - 优化首屏加载
const Home = lazy(() => import('./pages/Home/index'));
const Dashboard = lazy(() => import('./pages/Dashboard/index'));
const ProjectManager = lazy(() => import('./pages/Projects/index'));
const ProjectEdit = lazy(() => import('./pages/ProjectEdit/index'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail/index'));
const ScriptDetail = lazy(() => import('./pages/ScriptDetail/index'));
const VideoEditor = lazy(() => import('./pages/VideoEditor/index'));
const AIVideoEditor = lazy(() => import('./pages/AIVideoEditor/index'));
const Settings = lazy(() => import('./pages/Settings/index'));

// 加载占位符 - 骨架屏
const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid rgba(99, 102, 241, 0.25)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'clipflow-spin 0.9s linear infinite',
      }}
    />
  </div>
);

const App: React.FC = () => {
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
