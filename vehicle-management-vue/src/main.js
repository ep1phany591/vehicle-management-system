// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import axios from 'axios';
// 样式重置
import './styles/reset.css';
import 'vant/lib/index.css';
axios.defaults.withCredentials = true;

console.log('🚀 开始启动应用...');

try {
  const app = createApp(App);
  const pinia = createPinia();

  console.log('✅ 创建应用成功');
  
  // 使用插件
  app.use(pinia);
  console.log('✅ Pinia 初始化成功');
  
  app.use(router);
  console.log('✅ Router 初始化成功');

  // 挂载应用
  app.mount('#app');
  console.log('✅ 应用挂载成功');
  
} catch (error) {
  console.error('❌ 应用启动失败:', error);
}