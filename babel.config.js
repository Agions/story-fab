/**
 * Babel 配置
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
    '@babel/preset-react',
  ],
};
