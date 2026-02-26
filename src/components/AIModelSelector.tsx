import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Row, Col, Typography, Tag, Avatar, Radio, Space, Tooltip, Button, Input, Segmented, Spin } from 'antd';
import { CheckCircleFilled, RobotOutlined, QuestionCircleOutlined, CodeOutlined, VideoCameraOutlined, EditOutlined, FireOutlined, StarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import styles from './AIModelSelector.module.less';

const { Title, Text, Paragraph } = Typography;

// 模型类型定义
export type ModelCategory = 'text' | 'code' | 'image' | 'video' | 'all';
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'baidu' | 'iflytek' | 'alibaba' | 'tencent' | 'zhipu';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  category: ModelCategory[];
  description: string;
  features: string[];
  tokenLimit: number;
  isPro?: boolean;
  isAvailable?: boolean;
  apiConfigured?: boolean;
  avatar?: string | React.ReactNode;
}

// 定义组件属性
interface AIModelSelectorProps {
  selectedModel?: string;
  onChange?: (modelId: string) => void;
  onConfigureAPI?: (provider: ModelProvider) => void;
  category?: ModelCategory;
  compact?: boolean;
  className?: string;
}

const models: AIModel[] = [
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    category: ['text', 'code', 'image'],
    description: '最强大的多模态大模型，支持文本、代码和图像分析',
    features: ['视觉理解', '高级推理', '代码生成'],
    tokenLimit: 128000,
    isPro: true,
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/2048px-ChatGPT_logo.svg.png'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5',
    provider: 'openai',
    category: ['text', 'code'],
    description: '性能均衡的大型语言模型，适合日常文本和代码任务',
    features: ['文本生成', '代码辅助', '快速响应'],
    tokenLimit: 16000,
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/2048px-ChatGPT_logo.svg.png'
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    category: ['text', 'code', 'image'],
    description: 'Anthropic最强大的多模态模型，具有卓越理解力',
    features: ['深度分析', '视觉理解', '长文本处理'],
    tokenLimit: 200000,
    isPro: true,
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF4BPGvrUHBwGbFiLZNlIRU3mp09a4KTMYoQD-MCc4XDwbPGUu'
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    category: ['text', 'code', 'image'],
    description: '平衡性能与速度的Claude模型，多任务处理能力强',
    features: ['创意写作', '精确回答', '图像分析'],
    tokenLimit: 180000,
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF4BPGvrUHBwGbFiLZNlIRU3mp09a4KTMYoQD-MCc4XDwbPGUu'
  },
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'google',
    category: ['text', 'code', 'image', 'video'],
    description: 'Google最先进的多模态模型，支持视频分析',
    features: ['多模态分析', '视频理解', '长文本处理'],
    tokenLimit: 100000,
    isPro: true,
    avatar: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-advanced_1.max-1000x1000.png'
  },
  {
    id: 'ernie-4',
    name: 'ERNIE 5.5',
    provider: 'baidu',
    category: ['text', 'code'],
    description: '百度最新自然语言理解模型，擅长中文处理',
    features: ['中文优化', '知识图谱', '对话能力'],
    tokenLimit: 30000,
    avatar: 'https://img2.baidu.com/it/u=3016903464,1904337711&fm=253&fmt=auto&app=138&f=PNG?w=500&h=500'
  },
  {
    id: 'spark-3.5',
    name: '讯飞星火3.5',
    provider: 'iflytek',
    category: ['text', 'code'],
    description: '科大讯飞强大的认知大模型，偏重中文应用场景',
    features: ['中文理解', '语音转文本', '知识问答'],
    tokenLimit: 32000,
    avatar: 'https://sf3-cn.feishucdn.com/obj/eden-cn/uphco_h47iazuq/iflytek-spark-prd-website/static/favicon.ico'
  },
  {
    id: 'qwen3.5-max',
    name: '通义千问',
    provider: 'alibaba',
    category: ['text', 'code', 'image'],
    description: '阿里云推出的创新大模型，拥有强大的文本处理能力',
    features: ['多语言支持', '代码生成', '图像理解'],
    tokenLimit: 30000,
    avatar: 'https://img.alicdn.com/imgextra/i2/O1CN01YQzmiJ1QTmFpub1Gk_!!6000000001976-2-tps-200-200.png'
  },
  {
    id: 'chatglm4',
    name: 'GLM-5',
    provider: 'zhipu',
    category: ['text', 'code', 'image'],
    description: '清华&智谱AI推出的开源双语对话模型，优化中英文处理',
    features: ['双语优化', '代码能力', '学术研究'],
    tokenLimit: 32000,
    avatar: 'https://www.zhipuai.cn/static/media/glm-large.6d351772.png'
  }
];

