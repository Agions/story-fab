import React, { useEffect, useState } from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { message, notification } from 'antd';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProjectManager from './pages/Projects';
import ProjectEdit from './pages/ProjectEdit';
import ProjectDetail from './pages/ProjectDetail';
import ScriptDetail from './pages/ScriptDetail';
import VideoEditor from './pages/VideoEditor';
import Settings from './pages/Settings';
import './App.css';

import AppProvider from './providers/AppProvider';

const App: React.FC = () => {
  useEffect(() => {
    console.log('ClipFlow 初始化完成');
  }, []);

  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* 首页 */}
            <Route path="/" element={<Home />} />
            
            {/* 项目管理 */}
            <Route path="/projects" element={<ProjectManager />} />
            <Route path="/project/new" element={<ProjectEdit />} />
            <Route path="/project/edit/:projectId" element={<ProjectEdit />} />
            <Route path="/project/:projectId" element={<ProjectDetail />} />
            
            {/* 视频编辑工作台 */}
            <Route path="/editor" element={<VideoEditor />} />
            <Route path="/editor/:projectId" element={<VideoEditor />} />
            
            {/* 脚本 */}
            <Route path="/script/:scriptId" element={<ScriptDetail />} />
            
            {/* 设置 */}
            <Route path="/settings" element={<Settings />} />
            
            {/* 重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App; 