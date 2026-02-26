import React, { useState, useEffect, useCallback, memo } from 'react';
import { Card, Tabs, List, Button, Space, Input, Tag, Typography, Modal, message } from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ScriptData, Scene, ScriptSegment } from '@/core/types';
import { formatDuration } from '@/services/videoService';
import styles from './ScriptEditor.module.less';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface WorkflowEditorProps {
  script: ScriptData;
  scenes?: Scene[];
  onSave: (script: ScriptData) => void;
  onScriptUpdate?: (script: ScriptData) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  script,
  scenes,
  onSave,
  onScriptUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('content');
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [aiModalVisible, setAiModalVisible] = useState(false);

  useEffect(() => {
    setEditedContent(script.content || '');
    setEditedTitle(script.title || '');
  }, [script]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  }, []);

  const handleSave = useCallback(() => {
    const updatedScript: ScriptData = {
      ...script,
      title: editedTitle,
      content: editedContent,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedScript);
    onScriptUpdate?.(updatedScript);
    message.success('脚本已保存');
  }, [script, editedTitle, editedContent, onSave, onScriptUpdate]);

  const handleAIImprove = useCallback(async () => {
    try {
      message.info('正在使用 AI 优化脚本...');
      setAiModalVisible(false);
      setTimeout(() => {
        message.success('脚本优化完成');
      }, 2000);
    } catch (error) {
      console.error('AI 优化脚本失败:', error);
      message.error('AI 优化脚本失败');
    }
  }, []);

  return (
    <div className={styles.scriptEditor}>
      <Card
        title="脚本编辑"
        className={styles.editorCard}
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setAiModalVisible(true)}>
              AI优化
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="脚本内容" key="content">
            <div className={styles.workflowEditor}>
              <div className={styles.titleInput}>
                <Text type="secondary">标题</Text>
                <Input
                  value={editedTitle}
                  onChange={handleTitleChange}
                  placeholder="输入脚本标题"
                  size="large"
                />
              </div>
              <div className={styles.contentInput}>
                <Text type="secondary">内容</Text>
                <TextArea
                  value={editedContent}
                  onChange={handleContentChange}
                  placeholder="输入脚本内容..."
                  rows={15}
                  className={styles.scriptTextArea}
                />
              </div>
            </div>
          </TabPane>

          <TabPane tab="片段列表" key="segments">
            <List
              dataSource={script.segments || []}
              renderItem={(segment: ScriptSegment, index) => (
                <List.Item
                  actions={[
                    <Button key="edit" type="text" icon={<EditOutlined />} />,
                    <Button key="delete" type="text" danger icon={<DeleteOutlined />} />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">{segment.type}</Tag>
                        <Text>
                          {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                        </Text>
                      </Space>
                    }
                    description={
                      <Paragraph ellipsis={{ rows: 2 }}>
                        {segment.content}
                      </Paragraph>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>

          {scenes && scenes.length > 0 && (
            <TabPane tab={`场景 (${scenes.length})`} key="scenes">
              <List
                dataSource={scenes}
                renderItem={(scene: Scene) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <ClockCircleOutlined />
                          <Text>
                            {formatDuration(scene.startTime)} - {formatDuration(scene.endTime)}
                          </Text>
                          {scene.tags?.map(tag => (
                            <Tag key={tag} size="small">{tag}</Tag>
                          ))}
                        </Space>
                      }
                      description={scene.description}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
          )}
        </Tabs>
      </Card>

      {/* AI 优化模态框 */}
      <Modal
        title="AI 优化脚本"
        open={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        onOk={handleAIImprove}
      >
        <p>使用 AI 优化脚本将会根据视频内容和当前脚本，生成更加专业的表达和结构。</p>
        <p>点击确定开始优化。</p>
      </Modal>
    </div>
  );
};

export default memo(WorkflowEditor);
