import React, { memo } from 'react';
import { Card, Form, Input, Select, Button, Space } from 'antd';
import { segmentTypeOptions } from './types';
import styles from './ScriptEditor.module.less';

const { TextArea } = Input;

interface SegmentEditFormProps {
  form: any;
  editingIndex: number;
  onSave: () => void;
  onCancel: () => void;
}

const SegmentEditForm: React.FC<SegmentEditFormProps> = ({
  form,
  editingIndex,
  onSave,
  onCancel,
}) => {
  return (
    <div className={styles.editForm}>
      <Card title={`编辑片段 #${editingIndex + 1}`} className={styles.editCard}>
        <Form form={form} layout="vertical">
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
              {segmentTypeOptions.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <div className={styles.formActions}>
            <Space>
              <Button onClick={onCancel}>取消</Button>
              <Button type="primary" onClick={onSave}>保存</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default memo(SegmentEditForm);