const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel = 'gpt-3.5-turbo',
  onChange,
  onConfigureAPI,
  category = 'all',
  compact = false,
  className = ''
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(selectedModel);
  const [activeCategory, setActiveCategory] = useState<ModelCategory>(category);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>(compact ? 'list' : 'card');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 响应式布局处理
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && viewMode === 'card') {
        setViewMode('list');
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // 过滤模型
  const filteredModels = models.filter(model => {
    // 类别过滤
    if (activeCategory !== 'all' && !model.category.includes(activeCategory)) {
      return false;
    }
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.features.some(f => f.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // 处理模型选择
  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    if (onChange) {
      onChange(modelId);
    }
  };

  // 获取提供商显示名称
  const getProviderName = (provider: ModelProvider): string => {
    const providerMap: Record<ModelProvider, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google',
      'baidu': '百度',
      'iflytek': '科大讯飞',
      'alibaba': '阿里云',
      'tencent': '腾讯',
      'zhipu': '智谱AI'
    };
    return providerMap[provider] || provider;
  };

  // 获取类别图标
  const getCategoryIcon = (cat: ModelCategory) => {
    switch (cat) {
      case 'text': return <EditOutlined />;
      case 'code': return <CodeOutlined />;
      case 'image': return <RobotOutlined />;
      case 'video': return <VideoCameraOutlined />;
      default: return <QuestionCircleOutlined />;
    }
  };

  // 获取特性图标
  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes('视觉') || lowerFeature.includes('图像')) return <RobotOutlined />;
    if (lowerFeature.includes('代码')) return <CodeOutlined />;
    if (lowerFeature.includes('高级') || lowerFeature.includes('强大')) return <ThunderboltOutlined />;
    if (lowerFeature.includes('创意')) return <StarOutlined />;
    return <FireOutlined />;
  };

  // 渲染卡片模式UI
  const renderCardView = () => (
    <Row gutter={[16, 16]} className={styles.modelGrid}>
      {filteredModels.map((model, index) => (
        <Col xs={24} sm={12} md={8} lg={6} key={model.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card 
              hoverable
              className={`${styles.modelCard} ${selectedModelId === model.id ? styles.selectedModel : ''}`}
              onClick={() => handleModelSelect(model.id)}
              bodyStyle={{ padding: '16px' }}
            >
              <div className={styles.modelHeader}>
                <Space align="center">
                  {typeof model.avatar === 'string' ? (
                    <Avatar src={model.avatar} size={40} className={styles.modelAvatar} />
                  ) : (
                    <Avatar icon={model.avatar || <RobotOutlined />} size={40} className={styles.modelAvatar} style={{ backgroundColor: '#1E88E5' }} />
                  )}
                  <div>
                    <Text strong className={styles.modelName}>{model.name}</Text>
                    {model.isPro && (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          duration: 0.5,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        style={{ display: 'inline-block' }}
                      >
                        <Tag color="gold" className={styles.proTag}>
                          <StarOutlined /> 专业版
                        </Tag>
                      </motion.div>
                    )}
                  </div>
                </Space>
                {selectedModelId === model.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <CheckCircleFilled className={styles.checkIcon} />
                  </motion.div>
                )}
              </div>
              
              <div className={styles.providerInfo}>
                <Tag color="processing" className={styles.providerTag}>{getProviderName(model.provider)}</Tag>
                <div className={styles.categories}>
                  {model.category.map(cat => (
                    <Tooltip key={cat} title={cat === 'text' ? '文本' : cat === 'code' ? '代码' : cat === 'image' ? '图像' : '视频'}>
                      <Tag icon={getCategoryIcon(cat)} className={styles.categoryTag}></Tag>
                    </Tooltip>
                  ))}
                </div>
              </div>
              
              <Paragraph className={styles.modelDescription} ellipsis={{ rows: 2 }}>{model.description}</Paragraph>
              
              <div className={styles.modelFeatures}>
                {model.features.slice(0, 3).map((feature, index) => (
                  <Tag 
                    key={index} 
                    className={styles.featureTag}
                    icon={getFeatureIcon(feature)}
                  >
                    {feature}
                  </Tag>
                ))}
              </div>
              
              <div className={styles.tokenLimit}>
                <Tooltip title="模型可处理的最大上下文长度">
                  <Text type="secondary" className={styles.tokenText}>
                    <ThunderboltOutlined /> {(model.tokenLimit / 1000).toFixed(0)}K tokens
                  </Text>
                </Tooltip>
              </div>
            </Card>
          </motion.div>
        </Col>
      ))}
    </Row>
  );

  // 渲染列表模式UI
  const renderListView = () => (
    <div className={styles.modelList}>
      <Radio.Group 
        value={selectedModelId} 
        onChange={(e) => handleModelSelect(e.target.value)}
        className={styles.modelRadioGroup}
      >
        {filteredModels.map((model, index) => (
          <motion.div 
            key={model.id} 
            className={styles.modelListItem}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ x: 4 }}
          >
            <Radio value={model.id} className={styles.modelRadio}>
              <Space align="center">
                {typeof model.avatar === 'string' ? (
                  <Avatar src={model.avatar} size={28} className={styles.modelAvatarSmall} />
                ) : (
                  <Avatar icon={model.avatar || <RobotOutlined />} size={28} className={styles.modelAvatarSmall} style={{ backgroundColor: '#1E88E5' }} />
                )}
                <div>
                  <div className={styles.modelNameRow}>
                    <Text strong>{model.name}</Text>
                    {model.isPro && (
                      <Tag color="gold" className={styles.proTagSmall}>
                        <StarOutlined /> Pro
                      </Tag>
                    )}
                  </div>
                  <div className={styles.modelProviderRow}>
                    <Text type="secondary">{getProviderName(model.provider)}</Text>
                    <Tooltip title="模型可处理的最大上下文长度">
                      <span className={styles.tokenBadge}>
                        <ThunderboltOutlined /> {(model.tokenLimit / 1000).toFixed(0)}K
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </Space>
            </Radio>
          </motion.div>
        ))}
      </Radio.Group>
    </div>
  );

  // 渲染类别选择器
  const renderCategorySelector = () => (
    <motion.div 
      className={styles.categorySelector}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Segmented
        value={activeCategory}
        onChange={(value) => {
          setActiveCategory(value as ModelCategory);
          // 添加简单的动画效果
          const container = document.querySelector(`.${styles.content}`);
          if (container) {
            container.classList.add(styles.fadeEffect);
            setTimeout(() => {
              container.classList.remove(styles.fadeEffect);
            }, 300);
          }
        }}
        options={[
          { label: '全部', value: 'all', icon: <RobotOutlined /> },
          { label: '文本', value: 'text', icon: <EditOutlined /> },
          { label: '代码', value: 'code', icon: <CodeOutlined /> },
          { label: '图像', value: 'image', icon: <RobotOutlined /> },
          { label: '视频', value: 'video', icon: <VideoCameraOutlined /> },
        ]}
      />
    </motion.div>
  );

  // 加载状态引用
  const loadingRef = useRef<boolean>(false);
  
  // 模拟加载效果
  const simulateLoading = () => {
    loadingRef.current = true;
    setTimeout(() => {
      loadingRef.current = false;
    }, 500);
  };

  // 主渲染函数
  return (
    <motion.div 
      className={`${styles.container} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className={styles.header}
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Title level={compact ? 5 : 4} className={styles.title}>
          选择AI模型
          <Tooltip title="选择不同的AI模型以适应您的任务需求">
            <QuestionCircleOutlined className={styles.helpIcon} />
          </Tooltip>
        </Title>
        
        <div className={styles.controls}>
          {!compact && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Input.Search 
                placeholder="搜索模型..." 
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  simulateLoading();
                }}
                className={styles.searchInput}
                allowClear
              />
            </motion.div>
          )}
          
          {!isMobile && !compact && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Radio.Group 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                className={styles.viewToggle}
              >
                <Radio.Button value="card">卡片</Radio.Button>
                <Radio.Button value="list">列表</Radio.Button>
              </Radio.Group>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {!compact && renderCategorySelector()}
      
      <div className={styles.content}>
        {loadingRef.current ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" tip="加载模型中..." />
          </div>
        ) : (
          viewMode === 'card' ? renderCardView() : renderListView()
        )}
      </div>

      {onConfigureAPI && (
        <motion.div 
          className={styles.footer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Button 
            type="link" 
            onClick={() => onConfigureAPI(models.find(m => m.id === selectedModelId)?.provider || 'openai')}
            icon={<ThunderboltOutlined />}
          >
            配置API密钥
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIModelSelector;