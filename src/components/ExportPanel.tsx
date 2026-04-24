import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { ExportFormat, exportScript } from '../services/export';
import { Script } from '../services/aiService';
import { notify } from '../shared';
import { logger } from '../utils/logger';
import { Download, FileText, File, Globe } from 'lucide-react';
import styles from './ExportPanel.module.less';

export interface ScriptExportSettings {
  format: ExportFormat;
  filename: string;
}

interface ExportPanelProps {
  script?: Script;
  onExport?: (settings: ScriptExportSettings) => Promise<string> | void;
}

const formatOptions = [
  { value: ExportFormat.TXT, label: '纯文本 (.txt)', desc: '简单文本格式，适合通用场景', icon: FileText },
  { value: ExportFormat.SRT, label: '字幕文件 (.srt)', desc: '标准字幕格式，可导入视频编辑软件', icon: FileText },
  { value: ExportFormat.PDF, label: 'PDF文档 (.pdf)', desc: '带格式的PDF文档，适合打印或分享', icon: File },
  { value: ExportFormat.HTML, label: '网页 (.html)', desc: '可在浏览器中打开的网页格式', icon: Globe },
] as const;

const ExportPanel: React.FC<ExportPanelProps> = ({ script, onExport }) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.TXT);
  const [filename, setFilename] = useState<string>(`脚本_${script?.id ?? Date.now()}`);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!filename.trim()) {
      notify.error(null, '请输入有效的文件名');
      return;
    }

    if (onExport) {
      setExporting(true);
      try {
        const settings = {
          format: exportFormat,
          filename: filename,
        };
        await onExport(settings);
        notify.success('导出成功');
      } catch (error) {
        logger.error('导出失败:', error);
        notify.error(error, '导出失败，请稍后重试');
      } finally {
        setExporting(false);
      }
      return;
    }

    if (!script) {
      notify.error(null, '没有可导出的脚本');
      return;
    }

    setExporting(true);
    try {
      const success = await exportScript(script, exportFormat, filename);
      if (success) {
        notify.success(`脚本已成功导出为${exportFormat.toUpperCase()}格式`);
      } else {
        notify.error(null, '导出失败，请稍后重试');
      }
    } catch (error) {
      logger.error('导出失败:', error);
      notify.error(error, '导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className={styles.exportPanel}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">导出脚本</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipContent side="bottom">导出后的文件将保存到您选择的位置</TooltipContent>
            <TooltipTrigger
              className="inline-flex h-8 px-3 items-center justify-center rounded-md bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white transition-colors gap-1"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={14} />
              <span className="text-sm">{exporting ? '导出中...' : '导出'}</span>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={styles.filenameSection}>
          <label htmlFor="filename" className={styles.label}>文件名:</label>
          <Input
            id="filename"
            value={filename}
            onChange={e => setFilename(e.target.value)}
            placeholder="输入文件名(不含扩展名)"
            className={styles.filenameInput}
          />
        </div>

        <div className={styles.formatSection}>
          <label className={styles.label}>导出格式:</label>
          <div className="flex flex-col gap-2">
            {formatOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    exportFormat === opt.value
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-border hover:border-accent-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value={opt.value}
                    checked={exportFormat === opt.value}
                    onChange={() => setExportFormat(opt.value)}
                    className="mt-0.5 accent-orange-500"
                  />
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <span className={styles.formatDesc + ' text-xs text-muted-foreground ml-6'}>
                    {opt.desc}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportPanel;
