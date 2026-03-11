## [ERR-20260310-001] command_failure

**Logged**: 2026-03-10T10:30:00.000Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
sed/python 脚本替换 formatTime 导入导致 TypeScript 语法错误

### Error
```
error TS1127: Invalid character.
error TS1002: Unterminated string literal.
```

### Context
使用 sed 批量替换 formatTime 导入时，转义字符处理不当导致文件损坏

### Suggested Fix
使用更可靠的工具如 Python 或专门的重构工具，避免 shell 脚本处理复杂文本

### Resolution
- **Resolved**: 2026-03-10T12:00:00.000Z
- **Commit**: git checkout 恢复损坏文件后手动修复

### Metadata
- Reproducible: no
- Related Files: src/pages/Dashboard/index.tsx, src/components/WorkflowMonitor.tsx
- See Also: LRN-20260310-001

---
