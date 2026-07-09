/**
 * 功能特点标签列表
 */
import React from 'react';
import styles from './../../edit-step/script-writing.module.less';

interface FunctionFeaturesProps {
  features: string[];
}

const FunctionFeatures: React.FC<FunctionFeaturesProps> = ({ features }) => {
  return (
    <div className={styles.featuresSection}>
      <span className={styles.featuresLabel}>功能特点</span>
      <div className={styles.featureTags}>
        {features.map((f, i) => (
          <span key={i} className={styles.featureTag}>
            ✓ {f}
          </span>
        ))}
      </div>
    </div>
  );
};

export default FunctionFeatures;
