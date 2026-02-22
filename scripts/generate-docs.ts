import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// 从代码示例目录生成文档
function generateExampleDocs() {
  const examplesDir = path.join(__dirname, '../examples');
  const docsDir = path.join(__dirname, '../docs/examples');
  
  // 确保文档目录存在
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // 读取所有示例
  const examples = fs.readdirSync(examplesDir);
  
  // 生成示例文档索引
  let indexContent = '# 代码示例索引\n\n';
  
  for (const example of examples) {
    const examplePath = path.join(examplesDir, example);
    const stat = fs.statSync(examplePath);
    
    if (stat.isDirectory()) {
      // 读取示例的 README.md（如果存在）
      const readmePath = path.join(examplePath, 'README.md');
      let description = '';
      
      if (fs.existsSync(readmePath)) {
        const readmeContent = fs.readFileSync(readmePath, 'utf-8');
        // 提取第一行作为描述
        description = readmeContent.split('\n')[0].replace('# ', '');
      }
      
      // 添加到索引
      indexContent += `- [${example}](${example}.md) - ${description}\n`;
      
      // 生成示例文档
      generateExampleDoc(example, examplePath, docsDir);
    }
  }
  
  // 写入索引文件
  fs.writeFileSync(path.join(docsDir, 'index.md'), indexContent);
}

