import React, { useState } from 'react';
import { Modal, Form, Input, Button, Select, Radio, Alert, Checkbox, Space, Typography } from 'antd';
import { KeyOutlined, UserOutlined, MailOutlined, BankOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { AI_MODEL_INFO, AIModelType } from '@/types';
import styles from './ApiKeyRequest.module.less';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Link } = Typography;

interface ApiKeyRequestProps {
  visible: boolean;
  onClose: () => void;
  modelType?: AIModelType;
}

const ApiKeyRequest: React.FC<ApiKeyRequestProps> = ({
  visible,
  onClose,
  modelType = 'wenxin'
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState<AIModelType>(modelType);
  
  // 获取当前选择的模型信息
  const modelInfo = AI_MODEL_INFO[selectedType];
  
  // 处理提交
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);
      
      // 模拟提交处理
      setTimeout(() => {
        setSubmitting(false);
        setSubmitted(true);
      }, 1000);
    } catch {
      console.error('表单验证失败:', error);
    }
  };
  
  // 处理关闭
  const handleClose = () => {
    form.resetFields();
    setSubmitted(false);
    onClose();
  };
  
  // 处理模型类型变更
  const handleModelTypeChange = (value: AIModelType) => {
    setSelectedType(value);
  };
  
  const renderApiRequestForm = () => (
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
    >
      <Form.Item
        name="modelType"
        label="选择模型提供商"
        initialValue={selectedType}
        rules={[{ required: true, message: '请选择模型提供商' }]}
      >
        <Select onChange={(value) => handleModelTypeChange(value as AIModelType)}>
          {Object.entries(AI_MODEL_INFO).map(([key, model]) => (
            <Option key={key} value={key}>
              <Space>
                <KeyOutlined />
                <span>{model.name}</span>
                <Text type="secondary">({model.provider})</Text>
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>
      
      <Alert
        message={`${modelInfo.name}申请说明`}
        description={`您即将申请${modelInfo.provider}提供的${modelInfo.name}的API访问权限。请填写以下信息，我们将帮助您提交申请。`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Form.Item
        name="name"
        label="姓名"
        rules={[{ required: true, message: '请输入您的姓名' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="请输入您的姓名" />
      </Form.Item>
      
      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          { required: true, message: '请输入您的邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="请输入您的邮箱" />
      </Form.Item>
      
      <Form.Item
        name="organization"
        label="公司/组织"
      >
        <Input prefix={<BankOutlined />} placeholder="请输入您的公司或组织名称(选填)" />
      </Form.Item>
      
      <Form.Item
        name="region"
        label="所在地区"
        rules={[{ required: true, message: '请选择您的所在地区' }]}
      >
        <Select
          placeholder="请选择所在地区"
          showSearch
          prefix={<EnvironmentOutlined />}
        >
          <Option value="beijing">北京市</Option>
          <Option value="shanghai">上海市</Option>
          <Option value="guangdong">广东省</Option>
          <Option value="jiangsu">江苏省</Option>
          <Option value="zhejiang">浙江省</Option>
          <Option value="other">其他地区</Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        name="usage"
        label="使用场景"
        rules={[{ required: true, message: '请选择您的使用场景' }]}
      >
        <Radio.Group>
          <Space direction="vertical">
            <Radio value="personal">个人学习和研究</Radio>
            <Radio value="business">商业项目开发</Radio>
            <Radio value="education">教育和培训</Radio>
            <Radio value="other">其他用途</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
      
      <Form.Item
        name="description"
        label="使用说明"
        rules={[{ required: true, message: '请简要描述您的使用需求' }]}
      >
        <TextArea
          placeholder="请简要描述您打算如何使用API，包括预期的调用频率和用途等"
          rows={4}
        />
      </Form.Item>
      
      <Form.Item
        name="agreement"
        valuePropName="checked"
        rules={[
          { 
            validator: (_, value) => 
              value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意服务条款')) 
          }
        ]}
      >
        <Checkbox>
          我已阅读并同意{modelInfo.provider}的<Link href="#" target="_blank">服务条款</Link>和<Link href="#" target="_blank">隐私政策</Link>
        </Checkbox>
      </Form.Item>
    </Form>
  );
  
  const renderSuccessContent = () => (
    <div className={styles.successContent}>
      <Alert
        message="申请已提交"
        description={`您的${modelInfo.name}API密钥申请已成功提交，我们将尽快审核并通过邮件通知您。审核通常需要1-3个工作日，请耐心等待。`}
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <div className={styles.nextSteps}>
        <Text strong>接下来您可以：</Text>
        <ul>
          <li>访问{modelInfo.provider}官方网站了解更多API使用信息</li>
          <li>查看我们的开发文档，了解如何集成API</li>
          <li>准备好您的账户信息，以便审核通过后立即使用</li>
        </ul>
      </div>
      
      <div className={styles.contact}>
        <Text type="secondary">
          如有任何问题，请发送邮件至 <Link href="mailto:support@ClipFlow.com">support@ClipFlow.com</Link> 获取帮助
        </Text>
      </div>
    </div>
  );
  
  return (
    <Modal
      title={submitted ? "申请已提交" : `申请${modelInfo.name}API密钥`}
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          {submitted ? '关闭' : '取消'}
        </Button>,
        !submitted && (
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
          >
            提交申请
          </Button>
        )
      ]}
      width={600}
      destroyOnClose
      className={styles.apiKeyRequestModal}
    >
      {submitted ? renderSuccessContent() : renderApiRequestForm()}
    </Modal>
  );
};

export default ApiKeyRequest; 