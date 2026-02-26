import React, { memo } from 'react';
import { Modal } from 'antd';

interface AIModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const AIModal: React.FC<AIModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      title="AI 优化脚本"
      open={visible}
      onCancel={onClose}
      onOk={onConfirm}
    >
      <p>使用 AI 优化脚本将会根据视频内容和当前脚本，生成更加专业的表达和结构。</p>
      <p>点击确定开始优化。</p>
    </Modal>
  );
};

export default memo(AIModal);
