<!-- src/views/Home.vue -->
<template>
  <div class="home-page">
    <!-- 错误提示 -->
    <div v-if="error" class="error-tip">
      {{ error }}
    </div>
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="user-info">
        <div class="user-avatar">
          <!-- 确保头像存在，否则显示默认头像 -->
         <img 
            :src="user.avatar ? getAvatarUrl(user.avatar) : 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'" 
            alt="头像" 
            class="avatar"
          >
        </div>
        <div class="user-details">
          <!-- 确保姓名存在，否则显示默认值 -->
          <h3>{{ user.real_name || '员工' }}</h3>
          <p>{{ getRoleText(user.role) }}</p>
        </div>
      </div>
      <div class="logout-btn" @click="logout">
        <span>退出</span>
      </div>
    </div>

    <!-- 欢迎信息 -->
    <div class="welcome-section">
      <h2>👋 欢迎回来，{{ user.real_name || '员工' }}！</h2>
      <p class="welcome-text">您可以使用以下功能管理您的车辆申请</p>
    </div>

    <!-- 统计信息 - 员工视角 -->
    <div class="stats-section">
      <h2>我的申请统计</h2>
      <div class="stats-grid">
        <div class="stat-card" @click="goToApplications">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">全部申请</div>
        </div>
        <div class="stat-card" @click="goToApplications('pending')">
          <div class="stat-value">{{ stats.pending || 0 }}</div>
          <div class="stat-label">待审批</div>
        </div>
        <div class="stat-card" @click="goToApplications('approved')">
          <div class="stat-value">{{ stats.approved || 0 }}</div>
          <div class="stat-label">已批准</div>
        </div>
        <div class="stat-card" @click="goToApplications('completed')">
          <div class="stat-value">{{ stats.completed || 0 }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </div>

    <!-- 功能卡片 -->
    <div class="function-cards">
      <div class="card-row">
        <div class="function-card apply-card" @click="goToApply">
          <div class="card-icon">🚗</div>
          <div class="card-content">
            <h3>申请用车</h3>
            <p>提交新的用车申请</p>
          </div>
          <div class="card-arrow">➡️</div>
        </div>
        <div class="function-card profile-card" @click="goToProfile">
          <div class="card-icon">👤</div>
          <div class="card-content">
            <h3>个人中心</h3>
            <p>查看和修改个人信息</p>
          </div>
          <div class="card-arrow">➡️</div>
        </div>
      </div>
    </div>

    <!-- 最近申请 -->
    <div class="recent-section">
      <div class="section-header">
        <h2>最近申请</h2>
        <span @click="goToApplications" class="view-all">查看全部</span>
      </div>
      
      <div v-if="applications.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无申请记录</p>
        <button @click="goToApply" class="primary-btn">去申请用车</button>
      </div>
      
      <div v-else class="applications-list">
        <div class="application-item" v-for="app in applications" :key="app.id" @click="viewApplication(app)">
          <div class="app-info">
            <div class="app-header">
              <h4>{{ app.vehicle_info?.plate_number || '待分配车辆' }}</h4>
              <span :class="`status-${app.status}`">{{ getStatusText(app.status) }}</span>
            </div>
            <div class="app-details">
              <div class="detail-item">
                <span class="label">行程：</span>
                <span class="value">{{ app.departure }} → {{ app.destination }}</span>
              </div>
              <div class="detail-item">
                <span class="label">时间：</span>
                <span class="value">{{ formatDate(app.start_time) }} - {{ formatDate(app.end_time) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">用途：</span>
                <span class="value">{{ app.reason || '未填写' }}</span>
              </div>
            </div>
          </div>
          <div class="app-actions">
            <button v-if="app.status === 'pending'" @click.stop="cancelApplication(app)" class="cancel-btn">
              取消申请
            </button>
            <button @click.stop="viewApplication(app)" class="view-btn">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'Home',
  setup() {
    const router = useRouter();
    const user = ref({
      user_id: '',
      real_name: '',
      role: '',
      phone: '',
      avatar: ''
    });
    
    const applications = ref([]);
    const loading = ref(true);
    const error = ref('');
    const result = ref({
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        completed: 0
      },
      data: []
    });

        const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  
  // 如果已经是完整URL，直接返回
  if (avatarPath.startsWith('http')) return avatarPath;
  
  // 否则拼接基础URL
  const baseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';
  
  // 确保baseUrl以斜杠结尾，且avatarPath不以斜杠开头（避免双斜杠）
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const normalizedPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath;
  
  return normalizedBaseUrl + normalizedPath;
};
    // 计算属性 - 会自动更新
    const stats = computed(() => result.value.stats || {
      total: 0,
      pending: 0,
      approved: 0,
      completed: 0
    });

    // 加载用户信息
    const loadUserInfo = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          user.value = JSON.parse(userData);
          console.log('✅ 加载用户信息成功:', user.value);
          // 加载申请数据
          loadApplications();
        } else {
          // 如果没有用户信息，跳转到登录页
          router.push('/login');
        }
      } catch (error) {
        console.error('❌ 加载用户信息失败:', error);
      }
    };

    // 加载申请数据
   const loadApplications = async () => {
  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录，请重新登录');
    }

    const response = await fetch('http://localhost:3000/api/applications/my', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      applications.value = data.data || [];  // 确保将数据赋值给 applications
      result.value = {
        data: data.data || [],
        stats: data.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          completed: 0
        }
      };
    } else {
      throw new Error(data.message || '获取申请数据失败');
    }
  } catch (err) {
    console.error('加载申请数据失败:', err);
    error.value = err.message;
    applications.value = [];  // 错误时清空 applications
  } finally {
    loading.value = false;
  }
};

    // 刷新数据
    const refreshData = () => {
      console.log('🔄 刷新数据...');
      loadApplications();
    };

    const getRoleText = (role) => {
      const roleMap = {
        admin: '管理员',
        leader: '领导',
        manager: '车队队长',
        driver: '司机',
        employee: '员工',
        user: '用户'
      };
      return roleMap[role] || role || '未知角色'; // 如果role为空，默认显示'未知角色'
    };

    const getStatusText = (status) => {
      const statusMap = {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        assigned: '已派车',
        confirmed: '已接单',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || status || '未知状态'; // 如果status为空，默认显示'未知状态'
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
      } catch {
        return dateString;
      }
    };

    const goToApply = () => {
      console.log('📝 跳转到申请用车页面');
      router.push('/apply');
    };

    const goToApplications = (status = '') => {
      console.log('📄 跳转到我的申请页面');
      const query = status ? { status } : {};
      router.push({ path: '/applications', query });
    };

    const goToProfile = () => {
      console.log('👤 跳转到个人中心页面');
      router.push('/profile');
    };

    const viewApplication = (application) => {
      console.log('🔍 查看申请详情:', application);
      // 根据 application 结构传递正确的 ID
      const appId = application.id || application.application_id;
      router.push(`/application/${appId}`);
    };

    const cancelApplication = async (application) => {
      if (!confirm('确定要取消这个申请吗？')) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登录');
        }
        
        const appId = application.id || application.application_id;
        
        console.log('🔄 取消申请:', appId);
        
        // 调用 API 取消申请
        const response = await fetch(`http://localhost:3000/api/applications/${appId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'cancelled'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '取消申请失败');
        }
        
        const result = await response.json();
        
        if (result.success) {
          alert('✅ 申请已取消');
          // 重新加载数据
          refreshData();
        } else {
          throw new Error(result.message || '取消申请失败');
        }
      } catch (error) {
        console.error('❌ 取消申请失败:', error);
        alert(`取消申请失败: ${error.message}`);
      }
    };

    const logout = () => {
      console.log('🚪 退出登录');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    };

    onMounted(() => {
      console.log('=== Home 页面加载完成 ===');
      loadUserInfo();
    });

    return {
      user,
      applications,
      stats,
      loading,
      error,
      refreshData,
      getRoleText,
      getStatusText,
      formatDate,
      goToApply,
      goToApplications,
      goToProfile,
      viewApplication,
      cancelApplication,
      logout,
      getAvatarUrl
    };
  }
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding: 24px 24px 24px;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 顶部导航栏 */
.header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 20px;
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 30px rgba(24, 144, 255, 0.2);
  color: white;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  border-radius: 50%;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details h3 {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-details p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  font-weight: 500;
}

.logout-btn {
  padding: 10px 22px;
  background: rgba(255, 77, 79, 0.9);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  z-index: 1;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.logout-btn:hover {
  background: rgba(255, 77, 79, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.4);
}

.logout-btn:active {
  transform: translateY(0);
}

/* 欢迎信息 */
.welcome-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #52c41a);
}

.welcome-section h2 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.welcome-text {
  margin: 0;
  color: #666;
  font-size: 15px;
  line-height: 1.6;
}

/* 统计信息 */
.stats-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.stats-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #52c41a, #faad14);
}

.stats-section h2 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.4s ease;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #722ed1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: #1890ff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.stat-card:hover::after {
  opacity: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1890ff;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.stat-card:nth-child(2) .stat-value {
  color: #faad14;
}

.stat-card:nth-child(3) .stat-value {
  color: #52c41a;
}

.stat-card:nth-child(4) .stat-value {
  color: #722ed1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 功能卡片 */
.function-cards {
  margin-bottom: 24px;
}

.card-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.function-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.function-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.apply-card::before {
  background: linear-gradient(90deg, #1890ff, #40a9ff);
}

.profile-card::before {
  background: linear-gradient(90deg, #52c41a, #73d13d);
}

.function-card:hover {
  transform: translateY(-5px);
  border-color: #1890ff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.function-card:hover::before {
  opacity: 1;
}

.card-icon {
  font-size: 40px;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
}

.function-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.apply-card:hover .card-icon {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.profile-card:hover .card-icon {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.card-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.card-arrow {
  font-size: 20px;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.function-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(5px);
}

/* 最近申请 */
.recent-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.recent-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #faad14, #1890ff);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.section-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.view-all {
  color: #1890ff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 20px;
  background: rgba(24, 144, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.view-all:hover {
  background: rgba(24, 144, 255, 0.2);
  transform: translateX(3px);
  text-decoration: none;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px dashed #d9d9d9;
  margin: 20px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  color: #999;
  font-size: 16px;
  margin-bottom: 24px;
  font-weight: 500;
}

.primary-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  border: none;
  padding: 14px 36px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.primary-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.primary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(24, 144, 255, 0.4);
  background: linear-gradient(135deg, #40a9ff, #1890ff);
}

.primary-btn:active {
  transform: translateY(-1px);
}

.primary-btn:hover::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}

/* 申请列表 */
.applications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.application-item {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.application-item:hover {
  transform: translateY(-3px);
  border-color: #1890ff;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.15);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.app-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.app-header span {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-approved {
  background: #f6ffed;
  color: #52c41a;
}

.status-rejected {
  background: #fff2f0;
  color: #ff4d4f;
}

.status-in_progress {
  background: #e6f7ff;
  color: #1890ff;
}

.status-completed {
  background: #f9f0ff;
  color: #722ed1;
}

.status-cancelled {
  background: #fafafa;
  color: #8c8c8c;
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-item .label {
  color: #666;
  font-size: 13px;
  min-width: 80px;
  font-weight: 500;
}

.detail-item .value {
  color: #333;
  font-size: 13px;
  flex: 1;
}

.app-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn {
  padding: 8px 20px;
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #ffccc7;
  transform: translateY(-1px);
}

.view-btn {
  padding: 8px 20px;
  background: #f0f5ff;
  color: #1890ff;
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn:hover {
  background: #d6e4ff;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-page {
    padding: 16px 16px 16px;
  }
  
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 20px 16px;
  }
  
  .user-info {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .card-row {
    grid-template-columns: 1fr;
  }
  
  .logout-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .view-all {
    width: 100%;
    justify-content: center;
  }
  
  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .app-actions {
    flex-direction: column;
  }
}
</style>