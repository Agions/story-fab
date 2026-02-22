import React from 'react';
import { Card, Button, Tag, Space, Typography, Tooltip, Badge, Modal } from 'antd';
import { RobotOutlined, CheckCircleFilled, WarningOutlined, ApiOutlined, SettingOutlined, ExportOutlined, LinkOutlined } from '@ant-design/icons';
import { AIModelType, AI_MODEL_INFO } from '@/types';
import { useStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import styles from './ModelCard.module.less';

// API密钥申请链接
const API_LINKS = {
  wenxin: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu',
  qianwen: 'https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key',
  spark: 'https://www.xfyun.cn/doc/spark/Guide.html',
  chatglm: 'https://open.bigmodel.cn/dev/api#apikey',
  doubao: 'https://www.doubao.com/docs/api/',
  deepseek: 'https://platform.deepseek.com/api'
};

const { Text, Title } = Typography;

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
  const { aiModelsSettings, selectedAIModel } = useStore();
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
    // 显示申请选项模态框
    setIsModalVisible(true);
  };

  // 处理直接跳转到API密钥申请页面
  const handleGoToApiPage = () => {
    window.open(API_LINKS[modelType], '_blank');
    setIsModalVisible(false);
  };

  // 渲染申请选项模态框
  const renderApplyModal = () => (
    <Modal
      title={`申请${modelInfo.name} API密钥`}
      open={isModalVisible}
      onCancel={() => setIsModalVisible(false)}
      footer={null}
      width={400}
      centered
      className={styles.applyModal}
    >
      <div className={styles.applyOptions}>
        <Button 
          type="primary" 
          icon={<LinkOutlined />} 
          block 
          size="large"
          onClick={handleGoToApiPage}
          className={styles.applyButton}
        >
          前往{modelInfo.provider}官网申请API密钥
        </Button>
        
        <div className={styles.dividerText}>或者</div>
        
        <Button
          block
          size="large"
          icon={<SettingOutlined />}
          onClick={() => {
            setIsModalVisible(false);
            navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
          }}
          className={styles.applyButton}
        >
          直接配置API密钥
        </Button>
      </div>
    </Modal>
  );
  
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
              <Space>
                <Button 
                  type={isSelected ? "primary" : "default"}
                  size="small"
                  onClick={handleSelect}
                >
                  {isSelected ? '当前默认' : '设为默认'}
                </Button>
                <Tooltip title="管理模型设置">
                  <Button
                    type="text"
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={handleGoToSettings}
                  />
                </Tooltip>
              </Space>
            ) : (
              <Space>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={handleGoToSettings}
                >
                  去配置
                </Button>
                <Button 
                  type="link" 
                  size="small"
                  icon={<ApiOutlined />}
                  onClick={handleRequestApiKey}
                  className={styles.applyKeyButton}
                >
                  申请密钥
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Card>
      {renderApplyModal()}
    </>
  );
};

export default ModelCard; 