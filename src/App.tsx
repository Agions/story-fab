import React, { Suspense, lazy } from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import Layout from './components/Layout';
import './App.css';

import AppProvider from './providers/AppProvider';
import ErrorBoundary from './ErrorBoundary';

// 懒加载页面组件 - 优化首屏加载
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectManager = lazy(() => import('./pages/Projects'));
const ProjectEdit = lazy(() => import('./pages/ProjectEdit'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ScriptDetail = lazy(() => import('./pages/ScriptDetail'));
const VideoEditor = lazy(() => import('./pages/VideoEditor'));
const AIVideoEditor = lazy(() => import('./pages/AIVideoEditor'));
const Settings = lazy(() => import('./pages/Settings'));

// 加载占位符
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectManager />} />
                <Route path="/project/new" element={<ProjectEdit />} />
                <Route path="/project/edit/:projectId" element={<ProjectEdit />} />
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/editor" element={<VideoEditor />} />
                <Route path="/editor/:projectId" element={<VideoEditor />} />
                <Route path="/script/new" element={<ScriptDetail />} />
                <Route path="/script/:scriptId" element={<ScriptDetail />} />
                <Route path="/ai-editor" element={<AIVideoEditor />} />
                <Route path="/ai-clip" element={<AIVideoEditor />} />
                <Route path="/ai-narrate" element={<AIVideoEditor />} />
                <Route path="/ai-mix" element={<AIVideoEditor />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
