<!-- src/views/Profile.vue -->
<template>
  <div class="profile-page">
    <div class="header">
      <h1>个人中心</h1>
      <button @click="$router.back()">返回</button>
    </div>
    
    <div class="user-card">
      <img :src="user.avatar || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'" alt="头像" class="avatar">
      <h3>{{ user.real_name || '用户' }}</h3>
      <p>{{ getRoleText(user.role) }}</p>
    </div>
    
    <div class="info-list">
      <div class="info-item">
        <span>手机号</span>
        <span>{{ user.phone || '--' }}</span>
      </div>
      <div class="info-item">
        <span>用户ID</span>
        <span>{{ user.user_id || '--' }}</span>
      </div>
    </div>
    
    <div style="padding: 20px;">
      <button @click="logout" class="logout-btn">退出登录</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Profile',
  data() {
    return {
      user: {}
    };
  },
  mounted() {
    this.loadUserInfo();
  },
  methods: {
    loadUserInfo() {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          this.user = JSON.parse(userData);
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    },
    getRoleText(role) {
      const roleMap = {
        admin: '管理员',
        leader: '领导',
        manager: '车队队长',
        driver: '司机',
        employee: '员工',
        user: '用户'
      };
      return roleMap[role] || role;
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #eee;
}

.header h1 {
  margin: 0;
  font-size: 18px;
}

.user-card {
  background: white;
  margin: 20px;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 15px;
}

.user-card h3 {
  margin: 10px 0 5px 0;
  color: #333;
}

.user-card p {
  margin: 0;
  color: #666;
}

.info-list {
  background: white;
  margin: 20px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #ff7875;
}
</style>
