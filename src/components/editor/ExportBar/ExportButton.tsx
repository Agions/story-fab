/**
 * ExportButton — 导出按钮
 * shadcn Button, large, primary orange
 * Text: "Export" / "Exporting..." / "Complete"
 * Disabled during export
 */
import React, { memo } from 'react';
import { Button } from '../../ui/button';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';

interface ExportButtonProps {
  state: 'idle' | 'processing' | 'complete' | 'error';
  onClick: () => void;
}

export const ExportButton = memo<ExportButtonProps>(({ state, onClick }) => {
  const isProcessing = state === 'processing';

  return (
    <Button
      size="lg"
      onClick={onClick}
      disabled={isProcessing}
      className={`
        h-8 px-4 text-sm font-medium gap-2 shrink-0
        ${state === 'complete'
          ? 'bg-accent-success hover:bg-accent-success/80 text-white'
          : state === 'error'
            ? 'bg-accent-danger hover:bg-accent-danger/80 text-white'
            : 'bg-accent-primary hover:bg-accent-primary-hover text-white'
        }
      `}
    >
      {state === 'complete' ? (
        <>
          <CheckCircle2 className="size-4" />
          <span>Complete</span>
        </>
      ) : state === 'processing' ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="size-4" />
          <span>Export</span>
        </>
      )}
    </Button>
  );
});

ExportButton.displayName = 'ExportButton';
