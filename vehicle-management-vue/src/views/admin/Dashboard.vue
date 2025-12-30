v<template>
  <div class="admin-dashboard">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <div class="avatar-placeholder">
          <span>{{ user.real_name ? user.real_name.charAt(0).toUpperCase() : 'A' }}</span>
        </div>
        <div class="user-details">
          <h3>{{ user.real_name || '管理员' }}</h3>
          <p>管理员控制台</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="$router.push('/admin')" class="home-btn">工作台</button>
        <button @click="switchToEmployeeView" class="employee-btn">
          <span>👤</span>
          <span>员工视图</span>
        </button>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 统计概览 -->
      <div class="stats-section">
        <h2 class="section-title">数据概览</h2>
        <div class="stats-grid">
          <div class="stat-card" @click="$router.push('/admin/approval')">
            <div class="stat-icon pending">
              <span>📋</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingCount }}</div>
              <div class="stat-label">待审批申请</div>
            </div>
          </div>
          <div class="stat-card" @click="$router.push('/admin/vehicles')">
            <div class="stat-icon vehicles">
              <span>🚗</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.vehicleCount }}</div>
              <div class="stat-label">可用车辆</div>
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
          <div class="stat-card" @click="$router.push('/admin/statistics')">
            <div class="stat-icon total">
              <span>📊</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.monthMissions }}</div>
              <div class="stat-label">本月任务</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速操作和待审批整合 -->
      <div class="content-grid">
        <!-- 左侧：待审批申请 -->
        <div class="pending-section">
          <div class="section-header">
            <h3 class="section-subtitle">待审批申请</h3>
            <button @click="$router.push('/admin/approval')" class="view-all-btn">
              <span>查看全部</span>
              <span>→</span>
            </button>
          </div>
          
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
          
          <div v-else-if="pendingApplications.length === 0" class="empty-state">
            <div class="empty-icon">✅</div>
            <h3>暂无待审批申请</h3>
            <p>所有申请已处理完成</p>
          </div>
          
          <div v-else class="applications-grid">
            <div v-for="app in pendingApplications.slice(0, 4)" :key="app.application_id" 
                 class="application-card" @click="viewApplication(app)">
              <div class="card-header">
                <div class="app-info">
                  <h4>{{ app.reason }}</h4>
                  <span class="app-status pending">待审批</span>
                </div>
                <span class="app-time">{{ formatTime(app.apply_time) }}</span>
              </div>
              
              <div class="card-content">
                <div class="app-details">
                  <div class="detail-item">
                    <span class="detail-label">申请人：</span>
                    <span class="detail-value">{{ app.applicant_id }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">部门：</span>
                    <span class="detail-value">{{ app.department || '未填写' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">人数：</span>
                    <span class="detail-value">{{ app.people_count }}人</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">车型：</span>
                    <span class="detail-value">{{ getVehicleTypeText(app.vehicle_type) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">用车时间：</span>
                    <span class="detail-value">{{ formatFullDateTime(app.start_time) }}</span>
                  </div>
                  <div v-if="app.destination" class="detail-item">
                    <span class="detail-label">目的地：</span>
                    <span class="detail-value">{{ app.destination }}</span>
                  </div>
                </div>
                
                <div class="card-actions">
                  <button @click.stop="approveApplication(app)" class="approve-btn">
                    ✅ 通过
                  </button>
                  <button @click.stop="rejectApplication(app)" class="reject-btn">
                    ❌ 拒绝
                  </button>
                  <button @click.stop="viewApplication(app)" class="detail-btn">
                    📄 详情
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：快捷操作和今日任务 -->
        <div class="right-sidebar">
          <!-- 快捷操作 -->
          <div class="quick-actions-section">
            <h3 class="section-subtitle">快捷操作</h3>
            <div class="actions-grid">
              <div class="action-item" @click="$router.push('/admin/approval')">
                <div class="action-icon approval">
                  <span>✅</span>
                </div>
                <span class="action-text">审批申请</span>
              </div>
              <div class="action-item" @click="$router.push('/admin/vehicles')">
                <div class="action-icon vehicle">
                  <span>🚙</span>
                </div>
                <span class="action-text">车辆管理</span>
              </div>
              <div class="action-item" @click="$router.push('/admin/users')">
                <div class="action-icon user">
                  <span>👥</span>
                </div>
                <span class="action-text">用户管理</span>
              </div>
              <div class="action-item" @click="$router.push('/admin/missions')">
                <div class="action-icon mission">
                  <span>📋</span>
                </div>
                <span class="action-text">任务管理</span>
              </div>
              <div class="action-item" @click="switchToEmployeeView">
                <div class="action-icon my-app">
                  <span>👤</span>
                </div>
                <span class="action-text">员工视图</span>
              </div>
              <div class="action-item" @click="showCreateApplicationModal">
                <div class="action-icon new-app">
                  <span>🚗</span>
                </div>
                <span class="action-text">新建申请</span>
              </div>
            </div>
          </div>

          <!-- 今日任务 -->
          <div class="today-section">
            <div class="section-header">
              <h3 class="section-subtitle">今日出车计划</h3>
              <button @click="$router.push('/admin/missions')" class="view-all-btn">
                <span>查看全部</span>
                <span>→</span>
              </button>
            </div>
            
            <div v-if="todayMissions.length === 0" class="empty-state small">
              <div class="empty-icon">📅</div>
              <p>今日无出车计划</p>
            </div>
            
            <div v-else class="missions-list">
              <div v-for="mission in todayMissions.slice(0, 3)" :key="mission.application_id" 
                   class="mission-card" @click="viewMission(mission)">
                <div class="mission-header">
                  <div class="mission-info">
                    <h5>{{ mission.reason }}</h5>
                    <span :class="['mission-status', mission.status]">
                      {{ getStatusText(mission.status) }}
                    </span>
                  </div>
                  <span class="mission-time">{{ formatTime(mission.start_time) }}</span>
                </div>
                <div class="mission-content">
                  <div class="mission-meta">
                    <div class="meta-item">
                      <span class="icon">🚗</span>
                      <span>{{ mission.license_plate || '待分配' }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="icon">👨‍✈️</span>
                      <span>{{ mission.driver_name || '待分配司机' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建申请模态框 -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content">
        <h3>新建用车申请</h3>
        <div class="modal-body">
          <p>您正在以管理员身份创建用车申请，这将跳转到员工申请页面。</p>
        </div>
        <div class="modal-actions">
          <button @click="closeCreateModal" class="cancel-btn">取消</button>
          <button @click="goToApplyPage" class="confirm-btn">前往申请页面</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  data() {
    return {
      user: {},
      stats: {
        pendingCount: 0,
        vehicleCount: 0,
        todayMissions: 0,
        monthMissions: 0
      },
      pendingApplications: [],
      todayMissions: [],
      loading: true,
      showCreateModal: false
    };
  },
  watch: {
    // 监听数据变化，自动更新统计
    pendingApplications: {
      handler(newVal) {
        this.stats.pendingCount = newVal.length;
      },
      deep: true
    },
    todayMissions: {
      handler(newVal) {
        this.stats.todayMissions = newVal.length;
      },
      deep: true
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadDashboardData();
  },
  methods: {
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    // 切换到员工视图
    switchToEmployeeView() {
      this.$router.push('/home');
    },
    
    // 前往申请页面
    goToApplyPage() {
      this.closeCreateModal();
      this.$router.push('/apply');
    },
    
    showCreateApplicationModal() {
      this.showCreateModal = true;
    },
    
    closeCreateModal() {
      this.showCreateModal = false;
    },
    
    async loadDashboardData() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        
        // 使用和审批页面相同的方式加载申请
        const response = await fetch('http://localhost:3000/api/applications?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const allApplications = result.data || [];
            // 筛选出待审批的申请
            this.pendingApplications = allApplications.filter(app => app.status === 'pending');
            // 更新统计
            this.stats.pendingCount = this.pendingApplications.length;
          }
        } else {
          this.loadMockData();
        }
        
        // 加载今日任务
        const todayRes = await fetch('http://localhost:3000/api/admin/today-missions', {
          headers: { 
                   'Authorization': `Bearer ${token}` ,
                   'Content-Type': 'application/json'
         }
        });
        
        if (todayRes.ok) {
          const todayData = await todayRes.json();
          if (todayData.success) {
            this.todayMissions = todayData.data || [];
          }
        }
        
        // 加载车辆统计
        const vehiclesRes = await fetch('http://localhost:3000/api/admin/vehicles/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json();
          if (vehiclesData.success) {
            this.stats.vehicleCount = vehiclesData.data.total || 0;
          }
        }
        
        // 加载月度统计
        const monthlyRes = await fetch('http://localhost:3000/api/admin/statistics/monthly', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (monthlyRes.ok) {
          const monthlyData = await monthlyRes.json();
          if (monthlyData.success) {
            this.stats.monthMissions = monthlyData.data.totalMissions || 0;
          }
        }
        
      } catch (error) {
        console.error('加载数据失败:', error);
        this.loadMockData();
      } finally {
        this.loading = false;
      }
    },
    
    loadMockData() {
      // 使用和审批页面相似的模拟数据
      this.pendingApplications = [
        {
          application_id: 1,
          reason: '客户公司拜访',
          status: 'pending',
          applicant_name: '张经理',
          department: '销售部',
          people_count: 3,
          vehicle_type: 'small',
          destination: '科技园区A座',
          start_time: new Date().toISOString(),
          apply_time: new Date().toISOString()
        },
        {
          application_id: 2,
          reason: '会议接送',
          status: 'pending',
          applicant_name: '李总监',
          department: '市场部',
          people_count: 2,
          vehicle_type: 'small',
          destination: '国际会议中心',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          apply_time: new Date(Date.now() - 3600000).toISOString()
        },
        {
          application_id: 3,
          reason: '材料运输',
          status: 'pending',
          applicant_name: '王主管',
          department: '采购部',
          people_count: 1,
          vehicle_type: 'small',
          destination: '物流中心',
          start_time: new Date(Date.now() + 172800000).toISOString(),
          apply_time: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      this.todayMissions = [
        {
          application_id: 4,
          reason: '机场接机',
          start_time: new Date().toISOString(),
          license_plate: '京A88888',
          driver_name: '王师傅',
          status: 'assigned'
        },
        {
          application_id: 5,
          reason: '客户接待',
          start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          license_plate: '京B12345',
          driver_name: '李师傅',
          status: 'in_progress'
        }
      ];
      
      // 更新统计
      this.stats = {
        pendingCount: this.pendingApplications.length,
        vehicleCount: 8,
        todayMissions: this.todayMissions.length,
        monthMissions: 28
      };
    },
    
    formatTime(dateStr) {
      if (!dateStr) return '未设置';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    formatFullDateTime(dateStr) {
      if (!dateStr) return '未设置';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return typeMap[type] || type;
    },
    
    getStatusText(status) {
      const statusMap = {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        assigned: '已分配',
        confirmed: '已接受',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || status;
    },
    
    async approveApplication(app) {
  if (!confirm(`确定要批准申请 #${app.application_id} 吗？`)) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/admin/approve-application/${app.application_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'approve'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`申请 #${app.application_id} 已批准${result.data.assigned_fleet_id ? `，已分配车队ID: ${result.data.assigned_fleet_id}` : ''}`);
      // 重新加载数据
      this.loadDashboardData();
    } else {
      alert(`操作失败: ${result.message}`);
    }
  } catch (error) {
    console.error('批准申请失败:', error);
    alert('网络错误，请检查连接后重试');
  }
},
    
    async rejectApplication(app) {
      const reason = prompt('请输入拒绝原因:');
      if (!reason) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/admin/approve-application/${app.application_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'reject',
            reject_reason: reason
          })
        });
        
        const result = await response.json();
        if (result.success) {
          alert('申请已拒绝');
          // 重新加载数据
          this.loadDashboardData();
        } else {
          alert('操作失败: ' + result.message);
        }
      } catch (error) {
        console.error('拒绝申请失败:', error);
        alert('操作失败');
      }
    },
    
    viewApplication(app) {
      this.$router.push(`/application/${app.application_id}`);
    },
    
    viewMission(mission) {
      this.$router.push(`/admin/mission/${mission.application_id}`);
    },
    
    logout() {
      localStorage.clear();
      this.$router.push('/login');
    }
  }
};
</script>
<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding: 24px;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 顶部导航 */
.header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 20px;
  padding: 20px 28px;
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

.avatar-placeholder {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid rgba(255, 255, 255, 0.3);
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

.header-actions {
  display: flex;
  gap: 12px;
  z-index: 1;
}

.home-btn,
.employee-btn,
.logout-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.home-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.employee-btn {
  background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
  color: white;
}

.logout-btn {
  background: rgba(255, 77, 79, 0.9);
  color: white;
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
}

.employee-btn:hover {
  background: linear-gradient(135deg, #36cfc9 0%, #13c2c2 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(19, 194, 194, 0.4);
}

.logout-btn:hover {
  background: rgba(255, 77, 79, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.4);
}

/* 主要内容区域 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* 统计概览 */
.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 28px 0;
  position: relative;
  padding-bottom: 16px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #faad14);
  border-radius: 2px;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.4s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(to bottom, #1890ff, #52c41a);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.stat-icon.vehicles {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.stat-icon.today {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #722ed1, #9254de);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 42px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

/* 内容网格布局 */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 32px;
}

/* 待审批申请区域 */
.pending-section {
  flex: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.section-subtitle {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
  position: relative;
  padding-left: 16px;
}

.section-subtitle::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 20px;
  background: linear-gradient(to bottom, #1890ff, #faad14);
  border-radius: 3px;
}

.view-all-btn {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #333;
  border: 2px solid #e8e8e8;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-all-btn:hover {
  background: linear-gradient(135deg, #e9ecef, #f8f9fa);
  transform: translateX(5px);
  border-color: #1890ff;
  color: #1890ff;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 80px 30px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px dashed #e8e8e8;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 25px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 30px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px dashed #d9d9d9;
}

.empty-state.small {
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 25px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 22px;
  font-weight: 600;
}

.empty-state p {
  color: #666;
  font-size: 16px;
  margin: 0;
  font-weight: 500;
}

/* 申请列表 */
.applications-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.application-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.4s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.application-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.app-info h4 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
  flex: 1;
}

.app-status {
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.app-status.pending {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.app-time {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  background: #f8f9fa;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #f0f0f0;
  white-space: nowrap;
}

.card-content {
  margin-bottom: 20px;
}

.app-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px solid #f0f0f0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 15px;
  color: #333;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px solid #f0f0f0;
}

.approve-btn,
.reject-btn,
.detail-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.approve-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.reject-btn {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.detail-btn {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #333;
  border: 2px solid #e8e8e8;
}

.approve-btn:hover,
.reject-btn:hover,
.detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 右侧边栏 */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 快捷操作 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-item {
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 16px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.4s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.action-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.action-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-icon.approval {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.action-icon.vehicle {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.action-icon.user {
  background: linear-gradient(135deg, #722ed1, #9254de);
  color: white;
}

.action-icon.mission {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.action-icon.my-app {
  background: linear-gradient(135deg, #13c2c2, #36cfc9);
  color: white;
}

.action-icon.new-app {
  background: linear-gradient(135deg, #eb2f96, #f759ab);
  color: white;
}

.action-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

/* 今日任务 */
.missions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mission-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.mission-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.mission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.mission-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.mission-info h5 {
  margin: 0;
  font-size: 15px;
  color: #333;
  font-weight: 600;
  flex: 1;
}

.mission-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
}

.mission-status.assigned {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.mission-status.in_progress {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.mission-status.completed {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.mission-time {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  background: #f8f9fa;
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  white-space: nowrap;
}

.mission-content {
  padding-top: 12px;
}

.mission-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #666;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}

.meta-item .icon {
  color: #999;
  font-size: 14px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 24px;
  padding: 32px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.modal-body {
  margin-bottom: 24px;
}

.modal-body p {
  margin: 0;
  color: #666;
  font-size: 15px;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
}

.modal-actions {
  display: flex;
  gap: 16px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cancel-btn {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #666;
  border: 2px solid #e8e8e8;
}

.confirm-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.cancel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #e9ecef, #f8f9fa);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(82, 196, 26, 0.4);
  background: linear-gradient(135deg, #73d13d, #52c41a);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .right-sidebar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .app-details {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 20px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .home-btn,
  .employee-btn,
  .logout-btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .right-sidebar {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .app-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .app-details {
    grid-template-columns: 1fr;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .approve-btn,
  .reject-btn,
  .detail-btn {
    width: 100%;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    gap: 12px;
  }
  
  .stat-card {
    padding: 20px;
    gap: 16px;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }
  
  .stat-value {
    font-size: 36px;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .action-item {
    padding: 20px 12px;
    gap: 12px;
  }
  
  .action-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  
  .application-card,
  .mission-card {
    padding: 16px;
  }
  
  .app-details,
  .card-actions {
    padding: 16px;
  }
  
  .modal-content {
    padding: 24px;
    margin: 0 16px;
  }
}
</style>