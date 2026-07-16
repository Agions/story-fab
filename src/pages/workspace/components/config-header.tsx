/**
 * 配置卡片头部 — 齿轮图标 + 标题
 */
import React from 'react';
import { Settings } from 'lucide-react';
import styles from './../edit-step/script-writing.module.less';

const ConfigHeader: React.FC = () => {
  return (
    <div className={styles.configHeader}>
      <Settings className={styles.configHeaderIcon} size={20} />
      <h3 className={styles.configTitle}>功能配置</h3>
    </div>
  );
};

export default ConfigHeader;
