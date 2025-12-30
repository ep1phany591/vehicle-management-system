// vue.config.js - 简化版本
module.exports = {
  transpileDependencies: true,
  // 移除 runtimeCompiler 选项
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  lintOnSave: false, // 关闭 ESLint 检查
}