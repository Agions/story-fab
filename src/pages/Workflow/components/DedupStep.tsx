import React, { memo } from 'react';
import { Card, Row, Col, Alert, Typography } from 'antd';
import type { WorkflowData } from '@/core/services/workflow';
import styles from '../index.module.less';

const { Title, Text, Paragraph } = Typography;

interface DedupStepProps {
  data: WorkflowData;
}

const DedupStep: React.FC<DedupStepProps> = ({ data }) => {
  const { originalityReport, uniquenessReport } = data;

  if (!originalityReport) {
    return (
      <Card title="原创性检测" className={styles.stepCard}>
        <div className={styles.loadingArea}>
          <Text>正在检测原创性...</Text>
        </div>
      </Card>
    );
  }

  const getScoreClass = (score: number) => {
    if (score >= 80) return styles.scoreHigh;
    if (score >= 60) return styles.scoreMedium;
    return styles.scoreLow;
  };

  return (
    <Card title="原创性检测" className={styles.stepCard}>
      <div className={styles.dedupResult}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small" title="原创性分数">
              <div className={styles.scoreDisplay}>
                <Text className={getScoreClass(originalityReport.score)}>
                  {originalityReport.score}分
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="重复段落">
              <Text strong>{originalityReport.duplicates.length}</Text>
              <Text> 处</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="建议">
              <Text strong>{originalityReport.suggestions.length}</Text>
              <Text> 条</Text>
            </Card>
          </Col>
        </Row>

        {originalityReport.duplicates.length > 0 && (
          <div className={styles.duplicateList}>
            <Title level={5}>重复内容</Title>
            {originalityReport.duplicates.map((dup: any, index: number) => (
              <Alert
                key={dup.id}
                message={`重复 #${index + 1} - ${
                  dup.type === 'exact'
                    ? '完全重复'
                    : dup.type === 'similar'
                    ? '相似内容'
                    : '模板套话'
                }`}
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }}>
                      <Text type="secondary">原文：</Text>
                      {dup.target.content}
                    </Paragraph>
                    <Text type="warning">{dup.suggestion}</Text>
                  </div>
                }
                type={
                  dup.type === 'exact'
                    ? 'error'
                    : dup.type === 'similar'
                    ? 'warning'
                    : 'info'
                }
                showIcon
                className={styles.duplicateAlert}
              />
            ))}
          </div>
        )}

        {uniquenessReport && (
          <div className={styles.uniquenessReport}>
            <Title level={5}>唯一性检测</Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <div>
                    <Text>唯一性状态：</Text>
                    <Text
                      strong
                      className={
                        uniquenessReport.check.isUnique ? styles.unique : styles.notUnique
                      }
                    >
                      {uniquenessReport.check.isUnique ? '✅ 唯一' : '⚠️ 需优化'}
                    </Text>
                  </div>
                  <div>
                    <Text>历史相似度：</Text>
                    <Text strong>
                      {(uniquenessReport.check.similarity * 100).toFixed(1)}%
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="历史记录">
                  <div>
                    <Text>总脚本数：</Text>
                    <Text strong>{uniquenessReport.history.totalScripts}</Text>
                  </div>
                  <div>
                    <Text>近7天：</Text>
                    <Text strong>{uniquenessReport.history.recentScripts}</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </div>
    </Card>
  );
};

export default memo(DedupStep);
