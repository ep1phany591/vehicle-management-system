<template>
  <div class="leader-dashboard">
    <div class="header">
      <div class="user-info">
        <img 
            :src="user.avatar ? getAvatarUrl(user.avatar) : 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'" 
            alt="头像" 
            class="avatar"
          >
        <div class="user-details">
          <h3>{{ user.real_name }}</h3>
          <p>领导工作台</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToHome" class="home-btn">首页</button>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <div class="stat-container">
      <div class="stat-card" @click="$router.push('/admin/statistics')">
        <div class="stat-icon total">
          <span>📊</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月完成统计</div>
        </div>
      </div>

      <div class="stat-card" @click="$router.push('/admin/missions')">
        <div class="stat-icon today">
          <span>📅</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayMissions }}</div>
          <div class="stat-label">今日出车</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LeaderDashboard',
  data() {
    return {
      user: {},
      // 保留今日出车所需的数据结构
      stats: {
        todayMissions: 0
      },
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    };
  },
  mounted() {
    this.loadUserInfo();
    this.loadTodayStats();
  },
  methods: {
   
  getAvatarUrl(avatarPath) {
      if (!avatarPath) return '';
      // 如果已经是完整URL，直接返回
      if (avatarPath.startsWith('http')) return avatarPath;
      // 否则拼接基础URL
      const baseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';
      return baseUrl + avatarPath;
    },

    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    // 加载今日数据的简单方法
   async loadTodayStats() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // 使用 Missions.vue 同样的接口
        const response = await fetch('http://localhost:3000/api/applications?limit=1000', {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });

        if (response.ok) {
          const result = await response.json();
          // 这里的 result.data 是 Missions.vue 中使用的数组源
          const allMissions = result.data || [];
          
          // 获取今天的本地日期对象
          const now = new Date();
          const todayStr = now.toDateString(); 
          
          // 完全复刻 Missions.vue 的过滤逻辑
          const todayMissions = allMissions.filter(mission => {
            if (!mission.start_time) return false;
            
            // 将 mission.start_time 转为日期对象并对比
            const missionDate = new Date(mission.start_time).toDateString();
            
            // 只要日期匹配就算“今日任务”，不卡死状态（或者根据需要增加状态过滤）
            return missionDate === todayStr;
          });

          this.stats.todayMissions = todayMissions.length;
        } else {
          console.error('获取数据失败');
          this.stats.todayMissions = 0;
        }
      } catch (error) {
        console.error('加载今日出车数据失败:', error);
        this.stats.todayMissions = 0;
      }
    },
    
    goToHome() {
      this.$router.push('/home');
    },
    
    logout() {
      localStorage.clear();
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.leader-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding: 24px;
}

/* 顶部导航样式 */
.header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 16px;
  padding: 20px 28px;
  margin-bottom: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.home-btn, .logout-btn {
  padding: 10px 22px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.logout-btn { background: #ff4d4f; color: white; }
.home-btn { background: rgba(255,255,255,0.2); color: white; border: 1px solid white; }

/* 卡片容器布局 */
.stat-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

/* 统计卡片样式 */
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.stat-icon.total { background: #e6f7ff; color: #1890ff; }
.stat-icon.today { background: #f6ffed; color: #52c41a; }

.stat-info .stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-info .stat-label {
  font-size: 16px;
  color: #666;
}

@media (max-width: 768px) {
  .header { flex-direction: column; gap: 16px; text-align: center; }
  .user-info { flex-direction: column; }
}
</style>