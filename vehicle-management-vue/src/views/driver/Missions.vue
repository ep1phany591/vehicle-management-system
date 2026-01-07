<template>
  <div class="driver-missions">
    <div class="header">
      <div class="user-info">
        <img :src="user.avatar || 'https://via.placeholder.com/60'" alt="头像" class="avatar">
        <div class="user-details">
          <h3>{{ user.real_name }}</h3>
          <p>司机任务中心</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToHome" class="home-btn">首页</button>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <div class="mission-stats">
      <div class="stats-cards">
        <div class="stat-card" @click="filterMissions('assigned')">
          <div class="stat-icon assigned">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.assignedCount }}</div>
            <div class="stat-label">待接受</div>
          </div>
        </div>
        <div class="stat-card" @click="filterMissions('confirmed')">
          <div class="stat-icon confirmed">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.confirmedCount }}</div>
            <div class="stat-label">已接受</div>
          </div>
        </div>
        <div class="stat-card" @click="filterMissions('in_progress')">
          <div class="stat-icon in_progress">🚗</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.inProgressCount }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
        <div class="stat-card" @click="filterMissions('completed')">
          <div class="stat-icon completed">🏁</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completedCount }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </div>
    </div>

    <div class="current-missions">
      <div class="section-header">
        <h3>我的任务 ({{ filterStatusText }})</h3>
        <button @click="refreshMissions" class="refresh-btn">刷新任务</button>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="filteredMissions.length === 0" class="empty-state">
        <div class="empty-icon">🚗</div>
        <h3>暂无任务</h3>
        <p>当前分类下没有相关任务</p>
      </div>
      
      <div v-else class="missions-list">
        <div 
          v-for="mission in filteredMissions" 
          :key="mission.application_id"
          class="mission-card"
          :class="mission.status"
        >
          <div class="mission-header">
            <div class="mission-title">
              <h4>{{ mission.reason }}</h4>
              <span class="mission-status" :class="mission.status">
                {{ getStatusText(mission.status) }}
              </span>
            </div>
            <span class="mission-time">{{ formatDateTime(mission.start_time) }}</span>
          </div>
          
          <div class="mission-details">
            <div class="detail-item">
              <span class="detail-label">车型：</span>
              <span class="detail-value">{{ getVehicleTypeText(mission.vehicle_type) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">乘车人数：</span>
              <span class="detail-value">{{ mission.people_count }}人</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">申请人：</span>
              <span class="detail-value">{{ mission.applicant_name || '未知' }}</span>
            </div>
            <div v-if="mission.license_plate" class="detail-item">
              <span class="detail-label">车牌号：</span>
              <span class="detail-value vehicle-plate">{{ mission.license_plate }}</span>
            </div>
            <div v-if="mission.destination" class="detail-item">
              <span class="detail-label">目的地：</span>
              <span class="detail-value">{{ mission.destination }}</span>
            </div>
          </div>
          
          <div class="mission-footer">
            <div class="time-info">
              <div class="time-item">
                <span class="time-label">开始时间：</span>
                <span class="time-value">{{ formatFullDateTime(mission.start_time) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">结束时间：</span>
                <span class="time-value">{{ formatFullDateTime(mission.end_time) }}</span>
              </div>
            </div>
            
            <div class="mission-actions">
              <button v-if="mission.status === 'assigned'" @click="acceptMission(mission)" class="action-btn accept">✅ 接受任务</button>
              <button v-if="mission.status === 'assigned'" @click="rejectMission(mission)" class="action-btn reject">❌ 拒绝任务</button>
              <button v-if="mission.status === 'confirmed'" @click="startMission(mission)" class="action-btn start">🚗 开始任务</button>
              <button v-if="mission.status === 'in_progress'" @click="completeMission(mission)" class="action-btn complete">🏁 完成任务</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="monthly-stats">
      <div class="section-header">
        <h3>个人工作统计</h3>
        <span class="data-source-tag">实时同步自数据库</span>
      </div>
      <div class="stats-info">
        <div class="stat-item">
          <span class="stat-label">本年行程数</span>
          <span class="stat-value">{{ monthlyStats.totalMissions }} 次</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">历史总里程</span>
          <span class="stat-value">{{ monthlyStats.totalMileage }} km</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DriverMissions',
  data() {
    return {
      user: {},
      missions: [],
      filteredMissions: [],
      loading: false,
      filterStatus: 'all',
      stats: {
        assignedCount: 0,
        confirmedCount: 0,
        inProgressCount: 0,
        completedCount: 0
      },
      monthlyStats: {
        totalMissions: 0,
        totalMileage: 0
      }
    };
  },
  computed: {
    filterStatusText() {
      const map = { all: '全部', assigned: '待接受', confirmed: '已接受', in_progress: '进行中', completed: '已完成' };
      return map[this.filterStatus] || '全部';
    }
  },
  watch: {
    missions: {
      handler(newMissions) {
        this.updateStats(newMissions);
        this.filterMissionsByStatus();
      },
      immediate: true
    },
    filterStatus(newVal) {
      this.filterMissionsByStatus(newVal);
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadMissions();
    this.loadDriverStats(); 
  },
  methods: {
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) this.user = JSON.parse(userData);
    },

    // 1. 获取统计数据 (同步 app.js 逻辑)
    async loadDriverStats() {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!userData || !token) return;
        const user = JSON.parse(userData);
        const response = await fetch(`http://localhost:3000/api/drivers/${user.user_id}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success && result.data) {
          this.monthlyStats.totalMissions = result.data.totalMissions;
          this.monthlyStats.totalMileage = result.data.totalMileage;
        }
      } catch (err) {
        console.error('加载司机统计失败:', err);
      }
    },
    
    // 2. 加载任务列表 (使用你确认成功的路径)
    async loadMissions() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/driver/missions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          this.missions = result.data || [];
        }
      } catch (error) {
        console.error('加载任务失败:', error);
      } finally {
        this.loading = false;
      }
    },

    // 3. 接受任务逻辑 (从 Dashboard 迁移并适配)
    async acceptMission(mission) {
      if (!confirm('确认接受此任务？')) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/applications/${mission.application_id}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ status: 'confirmed' })
        });
        const result = await response.json();
        if (result.success) {
          alert('接单成功！请准时出发');
          this.loadMissions(); // 刷新列表
        }
      } catch (error) {
        alert('操作失败');
      }
    },

    // 4. 开始执行 (变更为 进行中)
    async startMission(mission) {
      if (!confirm('确认开始执行任务（签到）？')) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/applications/${mission.application_id}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ status: 'in_progress' })
        });
        if (response.ok) {
          alert('任务已开始，祝您一路平安');
          this.loadMissions();
        }
      } catch (error) {
        alert('启动失败');
      }
    },

    // 5. 完成任务 (带里程输入)
    async completeMission(mission) {
      const mileage = prompt('请输入本次实际行驶里程（公里）:');
      if (mileage === null) return; // 取消输入
      if (!mileage || isNaN(mileage)) return alert('请输入有效的数字');
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/applications/${mission.application_id}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            status: 'completed', 
            actual_mileage: parseFloat(mileage) 
          })
        });
        
        if (response.ok) {
          alert('任务已完成，奖励已计入统计');
          this.loadMissions();
          this.loadDriverStats(); // 立即刷新总数
        }
      } catch (error) {
        alert('提交失败');
      }
    },

    // 6. 拒绝/取消任务
    async rejectMission(mission) {
      if (!confirm('确定要放弃这项任务吗？')) return;
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:3000/api/applications/${mission.application_id}/status`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'assigned', assigned_driver_id: null }) 
        });
        this.loadMissions();
      } catch (error) {
        console.error(error);
      }
    },

    // 内部逻辑方法
    updateStats(missions) {
      this.stats.assignedCount = missions.filter(m => m.status === 'assigned').length;
      this.stats.confirmedCount = missions.filter(m => m.status === 'confirmed').length;
      this.stats.inProgressCount = missions.filter(m => m.status === 'in_progress').length;
      this.stats.completedCount = missions.filter(m => m.status === 'completed').length;
    },
    filterMissionsByStatus(status = this.filterStatus) {
      this.filteredMissions = status === 'all' 
        ? [...this.missions] 
        : this.missions.filter(m => m.status === status);
    },
    filterMissions(status) {
      this.filterStatus = (this.filterStatus === status) ? 'all' : status;
    },
    formatDateTime(s) { return s ? new Date(s).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '' },
    formatFullDateTime(s) { return s ? new Date(s).toLocaleString() : '' },
    getVehicleTypeText(t) { return {small:'小型车', business:'商务车', coach:'大客车'}[t] || t },
    getStatusText(s) { return {assigned:'待接受', confirmed:'已接受', in_progress:'进行中', completed:'已完成'}[s] || s },
    refreshMissions() { this.loadMissions(); this.loadDriverStats(); },
    goToHome() { this.$router.push('/home') },
    logout() { localStorage.clear(); this.$router.push('/login') }
  }
};
</script>
<style scoped>
.driver-missions {
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

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
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

.logout-btn {
  background: rgba(255, 77, 79, 0.9);
  color: white;
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
}

.logout-btn:hover {
  background: rgba(255, 77, 79, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.4);
}

/* 任务状态统计 */
.mission-stats {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.mission-stats::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #fa8c16);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.4s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: #1890ff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.stat-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::after {
  opacity: 1;
}

.stat-icon {
  font-size: 40px;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-icon.assigned { 
  background: linear-gradient(135deg, #e6f7ff, #ffffff); 
  color: #1890ff; 
}

.stat-icon.confirmed { 
  background: linear-gradient(135deg, #f6ffed, #ffffff); 
  color: #52c41a; 
}

.stat-icon.in_progress { 
  background: linear-gradient(135deg, #fff7e6, #ffffff); 
  color: #fa8c16; 
}

.stat-icon.completed { 
  background: linear-gradient(135deg, #f9f0ff, #ffffff); 
  color: #722ed1; 
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 当前任务 */
.current-missions,
.completed-section,
.monthly-stats {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.current-missions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #52c41a);
}

.completed-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #722ed1, #9254de);
}

.monthly-stats::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #fa8c16, #1890ff);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.refresh-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px dashed #e8e8e8;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
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
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px dashed #d9d9d9;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
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

/* 任务列表 */
.missions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mission-card {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid transparent;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.mission-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.mission-card::before {
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

.mission-card:hover::before {
  opacity: 1;
}

.mission-card.assigned {
  border-left: 6px solid #1890ff;
}

.mission-card.confirmed {
  border-left: 6px solid #52c41a;
}

.mission-card.in_progress {
  border-left: 6px solid #fa8c16;
}

.mission-card.completed {
  border-left: 6px solid #722ed1;
}

.mission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.mission-title {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.mission-title h4 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
  flex: 1;
}

.mission-status {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.mission-status.assigned {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.mission-status.confirmed {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.mission-status.in_progress {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.mission-status.completed {
  background: linear-gradient(135deg, #722ed1, #9254de);
  color: white;
}

.mission-time {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  background: #f8f9fa;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #f0f0f0;
  white-space: nowrap;
}

/* 任务详情 */
.mission-details {
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

.vehicle-plate {
  background: linear-gradient(135deg, #e6f7ff, #ffffff);
  color: #1890ff;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  border: 1px solid #bae7ff;
}

.mission-footer {
  margin-top: 20px;
}

.time-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px solid #f0f0f0;
}

.time-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.time-value {
  font-size: 15px;
  color: #333;
  font-weight: 600;
}

.mission-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
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
  flex: 1;
  min-width: 120px;
  justify-content: center;
}

.action-btn.accept {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.action-btn.reject {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.action-btn.start {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.action-btn.complete {
  background: linear-gradient(135deg, #722ed1, #9254de);
  color: white;
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3);
}

.action-btn.detail {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #333;
  border: 2px solid #e8e8e8;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: translateY(0);
}

/* 今日已完成任务 */
.completed-count {
  font-size: 14px;
  color: #1890ff;
  font-weight: 600;
  background: rgba(24, 144, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
}

.completed-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.completed-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.completed-item:hover {
  border-color: #52c41a;
  background: linear-gradient(135deg, #f6ffed, #ffffff);
  transform: translateX(5px);
}

.completed-reason {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.completed-time {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #f0f0f0;
}

/* 月度统计 */
.stats-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.stat-item:hover {
  border-color: #1890ff;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  font-weight: 500;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .mission-details {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-info {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .driver-missions {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .mission-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .mission-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .mission-details {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  
  .mission-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .stats-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .completed-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .completed-time {
    align-self: flex-start;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>