import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, Button, Card, Row, Col, 
  Statistic, Space, Tag, Progress, Timeline
} from 'antd';
import { 
  VideoCameraOutlined, 
  PlusOutlined, 
  PlayCircleOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ExperimentOutlined,
  ScissorOutlined,
  SoundOutlined,
  ExportOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';

const { Title, Paragraph, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const hours = new Date().getHours();
  const greeting = hours < 12 ? '早上好' : hours < 18 ? '下午好' : '晚上好';

  // 工作流步骤
  const workflowSteps = [
    { icon: <VideoCameraOutlined />, title: '上传视频', desc: '支持 MP4/MOV/WebM', color: '#667eea' },
    { icon: <ThunderboltOutlined />, title: '智能分析', desc: '场景检测 · 关键帧', color: '#764ba2' },
    { icon: <FileTextOutlined />, title: '脚本生成', desc: '8大AI模型 · 7种模板', color: '#f093fb' },
    { icon: <ExperimentOutlined />, title: '去重优化', desc: '原创性保障', color: '#4facfe' },
    { icon: <ScissorOutlined />, title: '智能剪辑', desc: '时间轴编排', color: '#43e97b' },
    { icon: <ExportOutlined />, title: '导出发布', desc: '720p ~ 4K', color: '#fa709a' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 欢迎横幅 */}
      <Card 
        bordered={false}
        style={{ 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
        }}
        styles={{ body: { padding: '40px 36px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 600 }}>
              {greeting}，欢迎使用 ClipFlow
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: '8px 0 20px' }}>
              AI 驱动的专业视频内容创作平台
            </Paragraph>
            <Space size={12}>
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />} 
                onClick={() => navigate('/project/new')}
                style={{ 
                  background: '#fff', 
                  color: '#667eea', 
                  border: 'none',
                  fontWeight: 600,
                  height: 44,
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                创建新项目
              </Button>
              <Button
                size="large"
                icon={<ProjectOutlined />}
                onClick={() => navigate('/projects')}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: '#fff', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  height: 44,
                  borderRadius: 8,
                }}
              >
                项目管理
              </Button>
            </Space>
          </Col>
          <Col>
            <div style={{
              fontSize: 80,
              color: 'rgba(255,255,255,0.15)',
              lineHeight: 1,
            }}>
              <PlayCircleOutlined />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: '总项目', value: 12, icon: <VideoCameraOutlined />, color: '#667eea', suffix: '个' },
          { title: '已完成', value: 8, icon: <CheckCircleOutlined />, color: '#52c41a', suffix: '个' },
          { title: '本月创作', value: 5, icon: <RocketOutlined />, color: '#fa8c16', suffix: '个' },
          { title: '节省时间', value: 24, icon: <ClockCircleOutlined />, color: '#13c2c2', suffix: '小时' },
        ].map((item, idx) => (
          <Col xs={12} sm={6} key={idx}>
            <Card bordered={false} style={{ borderRadius: 10 }} styles={{ body: { padding: '20px 24px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${item.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: item.color,
                }}>
                  {item.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.title}</Text>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>
                    {item.value}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginLeft: 2 }}>{item.suffix}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 工作流程概览 */}
        <Col xs={24} lg={14}>
          <Card 
            title={<><RocketOutlined /> 创作流程</>}
            bordered={false} 
            style={{ borderRadius: 10, height: '100%' }}
          >
            <Row gutter={[12, 16]}>
              {workflowSteps.map((step, idx) => (
                <Col xs={12} sm={8} key={idx}>
                  <div style={{
                    padding: '16px 12px',
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = step.color;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${step.color}15`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, color: step.color, marginBottom: 8,
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{step.title}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{step.desc}</Text>
                  </div>
                </Col>
              ))}
            </Row>
            
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/project/new')}
                style={{ 
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: 8,
                  height: 40,
                }}
              >
                开始创作 <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </Col>

        {/* 最近动态 */}
        <Col xs={24} lg={10}>
          <Card 
            title={<><ClockCircleOutlined /> 最近动态</>}
            bordered={false} 
            style={{ borderRadius: 10, height: '100%' }}
          >
            <Timeline
              items={[
                {
                  color: '#52c41a',
                  children: (
                    <div>
                      <Text strong>产品宣传视频</Text>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>导出完成 · MP4 · 1080p</Text></div>
                      <Text type="secondary" style={{ fontSize: 11 }}>2 小时前</Text>
                    </div>
                  )
                },
                {
                  color: '#667eea',
                  children: (
                    <div>
                      <Text strong>教学系列 EP03</Text>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>脚本生成完成 · Qwen 3.5 (原生多模态版)</Text></div>
                      <Text type="secondary" style={{ fontSize: 11 }}>5 小时前</Text>
                    </div>
                  )
                },
                {
                  color: '#fa8c16',
                  children: (
                    <div>
                      <Text strong>社交媒体短视频</Text>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>AI 分析中 · 场景检测</Text></div>
                      <Text type="secondary" style={{ fontSize: 11 }}>昨天</Text>
                    </div>
                  )
                },
                {
                  color: '#667eea',
                  children: (
                    <div>
                      <Text strong>品牌故事片</Text>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>项目创建</Text></div>
                      <Text type="secondary" style={{ fontSize: 11 }}>3 天前</Text>
                    </div>
                  )
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* AI 模型支持 */}
      <Card 
        bordered={false} 
        style={{ borderRadius: 10, marginTop: 16 }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Text type="secondary">
            <ThunderboltOutlined /> 支持的 AI 模型
          </Text>
          <Space size={6} wrap>
            {['GPT-5.2', 'Claude Opus 4.6', 'Gemini 3', 'ERNIE 5.5', 'Qwen 3.5 (原生多模态版)', 'GLM-5', 'Kimi k2', 'Spark X1'].map(m => (
              <Tag key={m} style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>{m}</Tag>
            ))}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Home;
