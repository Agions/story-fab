import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface DocIssue {
  file: string;
  line: number;
  name: string;
  type: 'missing' | 'incomplete';
  message: string;
}

// 检查源代码中的文档问题
function checkDocs(srcDir: string): DocIssue[] {
  const issues: DocIssue[] = [];
  const program = ts.createProgram(
    findSourceFiles(srcDir),
    {}
  );
  
  const checker = program.getTypeChecker();
  
  // 遍历所有源文件
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile && sourceFile.fileName.startsWith(srcDir)) {
      ts.forEachChild(sourceFile, (node) => {
        checkNode(node, sourceFile, checker, issues);
      });
    }
  }
  
  return issues;
}

// 检查单个节点的文档
function checkNode(node: ts.Node, sourceFile: ts.SourceFile, checker: ts.TypeChecker, issues: DocIssue[]) {
  // 只检查导出的声明
  if (
    (ts.isClassDeclaration(node) ||
     ts.isFunctionDeclaration(node) ||
     ts.isInterfaceDeclaration(node) ||
     ts.isTypeAliasDeclaration(node) ||
     ts.isEnumDeclaration(node)) &&
    isNodeExported(node)
  ) {
    const symbol = checker.getSymbolAtLocation(node.name!);
    if (symbol) {
      const docs = ts.displayPartsToString(symbol.getDocumentationComment(checker));
      const name = symbol.getName();
      
      // 检查是否缺少文档
      if (!docs) {
        issues.push({
          file: sourceFile.fileName,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          name,
          type: 'missing',
          message: `缺少文档注释: ${name}`
        });
      } 
      // 检查文档是否不完整（太短或缺少示例）
      else if (docs.length < 20 || !docs.includes('@example')) {
        issues.push({
          file: sourceFile.fileName,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          name,
          type: 'incomplete',
          message: `文档不完整: ${name} - ${docs.length < 20 ? '描述太短' : '缺少示例'}`
        });
      }
    }
  }
  
  // 递归检查子节点
  ts.forEachChild(node, (child) => {
    checkNode(child, sourceFile, checker, issues);
  });
}

// 检查节点是否被导出
function isNodeExported(node: ts.Declaration): boolean {
  return (
    (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}

// 查找源文件
function findSourceFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 忽略 node_modules 和 .git 目录
        if (entry !== 'node_modules' && entry !== '.git') {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        // 只包含 .ts, .tsx 文件
        const ext = path.extname(entry);
        if (['.ts', '.tsx'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 生成文档问题报告
function generateReport(issues: DocIssue[]): string {
  let report = '# 文档问题报告\n\n';
  
  if (issues.length === 0) {
    report += '✅ 没有发现文档问题，所有检查通过！\n';
    return report;
  }
  
  report += `发现 ${issues.length} 个文档问题:\n\n`;
  
  // 按文件分组
  const fileGroups: {[key: string]: DocIssue[]} = {};
  
  for (const issue of issues) {
    if (!fileGroups[issue.file]) {
      fileGroups[issue.file] = [];
    }
    fileGroups[issue.file].push(issue);
  }
  
  // 生成报告
  for (const file in fileGroups) {
    report += `## ${path.relative(process.cwd(), file)}\n\n`;
    report += '| 行号 | 名称 | 问题类型 | 描述 |\n';
    report += '| ---- | ---- | -------- | ---- |\n';
    
    for (const issue of fileGroups[file]) {
      const type = issue.type === 'missing' ? '缺失' : '不完整';
      report += `| ${issue.line} | ${issue.name} | ${type} | ${issue.message} |\n`;
    }
    
    report += '\n';
  }
  
  return report;
}

// 主函数
function main() {
  const srcDir = path.join(__dirname, '../src');
  console.log(`检查目录: ${srcDir}`);
  
  const issues = checkDocs(srcDir);
  
  // 生成报告
  const report = generateReport(issues);
  
  // 保存报告
  const reportDir = path.join(__dirname, '../docs/reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, 'doc-issues.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`报告已保存到: ${reportPath}`);
  
  if (issues.length > 0) {
    console.error('发现文档问题:');
    
    for (const issue of issues) {
      console.error(
        `${issue.file}:${issue.line} - ${issue.message}`
      );
    }
    
    process.exit(1);
  } else {
    console.log('文档检查通过！');
  }
}

main();