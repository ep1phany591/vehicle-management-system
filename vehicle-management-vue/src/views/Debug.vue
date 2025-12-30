<!-- src/views/Debug.vue -->
<template>
  <div class="debug-page">
    <h1>调试页面</h1>
    
    <div class="debug-info">
      <h3>当前状态:</h3>
      <p>当前路径: {{ $route.path }}</p>
      <p>Token: {{ token || '空' }}</p>
      <p>User: {{ user || '空' }}</p>
    </div>
    
    <div class="actions">
      <button @click="goToLogin">去登录页</button>
      <button @click="goToHome">去首页</button>
      <button @click="goToApply">去申请页面</button>
      <button @click="clearStorage">清除 LocalStorage</button>
    </div>
    
    <div class="storage-info">
      <h3>LocalStorage 内容:</h3>
      <pre>{{ storageContent }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Debug',
  data() {
    return {
      token: '',
      user: '',
      storageContent: {}
    };
  },
  mounted() {
    this.updateInfo();
  },
  methods: {
    updateInfo() {
      this.token = localStorage.getItem('token');
      this.user = localStorage.getItem('user');
      this.storageContent = { ...localStorage };
    },
    goToLogin() {
      this.$router.push('/login');
    },
    goToHome() {
      this.$router.push('/home');
    },
    goToApply() {
      this.$router.push('/apply');
    },
    clearStorage() {
      localStorage.clear();
      this.updateInfo();
      alert('LocalStorage 已清除');
    }
  }
}
</script>

<style scoped>
.debug-page {
  padding: 20px;
}

.actions {
  margin: 20px 0;
}

.actions button {
  margin-right: 10px;
  padding: 10px 15px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.storage-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin-top: 20px;
}
</style>