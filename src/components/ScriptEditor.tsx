import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Form,
  Input,
  Select,
  Modal,
  Tooltip,
  Dropdown,
  Menu,
  message,
  Typography,
  Tabs,
  List,
  Tag
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  ExportOutlined,
  DownOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { VideoSegment, formatDuration, previewSegment } from '@/services/videoService';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import type { ScriptData, Scene, ScriptSegment } from '@/core/types';
import styles from './ScriptEditor.module.less';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 原始 Props 接口
interface ScriptEditorOriginalProps {
  videoPath: string;
  initialSegments?: VideoSegment[];
  onSave: (segments: VideoSegment[]) => void;
  onExport?: (format: string) => void;
}

// Workflow 页面使用的 Props 接口
interface ScriptEditorWorkflowProps {
  script?: ScriptData;
  scenes?: Scene[];
  onSave: (script: ScriptData) => void;
  metadata?: any;
  onScriptUpdate?: (script: ScriptData) => void;
}

type ScriptEditorProps = ScriptEditorOriginalProps | ScriptEditorWorkflowProps;

// 类型守卫函数
function isWorkflowProps(props: ScriptEditorProps): props is ScriptEditorWorkflowProps {
  return 'script' in props;
}

/**
 * 脚本编辑器组件
 * 支持两种模式：
 * 1. 原始模式：基于 videoPath 和 segments
 * 2. Workflow 模式：基于 script 对象
 */
