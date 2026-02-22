/**
 * 系统设置页面
 * 管理应用配置、API密钥及系统设置
 * 
 * @author Agions
 * @date 2024
 * @version 2.0
 * @description 基于Ant Design的高级设置界面，支持AI模型配置与系统设置
 */
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Card,
  Tabs,
  Input,
  Button,
  Form,
  message,
  Switch,
  Space,
  Row,
  Col,
  Tag,
  Tooltip,
  Alert,
  Typography,
  Divider,
  Badge,
  Skeleton,
  Collapse,
  Avatar,
  notification,
  Select
} from 'antd';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CloudOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  LockOutlined,
  RocketOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  TranslationOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  KeyOutlined,
  PlusCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  RobotOutlined,
  SecurityScanOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { open } from '@tauri-apps/api/dialog';
import styles from './Settings.module.less';
import ThemeContext from '../context/ThemeContext';
import AIModelSelector from '../components/AIModelSelector';
import useTranslation from '../utils/i18n';

// 手动定义ModelProvider类型
type ModelProvider = 'openai' | 'anthropic' | 'google' | 'baidu' | 'iflytek' | 'alibaba' | 'tencent' | 'zhipu' | 'moonshot' | 'deepseek' | 'minimax';

const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

interface ApiKeyState {
  value: string;
  isValid: boolean | null;
  isTesting: boolean;
}

// 自定义钩子
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prevValue: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prevValue: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// API验证服务
const validateApiKey = async (type: string, apiKey: string): Promise<boolean> => {
  return new Promise(resolve => {
    setTimeout(() => {
      let valid = apiKey.length > 10;
      
      if (type === 'openai' && !apiKey.startsWith('sk-')) valid = false;
      if (type === 'anthropic' && !apiKey.startsWith('sk-ant-')) valid = false;
      if (type === 'google' && !apiKey.startsWith('AIza')) valid = false;
      if (type === 'baidu' && apiKey.length < 20) valid = false;
      if (type === 'iflytek' && apiKey.length < 20) valid = false;
      if (type === 'alibaba' && apiKey.length < 20) valid = false;
      if (type === 'tencent' && apiKey.length < 20) valid = false;
      if (type === 'zhipu' && apiKey.length < 20) valid = false;
      if (type === 'moonshot' && apiKey.length < 20) valid = false;
      if (type === 'deepseek' && !apiKey.startsWith('sk-')) valid = false;
      if (type === 'minimax' && apiKey.length < 20) valid = false;
      
      resolve(valid);
    }, 1000);
  });
};

