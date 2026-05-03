import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Bot, CheckCircle, AlertTriangle, Settings, ExternalLink } from 'lucide-react';
import { AIModelType, AI_MODEL_INFO } from '@/types';
import { useModelStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import styles from '@/components/Home/ModelCard.module.less';

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

  const handleSelect = () => {
    if (isEnabled) {
      onSelect(modelType);
    } else {
      navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
    }
  };

  const handleGoToSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
  };

  const handleRequestApiKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestApiKey?.(modelType);
    setIsModalVisible(true);
  };

  const handleGoToApiPage = () => {
    const link = API_LINKS[modelType] ?? '/settings';
    window.open(link, '_blank');
    setIsModalVisible(false);
  };

  return (
    <>
      <Card
        className={`${styles.modelCard} ${isSelected ? styles.selected : ''} ${isEnabled ? '' : styles.disabled} cursor-pointer`}
        onClick={handleSelect}
      >
        <div className={styles.modelIcon}>
          <div className="relative inline-block">
            <Bot size={28} />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background ${
              isEnabled ? (isSelected ? 'bg-blue-500' : 'bg-green-500') : 'bg-red-500'
            }`} />
          </div>
        </div>

        <div className={styles.modelInfo}>
          <h4 className={styles.modelName}>
            {modelInfo.name}
            {isEnabled && isSelected && (
              <CheckCircle size={14} className={`${styles.selectedIcon} ml-1 text-blue-500`} />
            )}
          </h4>

          <span className={`${styles.modelProvider} text-xs text-muted-foreground`}>
            {modelInfo.provider}
          </span>

          <div className={styles.modelStatus}>
            {isEnabled ? (
              <Badge variant="default" className="text-xs bg-green-600/20 text-green-600 border-green-600/40">
                <CheckCircle size={10} className="mr-1" />已配置
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle size={10} className="mr-1" />未配置
              </Badge>
            )}
            {isSelected && (
              <Badge variant="default" className="text-xs bg-blue-500/20 text-blue-500 border-blue-500/40">当前默认</Badge>
            )}
          </div>

          <div className={styles.modelActions}>
            {isEnabled ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleSelect(); }}
                  className={isSelected ? 'bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white' : ''}
                >
                  {isSelected ? '当前默认' : '设为默认'}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleGoToSettings(e); }}
                    >
                      <Settings size={14} />
                    </TooltipTrigger>
                    <TooltipContent>管理模型设置</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white"
                  onClick={(e) => { e.stopPropagation(); handleGoToSettings(e as unknown as React.MouseEvent); }}
                >
                  去配置
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleRequestApiKey(e as unknown as React.MouseEvent); }}
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
          <DialogHeader>
            <DialogTitle>申请{modelInfo.name} API密钥</DialogTitle>
          </DialogHeader>
          <div className={styles.applyOptions}>
            <Button
              className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white h-12"
              onClick={handleGoToApiPage}
            >
              <ExternalLink size={14} className="mr-2" />
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
              <Settings size={14} className="mr-2" />
              直接配置API密钥
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModelCard;