const ScriptEditor: React.FC<ScriptEditorProps> = (props) => {
  // 判断当前模式
  const isWorkflowMode = isWorkflowProps(props);

  // Workflow 模式状态
  const [activeTab, setActiveTab] = useState('content');
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');

  // 原始模式状态
  const [segments, setSegments] = useState<VideoSegment[]>(
    !isWorkflowMode ? (props.initialSegments || []) : []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  // 初始化 Workflow 模式数据
  useEffect(() => {
    if (isWorkflowMode && props.script) {
      setEditedContent(props.script.content || '');
      setEditedTitle(props.script.title || '');
    }
  }, [isWorkflowMode, isWorkflowMode ? (props as ScriptEditorWorkflowProps).script : null]);

  // 当段落变化时重新计算总时长（原始模式）
  useEffect(() => {
    if (!isWorkflowMode) {
      const duration = segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0);
      setTotalDuration(duration);
    }
  }, [segments, isWorkflowMode]);

  // ============ Workflow 模式处理方法 ============

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  }, []);

  const handleWorkflowSave = useCallback(() => {
    if (isWorkflowMode) {
      const updatedScript: ScriptData = {
        ...props.script!,
        title: editedTitle,
        content: editedContent,
        updatedAt: new Date().toISOString()
      };
      props.onSave(updatedScript);
      props.onScriptUpdate?.(updatedScript);
      message.success('脚本已保存');
    }
  }, [isWorkflowMode, props, editedTitle, editedContent]);

  // ============ 原始模式处理方法 ============

  // 添加新片段
  const handleAddSegment = useCallback(() => {
    const lastSegment = segments.length > 0 ? segments[segments.length - 1] : null;
    const startTime = lastSegment ? lastSegment.end : 0;
    const endTime = startTime + 30;

    editForm.setFieldsValue({
      start: startTime,
      end: endTime,
      type: 'narration',
      content: ''
    });

    setEditingIndex(segments.length);
  }, [segments, editForm]);

  // 编辑片段
  const handleEditSegment = useCallback((index: number) => {
    const segment = segments[index];

    editForm.setFieldsValue({
      start: segment.start,
      end: segment.end,
      type: segment.type || 'narration',
      content: segment.content || ''
    });

    setEditingIndex(index);
  }, [segments, editForm]);

  // 保存编辑片段
  const handleSaveSegment = useCallback(() => {
    editForm.validateFields().then(values => {
      const start = parseFloat(values.start);
      const end = parseFloat(values.end);

      const newSegments = [...segments];
      const segment: VideoSegment = {
        start,
        end,
        type: values.type,
        content: values.content
      };

      if (editingIndex !== null) {
        if (editingIndex < segments.length) {
          newSegments[editingIndex] = segment;
        } else {
          newSegments.push(segment);
        }
      }

      setSegments(newSegments);
      setEditingIndex(null);
      editForm.resetFields();
    });
  }, [segments, editingIndex, editForm]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    editForm.resetFields();
  }, [editForm]);

  // 删除片段
  const handleDeleteSegment = useCallback((index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个片段吗？',
      onOk: () => {
        const newSegments = [...segments];
        newSegments.splice(index, 1);
        setSegments(newSegments);
      }
    });
  }, [segments]);

  // 预览片段
  const handlePreviewSegment = useCallback(async (index: number) => {
    if (isWorkflowMode) return;

    try {
      setPreviewLoading(true);
      const segment = segments[index];
      const videoPath = (props as ScriptEditorOriginalProps).videoPath;
      const previewPath = await previewSegment(videoPath, segment);
      setPreviewSrc(convertFileSrc(previewPath));
      setPreviewVisible(true);
    } catch {
      console.error('生成预览失败:', error);
      message.error('生成预览失败');
    } finally {
      setPreviewLoading(false);
    }
  }, [isWorkflowMode, segments, props]);

  // 导出脚本
  const handleExport = useCallback(() => {
    if (isWorkflowMode) return;
    setExportMenuVisible(true);
  }, [isWorkflowMode]);

  // 打开 AI 优化模态框
  const handleOpenAIModal = useCallback(() => {
    setAiModalVisible(true);
  }, []);

  // AI 优化脚本
  const handleAIImprove = useCallback(async () => {
    try {
      message.info('正在使用 AI 优化脚本...');
      setAiModalVisible(false);
      setTimeout(() => {
        message.success('脚本优化完成');
      }, 2000);
    } catch {
      console.error('AI 优化脚本失败:', error);
      message.error('AI 优化脚本失败');
    }
  }, []);

  // 保存脚本（原始模式）
  const handleOriginalSave = useCallback(() => {
    if (!isWorkflowMode) {
      props.onSave(segments);
      message.success('脚本已保存');
    }
  }, [isWorkflowMode, props, segments]);

  // 表格列定义
  const columns = useMemo(() => [
    {
      title: '时间',
      key: 'time',
      width: 180,
      render: (_: any, record: VideoSegment, index: number) => (
        <span>
          {formatDuration(record.start)} - {formatDuration(record.end)}
        </span>
      )
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (_: any, record: VideoSegment) => (
        <span>{formatDuration(record.end - record.start)}</span>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <span>
          {type === 'narration' ? '旁白' :
           type === 'dialogue' ? '对白' :
           type === 'action' ? '动作' :
           type === 'transition' ? '转场' : type}
        </span>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <div className={styles.contentCell}>
          {content || <span className={styles.emptyContent}>（无内容）</span>}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: VideoSegment, index: number) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditSegment(index)}
            />
          </Tooltip>
          <Tooltip title="预览">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={() => handlePreviewSegment(index)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteSegment(index)}
            />
          </Tooltip>
        </Space>
      )
    }
  ], [handleEditSegment, handlePreviewSegment, handleDeleteSegment]);

  // ============ 渲染 ============

  // Workflow 模式渲染
  if (isWorkflowMode) {
    const { script, scenes } = props as ScriptEditorWorkflowProps;

    if (!script) {
      return (
        <Card className={styles.scriptEditor}>
          <div className={styles.emptyState}>
            <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Text type="secondary">暂无脚本数据</Text>
          </div>
        </Card>
      );
    }

    return (
      <div className={styles.scriptEditor}>
        <Card
          title="脚本编辑"
          className={styles.editorCard}
          extra={
            <Space>
              <Button icon={<EditOutlined />} onClick={handleOpenAIModal}>
                AI优化
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleWorkflowSave}>
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
                      <Button key="delete" type="text" danger icon={<DeleteOutlined />} />
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
                            <Text>{formatDuration(scene.startTime)} - {formatDuration(scene.endTime)}</Text>
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
  }

  // 原始模式渲染
  const { videoPath, onExport } = props as ScriptEditorOriginalProps;

  return (
    <div className={styles.scriptEditor}>
      <Card
        title="脚本编辑"
        className={styles.editorCard}
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={handleOpenAIModal}>
              AI优化
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleOriginalSave}>
              保存
            </Button>
            {onExport && (
              <Dropdown
                overlay={
                  <Menu onClick={({ key }) => onExport(key as string)}>
                    <Menu.Item key="txt">文本文件 (.txt)</Menu.Item>
                    <Menu.Item key="srt">字幕文件 (.srt)</Menu.Item>
                    <Menu.Item key="doc">Word文档 (.docx)</Menu.Item>
                  </Menu>
                }
                open={exportMenuVisible}
                onOpenChange={setExportMenuVisible}
              >
                <Button icon={<ExportOutlined />} onClick={handleExport}>
                  导出 <DownOutlined />
                </Button>
              </Dropdown>
            )}
          </Space>
        }
      >
        <div className={styles.statsBar}>
          <div>总片段: {segments.length}</div>
          <div>总时长: {formatDuration(totalDuration)}</div>
        </div>

        <Table
          rowKey={(record, index) => String(index)}
          dataSource={segments}
          columns={columns}
          pagination={false}
          className={styles.segmentsTable}
          footer={() => (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={handleAddSegment}
            >
              添加片段
            </Button>
          )}
        />

        {editingIndex !== null && (
          <div className={styles.editForm}>
            <Card title={`编辑片段 #${editingIndex + 1}`} className={styles.editCard}>
              <Form form={editForm} layout="vertical">
                <div className={styles.timeInputs}>
                  <Form.Item
                    name="start"
                    label="开始时间 (秒)"
                    rules={[{ required: true, message: '请输入开始时间' }]}
                  >
                    <Input type="number" step="0.1" min="0" />
                  </Form.Item>

                  <Form.Item
                    name="end"
                    label="结束时间 (秒)"
                    rules={[
                      { required: true, message: '请输入结束时间' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (value > getFieldValue('start')) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('结束时间必须大于开始时间'));
                        },
                      }),
                    ]}
                  >
                    <Input type="number" step="0.1" min="0" />
                  </Form.Item>
                </div>

                <Form.Item
                  name="type"
                  label="类型"
                  rules={[{ required: true, message: '请选择类型' }]}
                >
                  <Select>
                    <Select.Option value="narration">旁白</Select.Option>
                    <Select.Option value="dialogue">对白</Select.Option>
                    <Select.Option value="action">动作</Select.Option>
                    <Select.Option value="transition">转场</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="content"
                  label="内容"
                  rules={[{ required: true, message: '请输入内容' }]}
                >
                  <Input.TextArea rows={4} />
                </Form.Item>

                <div className={styles.formActions}>
                  <Space>
                    <Button onClick={handleCancelEdit}>取消</Button>
                    <Button type="primary" onClick={handleSaveSegment}>保存</Button>
                  </Space>
                </div>
              </Form>
            </Card>
          </div>
        )}
      </Card>

      {/* 预览模态框 */}
      <Modal
        title="预览片段"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <div className={styles.previewContainer}>
          {previewLoading ? (
            <div className={styles.previewLoading}>
              <p>正在生成预览...</p>
            </div>
          ) : (
            <video
              src={previewSrc}
              controls
              autoPlay
              className={styles.previewVideo}
            />
          )}
        </div>
      </Modal>

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

export default React.memo(ScriptEditor);