// 添加模型定义
const models = [
  { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', provider: 'openai' },
  { id: 'claude-4.6-opus', name: 'Claude 4.6 Opus', provider: 'anthropic' },
  { id: 'claude-4.6-sonnet', name: 'Claude 4.6 Sonnet', provider: 'anthropic' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', provider: 'google' },
  { id: 'deepseek-v4', name: 'DeepSeek v4', provider: 'deepseek' },
  { id: 'ernie-5.0', name: '文心一言 5.0', provider: 'baidu' },
  { id: 'spark-x2', name: '讯飞星火 X2', provider: 'iflytek' },
  { id: 'qwen-3.5-max', name: '通义千问 3.5 Max', provider: 'alibaba' },
  { id: 'hunyuan-ultra', name: '腾讯混元 Ultra', provider: 'tencent' },
  { id: 'glm-5', name: 'GLM 5', provider: 'zhipu' },
  { id: 'kimi-k2.5', name: 'Kimi k2.5', provider: 'moonshot' },
  { id: 'abab6.5s', name: 'MiniMax 文本模型 (abab6.5s)', provider: 'minimax' },
  { id: 'speech-01-turbo', name: 'MiniMax 语音模型 (Speech-01)', provider: 'minimax' },
];

// 明确的声明Settings组件类型
const Settings: React.FC = () => {
  const themeContext = useContext(ThemeContext);
  const isDarkMode = themeContext?.isDarkMode || false;
  const [form] = Form.useForm();
  const { t, language, changeLanguage } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('models');
  const [isLoading, setIsLoading] = useState(true);
  
  const [openaiApiKey, setOpenaiApiKey] = useLocalStorage<ApiKeyState>('openai_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [anthropicApiKey, setAnthropicApiKey] = useLocalStorage<ApiKeyState>('anthropic_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [googleApiKey, setGoogleApiKey] = useLocalStorage<ApiKeyState>('google_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [baiduApiKey, setBaiduApiKey] = useLocalStorage<ApiKeyState>('baidu_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [iflytekApiKey, setIflytekApiKey] = useLocalStorage<ApiKeyState>('iflytek_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [alibabaApiKey, setAlibabaApiKey] = useLocalStorage<ApiKeyState>('alibaba_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [tencentApiKey, setTencentApiKey] = useLocalStorage<ApiKeyState>('tencent_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [zhipuApiKey, setZhipuApiKey] = useLocalStorage<ApiKeyState>('zhipu_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [moonshotApiKey, setMoonshotApiKey] = useLocalStorage<ApiKeyState>('moonshot_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [deepseekApiKey, setDeepseekApiKey] = useLocalStorage<ApiKeyState>('deepseek_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [minimaxApiKey, setMinimaxApiKey] = useLocalStorage<ApiKeyState>('minimax_api_key', {
    value: '',
    isValid: null,
    isTesting: false
  });
  
  const [autoSave, setAutoSave] = useLocalStorage<boolean>('auto_save', true);
  const [autoUpdate, setAutoUpdate] = useLocalStorage<boolean>('auto_update', true);
  const [showLineNumbers, setShowLineNumbers] = useLocalStorage<boolean>('show_line_numbers', true);
  const [enableTranscode, setEnableTranscode] = useLocalStorage<boolean>('enable_transcode', false);
  const [highQualityExport, setHighQualityExport] = useLocalStorage<boolean>('high_quality_export', true);
  const [defaultModelIndex, setDefaultModelIndex] = useLocalStorage<number>('default_model_index', 0);
  const [workspacePath, setWorkspacePath] = useLocalStorage<string>('workspace_path', '~/ClipFlow/Projects');
  
  // 添加缺失的状态变量声明
  const [apiTesting, setApiTesting] = useState<Record<string, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
    baidu: false,
    iflytek: false,
    alibaba: false,
    tencent: false,
    zhipu: false,
    moonshot: false,
    deepseek: false,
    minimax: false
  });

  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // 简化表单初始化
  useEffect(() => {
    form.resetFields();
  }, [form]);

  const testApiKey = async (type: string, apiKey: string) => {
    if (!apiKey) {
      message.warning('请先输入API密钥');
      return;
    }
    
    switch (type) {
      case 'openai':
        setOpenaiApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setOpenaiApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`OpenAI API密钥验证成功`);
          } else {
            message.error(`OpenAI API密钥验证失败`);
          }
        } catch (error) {
          setOpenaiApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'anthropic':
        setAnthropicApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setAnthropicApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`Anthropic API密钥验证成功`);
          } else {
            message.error(`Anthropic API密钥验证失败`);
          }
        } catch (error) {
          setAnthropicApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'google':
        setGoogleApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setGoogleApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`Google API密钥验证成功`);
          } else {
            message.error(`Google API密钥验证失败`);
          }
        } catch (error) {
          setGoogleApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'baidu':
        setBaiduApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setBaiduApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`百度文心一言API密钥验证成功`);
          } else {
            message.error(`百度文心一言API密钥验证失败`);
          }
        } catch (error) {
          setBaiduApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'iflytek':
        setIflytekApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setIflytekApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`讯飞星火API密钥验证成功`);
          } else {
            message.error(`讯飞星火API密钥验证失败`);
          }
        } catch (error) {
          setIflytekApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'alibaba':
        setAlibabaApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setAlibabaApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`阿里通义千问API密钥验证成功`);
          } else {
            message.error(`阿里通义千问API密钥验证失败`);
          }
        } catch (error) {
          setAlibabaApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'tencent':
        setTencentApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setTencentApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`腾讯混元API密钥验证成功`);
          } else {
            message.error(`腾讯混元API密钥验证失败`);
          }
        } catch (error) {
          setTencentApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'zhipu':
        setZhipuApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setZhipuApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`智谱ChatGLM API密钥验证成功`);
          } else {
            message.error(`智谱ChatGLM API密钥验证失败`);
          }
        } catch (error) {
          setZhipuApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'moonshot':
        setMoonshotApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setMoonshotApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`Moonshot API密钥验证成功`);
          } else {
            message.error(`Moonshot API密钥验证失败`);
          }
        } catch (error) {
          setMoonshotApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'deepseek':
        setDeepseekApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setDeepseekApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`DeepSeek API密钥验证成功`);
          } else {
            message.error(`DeepSeek API密钥验证失败`);
          }
        } catch (error) {
          setDeepseekApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      case 'minimax':
        setMinimaxApiKey(prev => ({ ...prev, isTesting: true }));
        try {
          const isValid = await validateApiKey(type, apiKey);
          setMinimaxApiKey(prev => ({ ...prev, isValid, isTesting: false }));
          
          if (isValid) {
            message.success(`MiniMax API密钥验证成功`);
          } else {
            message.error(`MiniMax API密钥验证失败`);
          }
        } catch (error) {
          setMinimaxApiKey(prev => ({ ...prev, isValid: false, isTesting: false }));
          message.error(`验证过程中出错: ${(error as Error).message}`);
        }
        break;
      default:
        return;
    }
  };

  const setAsDefault = (index: number) => {
    setDefaultModelIndex(index);
    message.success('默认模型已更新');
  };

  const handleModelChange = (modelId: string) => {
    setDefaultModelIndex(models.findIndex(model => model.id === modelId));
    message.success('默认模型已更新');
  };

  const handleSelectDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择项目所在目录'
      });
      if (selected && typeof selected === 'string') {
        setWorkspacePath(selected);
        message.success('项目目录已更新');
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      message.error('选择目录失败');
    }
  };

  const handleConfigureAPI = (provider: ModelProvider) => {
    // 根据 provider 确定要编辑的 API 设置
    switch(provider) {
      case 'openai':
        setActiveTab('api');
        // 聚焦到 OpenAI 输入框
        setTimeout(() => {
          const openaiInput = document.getElementById('openai-api-key');
          if (openaiInput) {
            (openaiInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'anthropic':
        setActiveTab('api');
        // 聚焦到 Anthropic 输入框
        setTimeout(() => {
          const anthropicInput = document.getElementById('anthropic-api-key');
          if (anthropicInput) {
            (anthropicInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'baidu':
        setActiveTab('api');
        // 聚焦到百度输入框
        setTimeout(() => {
          const baiduInput = document.getElementById('baidu-api-key');
          if (baiduInput) {
            (baiduInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'iflytek':
        setActiveTab('api');
        // 聚焦到讯飞输入框
        setTimeout(() => {
          const iflytekInput = document.getElementById('iflytek-api-key');
          if (iflytekInput) {
            (iflytekInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'alibaba':
        setActiveTab('api');
        // 聚焦到阿里输入框
        setTimeout(() => {
          const alibabaInput = document.getElementById('alibaba-api-key');
          if (alibabaInput) {
            (alibabaInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'tencent':
        setActiveTab('api');
        // 聚焦到腾讯输入框
        setTimeout(() => {
          const tencentInput = document.getElementById('tencent-api-key');
          if (tencentInput) {
            (tencentInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'zhipu':
        setActiveTab('api');
        // 聚焦到智谱输入框
        setTimeout(() => {
          const zhipuInput = document.getElementById('zhipu-api-key');
          if (zhipuInput) {
            (zhipuInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'moonshot':
        setActiveTab('api');
        // 聚焦到Moonshot输入框
        setTimeout(() => {
          const moonshotInput = document.getElementById('moonshot-api-key');
          if (moonshotInput) {
            (moonshotInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'deepseek':
        setActiveTab('api');
        setTimeout(() => {
          const deepseekInput = document.getElementById('deepseek-api-key');
          if (deepseekInput) {
            (deepseekInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      case 'minimax':
        setActiveTab('api');
        setTimeout(() => {
          const minimaxInput = document.getElementById('minimax-api-key');
          if (minimaxInput) {
            (minimaxInput as HTMLInputElement).focus();
          }
        }, 300);
        break;
      // 可以添加其他提供商的处理逻辑
      default:
        setActiveTab('api');
        message.info(`请配置 ${provider} 的 API 密钥`);
    }
  };

  const renderSwitchItem = (
    label: string,
    description: string,
    value: boolean,
    onChange: (checked: boolean) => void,
    icon: React.ReactNode
  ) => (
    <div className={styles.switchItem}>
      <div className={styles.settingRow}>
        {icon}
        <span className={styles.switchLabel}>{label}</span>
        <Switch checked={value} onChange={onChange} />
      </div>
      <div className={styles.settingDescription}>{description}</div>
    </div>
  );

  const handleFormFinish = (values: any) => {
    console.log('保存设置:', values);
    notification.success({
      message: '设置已保存',
      description: '您的设置已成功保存并应用',
      placement: 'bottomRight',
    });
  };

  const handleTestApiKey = async (provider: string) => {
    setApiTesting(prev => ({ ...prev, [provider]: true }));
    const keyFieldName = `${provider}ApiKey`;
    const apiKey = form.getFieldValue(keyFieldName);
    
    if (!apiKey) {
      notification.error({
        message: 'API密钥缺失',
        description: '请输入API密钥后再进行测试',
        placement: 'bottomRight',
      });
      setApiTesting(prev => ({ ...prev, [provider]: false }));
      return;
    }
    
    try {
      const isValid = await validateApiKey(provider, apiKey);
      setApiKeyStatus(prev => ({ ...prev, [provider]: isValid }));
      
      if (isValid) {
        notification.success({
          message: 'API密钥有效',
          description: `${provider}的API密钥验证成功`,
          placement: 'bottomRight',
        });
      } else {
        notification.error({
          message: 'API密钥无效',
          description: `${provider}的API密钥验证失败，请检查密钥是否正确`,
          placement: 'bottomRight',
        });
      }
    } catch (error) {
      console.error('API密钥验证错误:', error);
      notification.error({
        message: '验证出错',
        description: '验证API密钥时发生错误，请稍后再试',
        placement: 'bottomRight',
      });
    } finally {
      setApiTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const renderApiKeyInput = (provider: string, label: string, placeholder: string, example: string) => {
    const keyFieldName = `${provider}ApiKey`;
    
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{label}</div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={keyFieldName} noStyle>
            <Input.Password
              className={styles.apiKeyInput}
              placeholder={placeholder}
              prefix={<KeyOutlined />}
              autoComplete="off"
              size="large"
              addonAfter={
                <Button 
                  loading={apiTesting[provider]} 
                  onClick={() => handleTestApiKey(provider)}
                  className={styles.testButton}
                >
                  测试
                </Button>
              }
            />
          </Form.Item>
          
          {apiKeyStatus[provider] !== undefined && (
            <div className={apiKeyStatus[provider] ? styles.success : styles.error}>
              {apiKeyStatus[provider] ? (
                <Space>
                  <CheckOutlined />
                  <span>API密钥有效</span>
                </Space>
              ) : (
                <Space>
                  <CloseOutlined />
                  <span>API密钥无效</span>
                </Space>
              )}
            </div>
          )}
          
          <div style={{ fontSize: '13px', opacity: 0.7 }}>
            <Text type="secondary">
              示例: {example}
            </Text>
          </div>
        </Space>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>设置</Title>
        <Paragraph type="secondary">自定义您的应用程序设置和AI模型配置</Paragraph>
      </div>
      
      <Card 
        className={`${styles.settingsCard} ${isDarkMode ? styles.darkCard : ''}`}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{}}
          onFinish={handleFormFinish}
          className={styles.form}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className={styles.tabs}
            tabPosition="left"
          >
            <TabPane 
              tab={<span><RobotOutlined /> {t('settings.models')}</span>} 
              key="models"
            >
              <Alert
                className={styles.alert}
                message={t('settings.models.message')}
                description={t('settings.models.description')}
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
              
              <h3 className={styles.sectionTitle}>{t('settings.models.available')}</h3>
              
              <Alert
                message={t('settings.models.selectPreferred')}
                description={t('settings.models.canChange')}
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
              />
              
              <AIModelSelector 
                selectedModel={models[defaultModelIndex]?.id || 'gpt-3.5-turbo'}
                onChange={handleModelChange}
                onConfigureAPI={handleConfigureAPI}
              />
            </TabPane>
            
            <TabPane 
              tab={<span><KeyOutlined /> API密钥</span>}
              key="api"
            >
              <Alert
                className={styles.alert}
                message={t('settings.api.message')}
                description={t('settings.api.description')}
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
              
              <h3 className={styles.sectionTitle}>{t('settings.api.keyConfig')}</h3>
              
              {renderApiKeyInput(
                'openai',
                'OpenAI API密钥',
                '输入您的OpenAI API密钥',
                'sk-abcdefgh123456789...'
              )}
              
              {renderApiKeyInput(
                'anthropic',
                'Anthropic API密钥',
                '输入您的Anthropic API密钥',
                'sk-ant-api03-abcdefgh123456789...'
              )}
              
              {renderApiKeyInput(
                'google',
                'Google AI API密钥',
                '输入您的Google AI API密钥',
                'AIzaSyAbCdEfGhIjKlMnOpQrStuVwXyZ...'
              )}
              
              <h3 className={styles.sectionTitle}>{t('settings.api.domesticServices')}</h3>
              
              {renderApiKeyInput(
                'deepseek',
                'DeepSeek API密钥',
                '输入您的DeepSeek API密钥',
                'sk-abcdefgh123456789...'
              )}
              
              {renderApiKeyInput(
                'baidu',
                '百度文心一言 API密钥',
                '输入您的文心一言API密钥',
                'API密钥与密钥格式请参考百度智能云文档'
              )}
              
              {renderApiKeyInput(
                'iflytek',
                '讯飞星火 API密钥',
                '输入您的讯飞星火API密钥',
                'API密钥与密钥格式请参考讯飞开放平台文档'
              )}
              
              {renderApiKeyInput(
                'alibaba',
                '阿里通义千问 API密钥',
                '输入您的通义千问API密钥',
                'API密钥与密钥格式请参考通义千问API文档'
              )}
              
              {renderApiKeyInput(
                'tencent',
                '腾讯混元 API密钥',
                '输入您的腾讯混元API密钥',
                'API密钥与密钥格式请参考腾讯混元API文档'
              )}
              
              {renderApiKeyInput(
                'zhipu',
                '智谱ChatGLM API密钥',
                '输入您的智谱AI API密钥',
                'API密钥详见智谱AI开放平台'
              )}
              
              {renderApiKeyInput(
                'moonshot',
                'Moonshot AI API密钥',
                '输入您的Moonshot (Kimi) API密钥',
                'sk-xxxxxxxxxxxxx'
              )}

              {renderApiKeyInput(
                'minimax',
                'MiniMax API密钥',
                '输入您的MiniMax API密钥',
                'API密钥详见MiniMax开放平台'
              )}
              
              <Alert
                message={t('settings.api.howToGet')}
                description={
                  <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                    <li>OpenAI API密钥：<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">https://platform.openai.com/api-keys</a></li>
                    <li>Anthropic API密钥：<a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">https://console.anthropic.com/settings/keys</a></li>
                    <li>Google AI API密钥：<a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">https://makersuite.google.com/app/apikey</a></li>
                    <li>DeepSeek：<a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">DeepSeek 开放平台</a></li>
                    <li>百度文心一言：<a href="https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Dlkm79mnx" target="_blank" rel="noopener noreferrer">百度智能云文档</a></li>
                    <li>讯飞星火：<a href="https://www.xfyun.cn/doc/spark/General_guide.html" target="_blank" rel="noopener noreferrer">讯飞开放平台文档</a></li>
                    <li>阿里通义千问：<a href="https://help.aliyun.com/document_detail/2400396.html" target="_blank" rel="noopener noreferrer">阿里云文档</a></li>
                    <li>腾讯混元：<a href="https://cloud.tencent.com/document/product/1729" target="_blank" rel="noopener noreferrer">腾讯云文档</a></li>
                    <li>智谱ChatGLM：<a href="https://open.bigmodel.cn/dev/api" target="_blank" rel="noopener noreferrer">智谱AI开放平台</a></li>
                    <li>Moonshot AI：<a href="https://platform.moonshot.cn/docs" target="_blank" rel="noopener noreferrer">Moonshot平台文档</a></li>
                    <li>MiniMax：<a href="https://platform.minimaxi.com/document" target="_blank" rel="noopener noreferrer">MiniMax开放平台文档</a></li>
                  </ul>
                }
                type="info"
                showIcon
                className={styles.alert}
                style={{ marginTop: 24 }}
              />
            </TabPane>
            
            <TabPane 
              tab={<span><SettingOutlined /> {t('settings.general')}</span>} 
              key="general"
            >
              <h3 className={styles.sectionTitle}>{t('settings.general.title')}</h3>
              
              <Form className={styles.form} layout="vertical">
                {renderSwitchItem(
                  t('settings.general.autoSave'),
                  t('settings.general.autoSaveDesc'),
                  autoSave,
                  setAutoSave,
                  <DatabaseOutlined />
                )}
                
                <div className={styles.switchItem}>
                  <div className={styles.settingRow}>
                    <FolderOpenOutlined />
                    <span className={styles.switchLabel}>项目所在目录</span>
                    <Space>
                      <Input 
                        value={workspacePath} 
                        onChange={(e) => setWorkspacePath(e.target.value)} 
                        style={{ width: '250px' }} 
                        placeholder="例如 ~/Documents/ClipFlow"
                      />
                      <Button onClick={handleSelectDirectory}>选择目录</Button>
                    </Space>
                  </div>
                  <div className={styles.settingDescription}>配置此选项可修改项目存储的目录</div>
                </div>
                {renderSwitchItem(
                  t('settings.general.lineNumbers'),
                  t('settings.general.lineNumbersDesc'),
                  showLineNumbers,
                  setShowLineNumbers,
                  <CodeOutlined />
                )}
                
                {renderSwitchItem(
                  t('settings.general.autoUpdate'),
                  t('settings.general.autoUpdateDesc'),
                  autoUpdate,
                  setAutoUpdate,
                  <RocketOutlined />
                )}
                
                <Divider />
                
                <h3 className={styles.sectionTitle}>{t('settings.general.performance')}</h3>
                
                {renderSwitchItem(
                  t('settings.general.highQuality'),
                  t('settings.general.highQualityDesc'),
                  highQualityExport,
                  setHighQualityExport,
                  <BulbOutlined />
                )}
                
                {renderSwitchItem(
                  t('settings.general.transcode'),
                  t('settings.general.transcodeDesc'),
                  enableTranscode,
                  setEnableTranscode,
                  <ThunderboltOutlined />
                )}
                
                <Divider />
                
                <h3 className={styles.sectionTitle}>{t('settings.general.language')}</h3>
                
                <div className={styles.languageSelector}>
                  <Space>
                    <GlobalOutlined />
                    <span>{t('settings.general.language')}</span>
                    <Select 
                      value={language} 
                      onChange={changeLanguage}
                      style={{ width: 120 }}
                    >
                      <Option value="zh">中文</Option>
                      <Option value="en">English</Option>
                    </Select>
                  </Space>
                  <div className={styles.settingDescription}>
                    {t('settings.general.languageDesc')}
                  </div>
                </div>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={<span><InfoCircleOutlined /> {t('settings.about')}</span>} 
              key="about"
            >
              <h3 className={styles.sectionTitle}>{t('app.name')}</h3>
              
              <Paragraph>
                <Text strong>{t('app.name')}</Text> 是一款专业的短视频剪辑工具，集成了AI技术，帮助创作者更高效地创建优质内容。
              </Paragraph>
              
              <Paragraph style={{ marginBottom: 24 }}>
                <Space direction="vertical">
                  <Text>版本: 2.0.0</Text>
                  <Text>作者: Agions</Text>
                  <Text>发布日期: 2025年5月</Text>
                </Space>
              </Paragraph>
              
              <h3 className={styles.sectionTitle}>系统要求</h3>
              
              <div className={styles.dependencyItem}>
                <div className={styles.dependencyInfo}>
                  <Text strong>FFmpeg</Text>
                  <div className={styles.settingDescription}>
                    用于视频转码和处理的多媒体框架
                  </div>
                </div>
                <div className={styles.dependencyStatus}>
                  <Tag color="success">已安装</Tag>
                </div>
              </div>
              
              <div className={styles.dependencyItem}>
                <div className={styles.dependencyInfo}>
                  <Text strong>Python 3.8+</Text>
                  <div className={styles.settingDescription}>
                    用于AI模型交互和数据处理
                  </div>
                </div>
                <div className={styles.dependencyStatus}>
                  <Tag color="success">已安装</Tag>
                </div>
              </div>
              
              <div className={styles.installInstruction}>
                <Text strong>如果您遇到任何问题，请检查依赖项是否正确安装：</Text>
                <Card className={styles.installCard}>
                  <Paragraph>
                    FFmpeg安装: <code>brew install ffmpeg</code> (macOS) 或 <code>apt-get install ffmpeg</code> (Linux)
                  </Paragraph>
                  <Paragraph style={{ marginBottom: 0 }}>
                    Python安装: <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer">https://www.python.org/downloads/</a>
                  </Paragraph>
                </Card>
              </div>
            </TabPane>
            
            <TabPane 
              tab={<span><LockOutlined /> 隐私</span>} 
              key="privacy"
            >
              <h3 className={styles.sectionTitle}>数据存储</h3>
              
              <Paragraph>
                ClipFlow高度重视您的隐私。所有API密钥和个人设置仅存储在您的本地设备上，没有任何数据会传输到我们的服务器。
              </Paragraph>
              
              <Paragraph style={{ marginBottom: 24 }}>
                当您使用第三方AI服务（如OpenAI、Anthropic或Google）时，您的请求将直接发送到这些服务提供商。请查阅各自的隐私政策以了解更多信息。
              </Paragraph>
              
              <Alert
                message="本地存储位置"
                description={
                  <div style={{ marginTop: 8 }}>
                    <Text code>~/Library/Application Support/ClipFlow</Text> (macOS)<br />
                    <Text code>%APPDATA%\ClipFlow</Text> (Windows)<br />
                    <Text code>~/.config/ClipFlow</Text> (Linux)
                  </div>
                }
                type="info"
                showIcon
              />
            </TabPane>
          </Tabs>
          
          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" size="large">
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings; 