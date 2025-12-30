<template>
  <div class="driver-missions">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <img :src="user.avatar" alt="头像" class="avatar">
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

    <!-- 任务状态统计 -->
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

    <!-- 当前任务 -->
    <div class="current-missions">
      <div class="section-header">
        <h3>我的任务</h3>
        <button @click="refreshMissions" class="refresh-btn">刷新</button>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="filteredMissions.length === 0" class="empty-state">
        <div class="empty-icon">🚗</div>
        <h3>暂无任务</h3>
        <p>当前没有分配给您的任务</p>
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
            <div v-if="mission.brand && mission.model" class="detail-item">
              <span class="detail-label">车辆信息：</span>
              <span class="detail-value">{{ mission.brand }} {{ mission.model }}</span>
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
              <button 
                v-if="mission.status === 'assigned'"
                @click="acceptMission(mission)"
                class="action-btn accept"
              >
                ✅ 接受任务
              </button>
              <button 
                v-if="mission.status === 'assigned'"
                @click="rejectMission(mission)"
                class="action-btn reject"
              >
                ❌ 拒绝任务
              </button>
              <button 
                v-if="mission.status === 'confirmed'"
                @click="startMission(mission)"
                class="action-btn start"
              >
                🚗 开始任务
              </button>
              <button 
                v-if="mission.status === 'in_progress'"
                @click="completeMission(mission)"
                class="action-btn complete"
              >
                🏁 完成任务
              </button>
              <button 
                @click="viewMissionDetail(mission)"
                class="action-btn detail"
              >
                📄 查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日已完成任务 -->
    <div v-if="todayCompleted.length > 0" class="completed-section">
      <div class="section-header">
        <h3>今日已完成</h3>
        <span class="completed-count">已完成 {{ todayCompleted.length }} 个任务</span>
      </div>
      <div class="completed-list">
        <div 
          v-for="mission in todayCompleted" 
          :key="mission.application_id"
          class="completed-item"
        >
          <span class="completed-reason">{{ mission.reason }}</span>
          <span class="completed-time">{{ formatTime(mission.complete_time || mission.actual_end_time) }}</span>
        </div>
      </div>
    </div>

    <!-- 月度统计 -->
    <div class="monthly-stats">
      <div class="section-header">
        <h3>本月统计</h3>
      </div>
      <div class="stats-info">
        <div class="stat-item">
          <span class="stat-label">本月任务数</span>
          <span class="stat-value">{{ monthlyStats.totalMissions }} 次</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总行驶里程</span>
          <span class="stat-value">{{ monthlyStats.totalMileage }} km</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">任务完成率</span>
          <span class="stat-value">{{ monthlyStats.completionRate }}%</span>
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
      todayCompleted: [],
      loading: false,
      filterStatus: 'all',
      
      stats: {
        assignedCount: 0,
        confirmedCount: 0,
        inProgressCount: 0,
        completedCount: 0
      },
      
      monthlyStats: {
        totalMissions: 12,
        totalMileage: 1560,
        completionRate: 95
      }
    };
  },
  computed: {
    // 计算统计数据
    computedStats() {
      const assigned = this.missions.filter(m => m.status === 'assigned').length;
      const confirmed = this.missions.filter(m => m.status === 'confirmed').length;
      const inProgress = this.missions.filter(m => m.status === 'in_progress').length;
      const completed = this.missions.filter(m => m.status === 'completed').length;
      
      return { assigned, confirmed, inProgress, completed };
    }
  },
  watch: {
    missions: {
      handler(newMissions) {
        this.updateStats(newMissions);
        this.filterMissionsByStatus();
        this.updateTodayCompleted(newMissions);
      },
      immediate: true
    },
    
    filterStatus(newFilter) {
      this.filterMissionsByStatus(newFilter);
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadMissions();
  },
  methods: {
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    async loadMissions() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        
        // 调用后端API获取司机任务
        const response = await fetch('http://localhost:3000/api/driver/missions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.missions = result.data || [];
          }
        } else {
          this.loadMockData();
        }
      } catch (error) {
        console.error('加载任务失败:', error);
        this.loadMockData();
      } finally {
        this.loading = false;
      }
    },
    
    loadMockData() {
      this.missions = [
        {
          application_id: 1,
          reason: '客户公司拜访',
          status: 'assigned',
          vehicle_type: 'small',
          people_count: 3,
          applicant_name: '张经理',
          license_plate: '京A88888',
          brand: '奥迪',
          model: 'A6L',
          destination: '科技园区A座',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date().toISOString()
        },
        {
          application_id: 2,
          reason: '机场接机',
          status: 'confirmed',
          vehicle_type: 'business',
          people_count: 2,
          applicant_name: '李总监',
          license_plate: '京A77777',
          brand: '奔驰',
          model: 'V级',
          destination: '首都机场T3航站楼',
          start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date(Date.now() - 3600000).toISOString()
        },
        {
          application_id: 3,
          reason: '员工班车',
          status: 'in_progress',
          vehicle_type: 'coach',
          people_count: 35,
          applicant_name: '王主管',
          license_plate: '京A99999',
          brand: '宇通',
          model: 'ZK6128',
          destination: '公司总部',
          start_time: new Date(Date.now() - 3600000).toISOString(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    },
    
    updateStats(missions) {
      this.stats = this.computedStats;
    },
    
    filterMissionsByStatus(status = this.filterStatus) {
      if (status === 'all') {
        this.filteredMissions = [...this.missions];
      } else {
        this.filteredMissions = this.missions.filter(mission => mission.status === status);
      }
    },
    
    filterMissions(status) {
      this.filterStatus = status;
    },
    
    updateTodayCompleted(missions) {
      const today = new Date().toDateString();
      this.todayCompleted = missions.filter(mission => {
        const missionDate = new Date(mission.complete_time || mission.actual_end_time).toDateString();
        return mission.status === 'completed' && missionDate === today;
      }).slice(0, 5);
    },
    
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    formatFullDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    formatTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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
        assigned: '待接受',
        confirmed: '已接受',
        in_progress: '进行中',
        completed: '已完成'
      };
      return statusMap[status] || status;
    },
    
    async acceptMission(mission) {
      if (!confirm('确定要接受这个任务吗？')) return;
      
      try {
        const token = localStorage.getItem('token');
        
        await fetch(`http://localhost:3000/api/applications/${mission.application_id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'confirmed'
          })
        });
        
        alert('任务已接受');
        this.loadMissions();
      } catch (error) {
        console.error('接受任务失败:', error);
        alert('操作失败');
      }
    },
    
    async rejectMission(mission) {
  const reason = prompt('请输入拒绝原因:');
  if (!reason) return;

  if (!confirm(`确定要拒绝这个任务吗？\n拒绝原因：${reason}`)) return;

  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `http://localhost:3000/api/driver/missions/${mission.application_id}/reject`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reject_reason: reason
        })
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      alert('已拒绝任务，等待队长重新分配');
      this.loadMissions();
    } else {
      alert(result.message || '拒绝失败');
    }
  } catch (error) {
    console.error('拒绝任务失败:', error);
    alert('操作失败，请检查网络连接');
  }
}
,
    
    async startMission(mission) {
      if (!confirm('确定要开始执行这个任务吗？')) return;
      
      try {
        const token = localStorage.getItem('token');
        
        await fetch(`http://localhost:3000/api/applications/${mission.application_id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'in_progress',
            actual_start_time: new Date().toISOString()
          })
        });
        
        alert('任务已开始');
        this.loadMissions();
      } catch (error) {
        console.error('开始任务失败:', error);
        alert('操作失败');
      }
    },
    
    async completeMission(mission) {
      const mileage = prompt('请输入实际行驶里程（公里）:');
      if (!mileage || isNaN(mileage)) {
        alert('请输入有效的里程数');
        return;
      }
      
      if (!confirm(`确定要完成任务吗？\n行驶里程：${mileage}公里`)) return;
      
      try {
        const token = localStorage.getItem('token');
        
        await fetch(`http://localhost:3000/api/applications/${mission.application_id}/status`, {
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
        
        alert('任务已完成');
        this.loadMissions();
      } catch (error) {
        console.error('完成任务失败:', error);
        alert('操作失败');
      }
    },
    
    viewMissionDetail(mission) {
      this.$router.push(`/application/${mission.application_id}`);
    },
    
    refreshMissions() {
      this.loadMissions();
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