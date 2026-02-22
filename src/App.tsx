import React, { Suspense, lazy } from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import Layout from './components/Layout';
import './App.css';

import AppProvider from './providers/AppProvider';

// 懒加载页面组件 - 优化首屏加载
const Home = lazy(() => import('./pages/Home'));
const ProjectManager = lazy(() => import('./pages/Projects'));
const ProjectEdit = lazy(() => import('./pages/ProjectEdit'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ScriptDetail = lazy(() => import('./pages/ScriptDetail'));
const VideoEditor = lazy(() => import('./pages/VideoEditor'));
const Settings = lazy(() => import('./pages/Settings'));

// 加载占位符
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<ProjectManager />} />
              <Route path="/project/new" element={<ProjectEdit />} />
              <Route path="/project/edit/:projectId" element={<ProjectEdit />} />
              <Route path="/project/:projectId" element={<ProjectDetail />} />
              <Route path="/editor" element={<VideoEditor />} />
              <Route path="/editor/:projectId" element={<VideoEditor />} />
              <Route path="/script/:scriptId" element={<ScriptDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
