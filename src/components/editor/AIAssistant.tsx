import React, { useState } from 'react';
import { 
  Tabs, 
  Button, 
  Input, 
  Select, 
  Space, 
  Card, 
  List, 
  Avatar,
  Typography,
  Tag,
  Tooltip,
  Slider,
  Progress,
  Collapse,
  Divider,
  Switch
} from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  ScissorOutlined,
  AudioOutlined,
  BulbOutlined,
  TranslationOutlined,
  FileSearchOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import styles from './AIAssistant.module.less';

const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

interface AIAssistantProps {}

const AIAssistant: React.FC<AIAssistantProps> = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [prompt, setPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'ai',
      content: '您好！我是您的AI视频助手。我可以帮助您生成字幕、智能剪辑片段、提供内容建议以及增强视频效果。请告诉我您需要什么帮助？',
      time: new Date()
    }
  ]);
  
  // AI模型选项
  const models = [
    { id: 'gpt-5.2', name: 'GPT-5.2 (通用)', provider: 'openai' },
    { id: 'claude-4.6-opus', name: 'Claude 4.6 Opus (高精度)', provider: 'anthropic' },
    { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro (多模态)', provider: 'google' },
    { id: 'ernie-4.0', name: '文心一言 (中文优化)', provider: 'baidu' }
  ];
  
  // 字幕语言选项
  const languages = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: '英语' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'es', name: '西班牙语' },
    { code: 'ru', name: '俄语' }
  ];
  
  // 发送消息
  const sendMessage = () => {
    if (!prompt.trim()) return;
    
    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: prompt,
      time: new Date()
    };
    setMessages([...messages, userMessage]);
    setPrompt('');
    
    // 模拟AI处理
    setProcessing(true);
    setTimeout(() => {
      // 添加AI回复
      const aiResponse = {
        role: 'ai',
        content: `我将帮您完成"${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"。正在处理您的请求...`,
        time: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setProcessing(false);
    }, 1500);
  };
  
  // 处理回车键发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // 生成字幕
  const generateSubtitles = () => {
    setProcessing(true);
    
    // 模拟进度条
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProcessing(false);
        
        // 添加结果消息
        const resultMessage = {
          role: 'ai',
          content: '已成功生成字幕！字幕已经添加到时间轴上，您可以在编辑器中查看和修改。',
          time: new Date()
        };
        setMessages(prev => [...prev, resultMessage]);
      }
    }, 300);
  };
  
  // 智能剪辑
  const smartCut = () => {
    setProcessing(true);
    
    // 模拟进度条
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 3;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProcessing(false);
        
        // 添加结果消息
        const resultMessage = {
          role: 'ai',
          content: '智能剪辑完成！已为您移除了沉默部分并优化了节奏。可以在时间轴上查看剪辑结果。',
          time: new Date()
        };
        setMessages(prev => [...prev, resultMessage]);
      }
    }, 200);
  };
  
  // 渲染聊天消息
  const renderMessages = () => {
    return messages.map((message, index) => (
      <div 
        key={index} 
        className={`${styles.message} ${message.role === 'ai' ? styles.aiMessage : styles.userMessage}`}
      >
        <div className={styles.messageAvatar}>
          {message.role === 'ai' ? (
            <Avatar icon={<RobotOutlined />} className={styles.aiAvatar} />
          ) : (
            <Avatar 
              className={styles.userAvatar}
              style={{ 
                backgroundColor: '#1890ff',
                color: '#fff'
              }}
            >
              U
            </Avatar>
          )}
        </div>
        <div className={styles.messageContent}>
          <div className={styles.messageText}>
            {message.content}
          </div>
          <div className={styles.messageTime}>
            {new Date(message.time).toLocaleTimeString()}
          </div>
        </div>
      </div>
    ));
  };
  
  return (
    <div className={styles.aiAssistantContainer}>
      <div className={styles.aiHeader}>
        <Title level={4} className={styles.aiTitle}>
          <RobotOutlined className={styles.aiIcon} /> AI助手
        </Title>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className={styles.aiTabs}
      >
        <TabPane tab="智能对话" key="chat" />
        <TabPane tab="字幕生成" key="subtitles" />
        <TabPane tab="智能剪辑" key="smartcut" />
        <TabPane tab="视频增强" key="enhance" />
      </Tabs>
      
      <div className={styles.aiContent}>
        {activeTab === 'chat' && (
          <div className={styles.chatContainer}>
            <div className={styles.chatMessages}>
              {renderMessages()}
            </div>
            
            <div className={styles.chatInput}>
              <div className={styles.modelSelector}>
                <Select
                  defaultValue="gpt-5.2"
                  style={{ width: '100%' }}
                  size="small"
                >
                  {models.map(model => (
                    <Option key={model.id} value={model.id}>
                      {model.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <TextArea
                placeholder="请描述您需要的帮助..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                autoSize={{ minRows: 1, maxRows: 3 }}
                disabled={processing}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendMessage}
                disabled={!prompt.trim() || processing}
                className={styles.sendButton}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'subtitles' && (
          <div className={styles.toolContainer}>
            <Card className={styles.toolCard}>
              <Title level={5}>自动生成字幕</Title>
              <Paragraph className={styles.toolDescription}>
                使用AI识别视频中的语音内容，自动生成字幕并添加到时间轴
              </Paragraph>
              
              <div className={styles.toolOptions}>
                <div className={styles.optionItem}>
                  <Text>识别语言</Text>
                  <Select
                    defaultValue="zh"
                    style={{ width: '100%' }}
                  >
                    {languages.map(lang => (
                      <Option key={lang.code} value={lang.code}>
                        {lang.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                
                <div className={styles.optionItem}>
                  <Text>字幕格式</Text>
                  <Select
                    defaultValue="srt"
                    style={{ width: '100%' }}
                  >
                    <Option value="srt">SRT</Option>
                    <Option value="vtt">VTT</Option>
                    <Option value="ass">ASS</Option>
                  </Select>
                </div>
                
                <div className={styles.optionItem}>
                  <Space className={styles.switchOption}>
                    <Switch defaultChecked />
                    <Text>自动分段</Text>
                    <Tooltip title="根据语义自动将字幕分成多个段落">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                </div>
                
                <div className={styles.optionItem}>
                  <Space className={styles.switchOption}>
                    <Switch defaultChecked />
                    <Text>过滤语气词</Text>
                    <Tooltip title="移除'嗯'、'啊'等语气词，使字幕更加清晰">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                </div>
              </div>
              
              <Button
                type="primary"
                icon={<TranslationOutlined />}
                onClick={generateSubtitles}
                disabled={processing}
                loading={processing && activeTab === 'subtitles'}
                block
              >
                开始生成字幕
              </Button>
              
              {processing && activeTab === 'subtitles' && (
                <div className={styles.progressContainer}>
                  <Progress percent={progress} status="active" />
                  <div className={styles.progressStatus}>
                    {progress < 30 && '正在分析音频...'}
                    {progress >= 30 && progress < 60 && '识别语音内容...'}
                    {progress >= 60 && progress < 90 && '生成字幕文件...'}
                    {progress >= 90 && '完成中...'}
                  </div>
                </div>
              )}
            </Card>
            
            <Collapse
              ghost
              className={styles.extraOptions}
            >
              <Panel header="高级选项" key="1">
                <div className={styles.advancedOptions}>
                  <div className={styles.optionItem}>
                    <Text>识别精度</Text>
                    <Slider
                      defaultValue={80}
                      marks={{
                        40: '快速',
                        80: '标准',
                        95: '高精度'
                      }}
                    />
                  </div>
                  
                  <div className={styles.optionItem}>
                    <Text>翻译字幕</Text>
                    <Select
                      placeholder="选择目标语言（可选）"
                      style={{ width: '100%' }}
                      allowClear
                    >
                      {languages.filter(lang => lang.code !== 'zh').map(lang => (
                        <Option key={lang.code} value={lang.code}>
                          {lang.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>
              </Panel>
            </Collapse>
          </div>
        )}
        
        {activeTab === 'smartcut' && (
          <div className={styles.toolContainer}>
            <Card className={styles.toolCard}>
              <Title level={5}>智能剪辑</Title>
              <Paragraph className={styles.toolDescription}>
                AI分析视频内容，自动移除不需要的部分，保留精华片段
              </Paragraph>
              
              <div className={styles.toolOptions}>
                <div className={styles.optionItem}>
                  <Text>剪辑模式</Text>
                  <Select
                    defaultValue="content"
                    style={{ width: '100%' }}
                  >
                    <Option value="content">内容优先</Option>
                    <Option value="pace">节奏优先</Option>
                    <Option value="compact">精简模式</Option>
                    <Option value="highlight">亮点提取</Option>
                  </Select>
                </div>
                
                <div className={styles.optionItem}>
                  <Text>目标时长</Text>
                  <Select
                    defaultValue="auto"
                    style={{ width: '100%' }}
                  >
                    <Option value="auto">自动优化</Option>
                    <Option value="30">30秒</Option>
                    <Option value="60">1分钟</Option>
                    <Option value="120">2分钟</Option>
                    <Option value="custom">自定义</Option>
                  </Select>
                </div>
                
                <div className={styles.optionItem}>
                  <Space className={styles.switchOption}>
                    <Switch defaultChecked />
                    <Text>移除沉默</Text>
                    <Tooltip title="自动检测并移除视频中的沉默部分">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                </div>
                
                <div className={styles.optionItem}>
                  <Space className={styles.switchOption}>
                    <Switch defaultChecked />
                    <Text>优化转场</Text>
                    <Tooltip title="在剪辑点添加平滑转场效果">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                </div>
              </div>
              
              <Button
                type="primary"
                icon={<ScissorOutlined />}
                onClick={smartCut}
                disabled={processing}
                loading={processing && activeTab === 'smartcut'}
                block
              >
                开始智能剪辑
              </Button>
              
              {processing && activeTab === 'smartcut' && (
                <div className={styles.progressContainer}>
                  <Progress percent={progress} status="active" />
                  <div className={styles.progressStatus}>
                    {progress < 30 && '分析视频内容...'}
                    {progress >= 30 && progress < 60 && '识别关键片段...'}
                    {progress >= 60 && progress < 90 && '优化剪辑点...'}
                    {progress >= 90 && '完成中...'}
                  </div>
                </div>
              )}
            </Card>
            
            <Collapse
              ghost
              className={styles.extraOptions}
            >
              <Panel header="高级选项" key="1">
                <div className={styles.advancedOptions}>
                  <div className={styles.optionItem}>
                    <Text>关键内容优先级</Text>
                    <Slider
                      defaultValue={70}
                      marks={{
                        30: '低',
                        70: '中',
                        95: '高'
                      }}
                    />
                  </div>
                  
                  <div className={styles.optionItem}>
                    <Text>场景检测灵敏度</Text>
                    <Slider
                      defaultValue={50}
                      marks={{
                        20: '低',
                        50: '中',
                        80: '高'
                      }}
                    />
                  </div>
                </div>
              </Panel>
            </Collapse>
          </div>
        )}
        
        {activeTab === 'enhance' && (
          <div className={styles.toolContainer}>
            <Card className={styles.toolCard}>
              <Title level={5}>视频增强</Title>
              <Paragraph className={styles.toolDescription}>
                AI提升视频质量，修复问题并应用智能效果
              </Paragraph>
              
              <div className={styles.enhanceOptions}>
                <div className={styles.enhanceOption}>
                  <Card className={styles.enhanceCard}>
                    <ThunderboltOutlined className={styles.enhanceIcon} />
                    <div className={styles.enhanceTitle}>画质提升</div>
                    <div className={styles.enhanceDesc}>提升清晰度和细节</div>
                    <Button size="small" className={styles.enhanceButton}>应用</Button>
                  </Card>
                </div>
                
                <div className={styles.enhanceOption}>
                  <Card className={styles.enhanceCard}>
                    <BulbOutlined className={styles.enhanceIcon} />
                    <div className={styles.enhanceTitle}>色彩优化</div>
                    <div className={styles.enhanceDesc}>改善对比度和饱和度</div>
                    <Button size="small" className={styles.enhanceButton}>应用</Button>
                  </Card>
                </div>
                
                <div className={styles.enhanceOption}>
                  <Card className={styles.enhanceCard}>
                    <AudioOutlined className={styles.enhanceIcon} />
                    <div className={styles.enhanceTitle}>音频降噪</div>
                    <div className={styles.enhanceDesc}>移除背景噪音</div>
                    <Button size="small" className={styles.enhanceButton}>应用</Button>
                  </Card>
                </div>
                
                <div className={styles.enhanceOption}>
                  <Card className={styles.enhanceCard}>
                    <ExperimentOutlined className={styles.enhanceIcon} />
                    <div className={styles.enhanceTitle}>智能特效</div>
                    <div className={styles.enhanceDesc}>应用AI生成的特效</div>
                    <Button size="small" className={styles.enhanceButton}>应用</Button>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant; 