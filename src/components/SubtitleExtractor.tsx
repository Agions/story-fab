import React, { useState } from 'react';
import { Card, Typography, Button, Space, message, Select, Progress, List, Input, Empty, Switch } from 'antd';
import { AudioOutlined, FileTextOutlined, EditOutlined, DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Text } = Typography;
const { Option } = Select;

interface SubtitleSegment {
  id: string;
  start: string;
  end: string;
  text: string;
}

interface SubtitleExtractorProps {
  projectId: string;
  videoUrl?: string;
  onExtracted?: (subtitles: SubtitleSegment[]) => void;
}

const SubtitleExtractor: React.FC<SubtitleExtractorProps> = ({ projectId, videoUrl, onExtracted }) => {
  const [language, setLanguage] = useState('auto');
  const [format, setFormat] = useState('srt');
  const [translate, setTranslate] = useState(false);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedSubtitles, setExtractedSubtitles] = useState<SubtitleSegment[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleExtract = () => {
    if (!videoUrl) {
      message.error('未检测到视频源');
      return;
    }
    
    setIsExtracting(true);
    setProgress(0);
    setExtractedSubtitles([]);
    
    // 模拟提取过程
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExtracting(false);
          const fakeSubtitles = [
            { id: '1', start: '00:00:01,000', end: '00:00:04,500', text: '大家好，欢迎来到本期视频。' },
            { id: '2', start: '00:00:05,000', end: '00:00:08,200', text: '今天我们将介绍AI大模型最前沿的应用。' },
            { id: '3', start: '00:00:08,500', end: '00:00:12,100', text: '包括最新的推理模型以及视觉识别模块。' },
            { id: '4', start: '00:00:12,500', end: '00:00:18,000', text: '让我们通过一个实际的代码案例来看看它是如何工作的。' },
          ];
          setExtractedSubtitles(fakeSubtitles);
          message.success('字幕提取成功！');
          if (onExtracted) {
            onExtracted(fakeSubtitles);
          }
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 500);
  };

  const handleSaveEdit = (id: string) => {
    setExtractedSubtitles(prev => prev.map(s => s.id === id ? { ...s, text: editingText } : s));
    setEditingId(null);
    message.success('字幕修改已保存');
  };

  const exportSubtitle = () => {
    if (extractedSubtitles.length === 0) {
      message.warning('无字幕可导出');
      return;
    }
    
    let content = '';
    if (format === 'srt') {
      content = extractedSubtitles.map((sub, index) => `${index + 1}\n${sub.start} --> ${sub.end}\n${sub.text}\n\n`).join('');
    } else if (format === 'vtt') {
      content = 'WEBVTT\n\n' + extractedSubtitles.map((sub, index) => `${index + 1}\n${sub.start.replace(',', '.')} --> ${sub.end.replace(',', '.')}\n${sub.text}\n\n`).join('');
    } else {
      content = extractedSubtitles.map(sub => `[${sub.start} - ${sub.end}] ${sub.text}`).join('\n');
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitle_${projectId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(`已导出为 ${format.toUpperCase()} 格式`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card title={<><AudioOutlined /> 智能语音识别设置</>} bordered={false} style={{ borderRadius: 10 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>识别语言</Text>
              <Select value={language} onChange={setLanguage} style={{ width: 180 }}>
                <Option value="auto">自动识别 (Auto)</Option>
                <Option value="zh">中文 (Chinese)</Option>
                <Option value="en">英文 (English)</Option>
                <Option value="ja">日文 (Japanese)</Option>
              </Select>
            </div>
            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>导出格式</Text>
              <Select value={format} onChange={setFormat} style={{ width: 140 }}>
                <Option value="srt">SRT</Option>
                <Option value="vtt">VTT</Option>
                <Option value="txt">纯文本</Option>
              </Select>
            </div>
            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>同步翻译(实验性)</Text>
              <Switch checked={translate} onChange={setTranslate} checkedChildren="开启" unCheckedChildren="关闭" />
            </div>
          </div>
          
          {isExtracting && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Text strong>正在分析音频轨道并提取文本...</Text>
              <Progress percent={progress} strokeColor={{ from: '#667eea', to: '#764ba2' }} status="active" />
            </motion.div>
          )}

          {!isExtracting && (
            <Button 
              type="primary" 
              icon={<SyncOutlined />} 
              onClick={handleExtract}
              size="large"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: 8 }}
            >
              开始提取字幕
            </Button>
          )}
        </Space>
      </Card>

      {extractedSubtitles.length > 0 && (
        <Card 
          title={<><FileTextOutlined /> 提取结果</>} 
          bordered={false} 
          style={{ borderRadius: 10 }}
          extra={
            <Button icon={<DownloadOutlined />} onClick={exportSubtitle}>
              导出字幕文件
            </Button>
          }
        >
          <List
            itemLayout="horizontal"
            dataSource={extractedSubtitles}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingText(item.text);
                    }}
                  >
                    编辑
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<div style={{ padding: '4px 8px', background: '#f0f2f5', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>{item.start}<br/>↓<br/>{item.end}</div>}
                  title={
                    editingId === item.id ? (
                      <Input.TextArea 
                        value={editingText} 
                        onChange={(e) => setEditingText(e.target.value)} 
                        autoSize={{ minRows: 2, maxRows: 4 }}
                      />
                    ) : (
                      <span style={{ fontSize: 15 }}>{item.text}</span>
                    )
                  }
                  description={
                    editingId === item.id ? (
                      <Space style={{ marginTop: 8 }}>
                        <Button size="small" type="primary" onClick={() => handleSaveEdit(item.id)}>保存</Button>
                        <Button size="small" onClick={() => setEditingId(null)}>取消</Button>
                      </Space>
                    ) : (
                      translate && <span style={{ color: '#8c8c8c', fontStyle: 'italic' }}>{item.text.replace(/./g, '-')} (翻译生成中)</span>
                    )
                  }
                />
              </List.Item>
            )}
            style={{ maxHeight: 400, overflowY: 'auto' }}
          />
        </Card>
      )}

      {!isExtracting && extractedSubtitles.length === 0 && (
        <Empty 
          description="尚未提取字幕" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 0', background: '#fafafa', borderRadius: 10 }}
        />
      )}
    </div>
  );
};

export default SubtitleExtractor;
