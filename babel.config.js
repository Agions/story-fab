/**
 * Babel 配置 - 用于 Ant Design 按需加载
 * 需要配合 vite-plugin-react 和 babel-plugin-import 使用
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
    '@babel/preset-react',
  ],
  plugins: [
    [
      'import',
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: false, // antd v5 使用 CSS-in-JS，不需要这个
      },
    ],
  ],
};
