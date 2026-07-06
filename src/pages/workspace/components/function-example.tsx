/**
 * 示例文案展示
 */
import React from 'react';
import styles from '././../script-writing.module.less';

interface FunctionExampleProps {
  example: string;
}

const FunctionExample: React.FC<FunctionExampleProps> = ({ example }) => {
  return (
    <div className={styles.exampleSection}>
      <span className={styles.exampleLabel}>文案示例</span>
      <p className={styles.exampleText}>"{example}..."</p>
    </div>
  );
};

export default FunctionExample;