// 为单个示例生成文档
function generateExampleDoc(name: string, examplePath: string, docsDir: string) {
  // 读取示例的 README.md
  const readmePath = path.join(examplePath, 'README.md');
  let content = '';
  
  if (fs.existsSync(readmePath)) {
    content = fs.readFileSync(readmePath, 'utf-8');
  } else {
    content = `# ${name}\n\n`;
  }
  
  // 添加代码示例
  content += '\n## 代码\n\n';
  
  // 查找主要源文件
  const srcFiles = findSourceFiles(examplePath);
  
  for (const file of srcFiles) {
    const relativePath = path.relative(examplePath, file);
    const fileContent = fs.readFileSync(file, 'utf-8');
    const extension = path.extname(file).substring(1);
    
    content += `### ${relativePath}\n\n`;
    content += '```' + extension + '\n';
    content += fileContent;
    content += '\n```\n\n';
  }
  
  // 添加运行说明
  content += '## 运行方法\n\n';
  content += '```bash\n';
  content += `cd examples/${name}\n`;
  content += 'npm install\n';
  content += 'npm start\n';
  content += '```\n';
  
  // 写入文档文件
  fs.writeFileSync(path.join(docsDir, `${name}.md`), content);
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
        // 只包含 .ts, .tsx, .js, .jsx 文件
        const ext = path.extname(entry);
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 生成API文档
function generateApiDocs() {
  console.log('生成 API 文档...');
  try {
    execSync('npm run docs:api', { stdio: 'inherit' });
  } catch (error) {
    console.error('生成API文档失败:', error);
  }
}

// 生成组件文档
function generateComponentDocs() {
  const componentsDir = path.join(__dirname, '../src/components');
  const docsDir = path.join(__dirname, '../docs/components');
  
  // 确保文档目录存在
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // 生成组件文档索引
  let indexContent = '# 组件库索引\n\n';
  
  // 遍历组件目录
  const components = fs.readdirSync(componentsDir);
  
  for (const component of components) {
    const componentPath = path.join(componentsDir, component);
    const stat = fs.statSync(componentPath);
    
    // 如果是目录或者是.tsx文件
    if (stat.isDirectory() || (stat.isFile() && path.extname(component) === '.tsx')) {
      const componentName = path.basename(component, '.tsx');
      
      // 添加到索引
      indexContent += `- [${componentName}](${componentName}.md)\n`;
      
      // 生成组件文档
      generateComponentDoc(componentName, componentPath, docsDir);
    }
  }
  
  // 写入索引文件
  fs.writeFileSync(path.join(docsDir, 'index.md'), indexContent);
}

// 为单个组件生成文档
function generateComponentDoc(name: string, componentPath: string, docsDir: string) {
  let content = `# ${name} 组件\n\n`;
  
  // 如果是目录，查找主要组件文件
  if (fs.statSync(componentPath).isDirectory()) {
    const tsxFile = path.join(componentPath, `${name}.tsx`);
    if (fs.existsSync(tsxFile)) {
      componentPath = tsxFile;
    } else {
      // 查找目录中的第一个.tsx文件
      const files = fs.readdirSync(componentPath);
      const tsxFiles = files.filter(file => path.extname(file) === '.tsx');
      if (tsxFiles.length > 0) {
        componentPath = path.join(componentPath, tsxFiles[0]);
      }
    }
  }
  
  // 读取组件文件内容
  if (fs.existsSync(componentPath) && fs.statSync(componentPath).isFile()) {
    const fileContent = fs.readFileSync(componentPath, 'utf-8');
    
    // 提取JSDoc注释
    const jsdocComments = extractJSDocComments(fileContent);
    
    // 添加组件描述
    if (jsdocComments.description) {
      content += `## 描述\n\n${jsdocComments.description}\n\n`;
    }
    
    // 添加组件属性
    if (jsdocComments.props && jsdocComments.props.length > 0) {
      content += '## 属性\n\n';
      content += '| 属性名 | 类型 | 默认值 | 描述 |\n';
      content += '| ------ | ---- | ------ | ---- |\n';
      
      for (const prop of jsdocComments.props) {
        content += `| ${prop.name} | ${prop.type || '-'} | ${prop.default || '-'} | ${prop.description || '-'} |\n`;
      }
      
      content += '\n';
    }
    
    // 添加示例
    if (jsdocComments.examples && jsdocComments.examples.length > 0) {
      content += '## 示例\n\n';
      
      for (const example of jsdocComments.examples) {
        content += example + '\n\n';
      }
    }
    
    // 添加源代码
    content += '## 源代码\n\n';
    content += '```tsx\n';
    content += fileContent;
    content += '\n```\n';
  } else {
    content += '> 组件文件未找到\n';
  }
  
  // 写入文档文件
  fs.writeFileSync(path.join(docsDir, `${name}.md`), content);
}

// 提取JSDoc注释
function extractJSDocComments(content: string) {
  const result = {
    description: '',
    props: [] as Array<{name: string, type: string, default: string, description: string}>,
    examples: [] as string[]
  };
  
  // 匹配JSDoc注释块
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
  let match;
  
  while ((match = jsdocRegex.exec(content)) !== null) {
    const comment = match[1];
    
    // 提取描述（第一行到第一个@标签）
    const descriptionMatch = comment.match(/\s*\*\s*([^@][\s\S]*?)(?=\s*\*\s*@|$)/);
    if (descriptionMatch && descriptionMatch[1]) {
      result.description = descriptionMatch[1].trim();
    }
    
    // 提取@example标签
    const exampleRegex = /@example\s*([\s\S]*?)(?=\s*\*\s*@|\s*\*\/)/g;
    let exampleMatch;
    
    while ((exampleMatch = exampleRegex.exec(comment)) !== null) {
      if (exampleMatch[1]) {
        result.examples.push(exampleMatch[1].trim());
      }
    }
    
    // 提取@prop或@param标签
    const propRegex = /@(prop|param)\s+\{([^}]*)\}\s+([^\s]*)(?:\s+-\s+)?([\s\S]*?)(?=\s*\*\s*@|\s*\*\/)/g;
    let propMatch;
    
    while ((propMatch = propRegex.exec(comment)) !== null) {
      const type = propMatch[2].trim();
      const name = propMatch[3].trim();
      const description = propMatch[4] ? propMatch[4].trim() : '';
      
      // 提取默认值
      const defaultMatch = description.match(/@default\s+(.*)/);
      const defaultValue = defaultMatch ? defaultMatch[1].trim() : '';
      
      result.props.push({
        name,
        type,
        default: defaultValue,
        description: description.replace(/@default\s+.*/, '').trim()
      });
    }
  }
  
  return result;
}

// 主函数
function main() {
  // 确保docs目录存在
  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // 生成API文档
  generateApiDocs();
  
  // 生成组件文档
  console.log('生成组件文档...');
  generateComponentDocs();
  
  // 生成示例文档
  console.log('生成示例文档...');
  try {
    generateExampleDocs();
  } catch (error) {
    console.log('示例目录不存在，跳过生成示例文档');
  }
  
  console.log('文档生成完成！');
}

main();