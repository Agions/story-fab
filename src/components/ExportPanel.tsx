import React, { useState } from 'react';
import { Card, Radio, Button, Input, Space, message, Tooltip } from 'antd';
import { ExportOutlined, FileTextOutlined, FileMarkdownOutlined, FilePdfOutlined, FileExcelOutlined, GlobalOutlined } from '@ant-design/icons';
import { ExportFormat, exportScript } from '@/services/exportService';
import { Script } from '@/services/aiService';
import styles from './ExportPanel.module.less';

interface ExportPanelProps {
  script?: Script;
  onExport?: (settings: any) => Promise<string> | void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ script, onExport }) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.TXT);
  const [filename, setFilename] = useState<string>(`脚本_${script.id}`);
  const [exporting, setExporting] = useState(false);
  
  // 处理导出格式变更
  const handleFormatChange = (e: any) => {
    setExportFormat(e.target.value);
  };
  
  // 处理文件名变更
  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
  };
  
  // 执行导出
  const handleExport = async () => {
    if (!filename.trim()) {
      message.error('请输入有效的文件名');
      return;
    }
    
    // 如果提供了 onExport 回调，使用它
    if (onExport) {
      setExporting(true);
      try {
        const settings = {
          format: exportFormat,
          filename: filename,
        };
        await onExport(settings);
        message.success('导出成功');
      } catch {
        console.error('导出失败:', error);
        message.error('导出失败，请稍后重试');
      } finally {
        setExporting(false);
      }
      return;
    }
    
    // 否则使用默认的导出逻辑
    if (!script) {
      message.error('没有可导出的脚本');
      return;
    }
    
    setExporting(true);
    try {
      const success = await exportScript(script, exportFormat, filename);
      if (success) {
        message.success(`脚本已成功导出为${exportFormat.toUpperCase()}格式`);
      }
    } catch {
      console.error('导出失败:', error);
      message.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };
  
  // 根据格式返回对应图标
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case ExportFormat.TXT:
        return <FileTextOutlined />;
      case ExportFormat.SRT:
        return <FileTextOutlined />;
      case ExportFormat.PDF:
        return <FilePdfOutlined />;
      case ExportFormat.HTML:
        return <GlobalOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };
  
  return (
    <Card 
      title="导出脚本" 
      className={styles.exportPanel}
      extra={
        <Tooltip title="导出后的文件将保存到您选择的位置">
          <Button 
            type="primary" 
            icon={<ExportOutlined />} 
            onClick={handleExport}
            loading={exporting}
          >
            导出
          </Button>
        </Tooltip>
      }
    >
      <div className={styles.content}>
        <div className={styles.filenameSection}>
          <label htmlFor="filename" className={styles.label}>文件名:</label>
          <Input
            id="filename"
            value={filename}
            onChange={handleFilenameChange}
            placeholder="输入文件名(不含扩展名)"
            className={styles.filenameInput}
          />
        </div>
        
        <div className={styles.formatSection}>
          <label className={styles.label}>导出格式:</label>
          <Radio.Group onChange={handleFormatChange} value={exportFormat}>
            <Space direction="vertical">
              <Radio value={ExportFormat.TXT}>
                <Space>
                  <FileTextOutlined /> 纯文本 (.txt)
                  <span className={styles.formatDesc}>- 简单文本格式，适合通用场景</span>
                </Space>
              </Radio>
              <Radio value={ExportFormat.SRT}>
                <Space>
                  <FileTextOutlined /> 字幕文件 (.srt)
                  <span className={styles.formatDesc}>- 标准字幕格式，可导入视频编辑软件</span>
                </Space>
              </Radio>
              <Radio value={ExportFormat.PDF}>
                <Space>
                  <FilePdfOutlined /> PDF文档 (.pdf)
                  <span className={styles.formatDesc}>- 带格式的PDF文档，适合打印或分享</span>
                </Space>
              </Radio>
              <Radio value={ExportFormat.HTML}>
                <Space>
                  <GlobalOutlined /> 网页 (.html)
                  <span className={styles.formatDesc}>- 可在浏览器中打开的网页格式</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Card>
  );
};

export default ExportPanel; 