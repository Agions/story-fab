import React from 'react';
import { Card, Tag, Tooltip, Badge } from 'antd';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RobotOutlined, CheckCircleFilled, WarningOutlined, ApiOutlined, SettingOutlined, LinkOutlined } from '@ant-design/icons';
import { AIModelType, AI_MODEL_INFO } from '@/types';
import { useModelStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import styles from './ModelCard.module.less';

const Text = ({ children, type, className }: { children: React.ReactNode; type?: string; className?: string }) => (
  <span className={className || (type ? `text-${type}` : undefined)}>{children}</span>
);

const Title = ({ level = 4, children, className }: { level?: number; children: React.ReactNode; className?: string }) => {
  const Tag = level === 4 ? 'h4' : 'h3';
  return <Tag className={className}>{children}</Tag>;
};

// API密钥申请链接
const API_LINKS: Partial<Record<AIModelType, string>> = {
  openai: 'https://platform.openai.com/docs/quickstart',
  anthropic: 'https://docs.anthropic.com/en/api/getting-started',
  google: 'https://ai.google.dev/gemini-api/docs/api-key',
  alibaba: 'https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key',
  zhipu: 'https://open.bigmodel.cn/dev/api#apikey',
  iflytek: 'https://www.xfyun.cn/doc/spark/Guide.html',
  deepseek: 'https://platform.deepseek.com/api',
  moonshot: 'https://platform.moonshot.cn/docs'
};

interface ModelCardProps {
  modelType: AIModelType;
  onSelect: (modelType: AIModelType) => void;
  onRequestApiKey?: (modelType: AIModelType) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ 
  modelType, 
  onSelect,
  onRequestApiKey
}) => {
  const { aiModelsSettings, selectedAIModel } = useModelStore();
  const navigate = useNavigate();
  const modelInfo = AI_MODEL_INFO[modelType];
  const isEnabled = aiModelsSettings[modelType]?.enabled;
  const isSelected = selectedAIModel === modelType;
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  // 处理选择模型
  const handleSelect = () => {
    if (isEnabled) {
      onSelect(modelType);
    } else {
      navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
    }
  };
  
  // 处理跳转到设置页面
  const handleGoToSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
  };
  
  // 处理申请API密钥
  const handleRequestApiKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestApiKey?.(modelType);
    setIsModalVisible(true);
  };

  // 处理直接跳转到API密钥申请页面
  const handleGoToApiPage = () => {
    const link = API_LINKS[modelType] ?? '/settings';
    window.open(link, '_blank');
    setIsModalVisible(false);
  };

  return (
    <>
      <Card 
        className={`${styles.modelCard} ${isSelected ? styles.selected : ''} ${isEnabled ? '' : styles.disabled}`}
        hoverable
        onClick={handleSelect}
      >
        <div className={styles.modelIcon}>
          <Badge 
            dot 
            color={isEnabled ? (isSelected ? "blue" : "green") : "red"}
            offset={[-5, 5]}
          >
            <RobotOutlined style={{ fontSize: 28 }} />
          </Badge>
        </div>
        
        <div className={styles.modelInfo}>
          <Title level={4} className={styles.modelName}>
            {modelInfo.name}
            {isEnabled && isSelected && (
              <CheckCircleFilled className={styles.selectedIcon} />
            )}
          </Title>
          
          <Text type="secondary" className={styles.modelProvider}>
            {modelInfo.provider}
          </Text>
          
          <div className={styles.modelStatus}>
            {isEnabled ? (
              <Tag color="success" icon={<CheckCircleFilled />}>已配置</Tag>
            ) : (
              <Tag color="warning" icon={<WarningOutlined />}>未配置</Tag>
            )}
            {isSelected && (
              <Tag color="processing">当前默认</Tag>
            )}
          </div>
          
          <div className={styles.modelActions}>
            {isEnabled ? (
              <div className="flex items-center gap-2">
                <Button 
                  className={isSelected ? "bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white" : ""}
                  size="sm"
                  onClick={handleSelect}
                >
                  {isSelected ? '当前默认' : '设为默认'}
                </Button>
                <Tooltip title="管理模型设置">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleGoToSettings}
                    aria-label="管理模型设置"
                  >
                    <SettingOutlined />
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white"
                  size="sm"
                  onClick={handleGoToSettings}
                >
                  去配置
                </Button>
                <Button 
                  variant="link"
                  size="sm"
                  onClick={handleRequestApiKey}
                  className={styles.applyKeyButton}
                >
                  申请密钥
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
        <DialogContent className={styles.applyModal} style={{ width: 400 }}>
          <h3 className="mb-4 text-lg font-semibold">申请{modelInfo.name} API密钥</h3>
          <div className={styles.applyOptions}>
            <Button 
              className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white h-12"
              onClick={handleGoToApiPage}
            >
              <LinkOutlined className="mr-2" />
              前往{modelInfo.provider}官网申请API密钥
            </Button>
            
            <div className={styles.dividerText}>或者</div>
            
            <Button
              className="h-12"
              onClick={() => {
                setIsModalVisible(false);
                navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
              }}
            >
              <SettingOutlined className="mr-2" />
              直接配置API密钥
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModelCard;
