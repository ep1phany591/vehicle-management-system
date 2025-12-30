<template>
  <div class="manager-dashboard">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-section">
        <div class="avatar-container">
          <span class="avatar-letter">{{ userInitial }}</span>
        </div>
        <div class="user-info">
          <h2>{{ user.real_name }}</h2>
          <p class="user-role">车队队长</p>
          <p v-if="fleetInfo" class="fleet-name">{{ fleetInfo.fleet_name }}</p>
        </div>
      </div>
      <div class="header-actions">
        <!-- 添加员工首页按钮 -->
        <button @click="switchToEmployeeView" class="btn btn-employee">
          <span>👤</span>
          <span>员工首页</span>
        </button>
        <button @click="goToDashboard" class="btn btn-secondary">
          <span>🏠</span>
          <span>工作台</span>
        </button>
        <button @click="logout" class="btn btn-danger">
          <span>🚪</span>
          <span>退出</span>
        </button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 车队概览卡片 -->
      <div class="fleet-overview">
        <div class="overview-header">
          <h3>车队概览</h3>
          <div class="fleet-status" :class="fleetStatusClass">
            {{ fleetStatusText }}
          </div>
        </div>
        
        <div class="stats-cards">
          <div class="stat-card" @click="goToVehicles">
            <div class="stat-icon vehicles">
              <span>🚗</span>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ fleetStats.vehicleCount || 0 }}</div>
              <div class="stat-label">车辆总数</div>
            </div>
          </div>
          
          <div class="stat-card" @click="goToDrivers">
            <div class="stat-icon drivers">
              <span>👨‍✈️</span>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ fleetStats.driverCount || 0 }}</div>
              <div class="stat-label">在线司机</div>
            </div>
          </div>
          
          <div class="stat-card" @click="goToTasks">
            <div class="stat-icon active">
              <span>📋</span>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ fleetStats.activeMissions || 0 }}</div>
              <div class="stat-label">进行中任务</div>
            </div>
          </div>
          
          <div class="stat-card" @click="goToAvailable">
            <div class="stat-icon available">
              <span>✅</span>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ fleetStats.availableVehicles || 0 }}</div>
              <div class="stat-label">可用车辆</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主要功能区（两列布局） -->
      <div class="content-grid">
        <!-- 左侧：任务管理 -->
        <div class="left-column">
          <!-- 待分配任务 -->
          <div class="task-section">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon">📋</span>
                待分配任务
              </h3>
              <button @click="goToAllTasks" class="btn btn-link">
                <span>查看全部</span>
                <span class="icon">→</span>
              </button>
            </div>
            
            <div v-if="pendingTasks.length === 0" class="empty-state">
              <div class="empty-icon">✅</div>
              <h4>暂无待分配任务</h4>
              <p>所有任务已分配完成</p>
            </div>
            
            <div v-else class="tasks-list">
              <div 
                v-for="task in pendingTasks.slice(0, 3)" 
                :key="task.application_id"
                class="task-card"
                @click="assignTask(task)"
              >
                <div class="task-main">
                  <div class="task-header">
                    <h4 class="task-title">{{ task.reason }}</h4>
                    <span class="task-badge pending">待分配</span>
                  </div>
                  
                  <div class="task-info">
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">申请人</span>
                        <span class="info-value">{{ task.applicant_name }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">用车时间</span>
                        <span class="info-value">{{ formatTime(task.start_time) }}</span>
                      </div>
                    </div>
                    
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">车型</span>
                        <span class="info-value">{{ getVehicleTypeText(task.vehicle_type) }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">乘车人数</span>
                        <span class="info-value">{{ task.people_count }}人</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="task-actions">
                  <button @click.stop="viewTaskDetails(task)" class="btn btn-sm btn-outline">
                    查看详情
                  </button>
                  <button @click.stop="assignTask(task)" class="btn btn-sm btn-primary">
                    立即分配
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 今日任务时间线 -->
          <div class="timeline-section">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon">📅</span>
                今日任务安排
              </h3>
              <button @click="goToTodaySchedule" class="btn btn-link">
                <span>查看全部</span>
                <span class="icon">→</span>
              </button>
            </div>
            
            <div v-if="todayMissions.length === 0" class="empty-state small">
              <div class="empty-icon">📅</div>
              <p>今日暂无任务安排</p>
            </div>
            
            <div v-else class="timeline">
              <div 
                v-for="(mission, index) in todayMissions.slice(0, 4)" 
                :key="mission.application_id"
                class="timeline-item"
                @click="viewMissionDetail(mission)"
              >
                <div class="timeline-marker">
                  <div class="marker-dot"></div>
                  <div v-if="index !== todayMissions.slice(0, 4).length - 1" class="marker-line"></div>
                </div>
                
                <div class="timeline-content">
                  <div class="timeline-time">{{ formatTimeRange(mission.start_time, mission.end_time) }}</div>
                  <div class="timeline-card">
                    <div class="mission-header">
                      <div class="mission-info">
                        <h5>{{ mission.reason }}</h5>
                        <span :class="['mission-status', mission.status]">
                          {{ getMissionStatusText(mission.status) }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="mission-details">
                      <div class="detail-row">
                        <span class="detail-item">
                          <span class="icon">🚗</span>
                          {{ mission.license_plate || '待分配' }}
                        </span>
                        <span class="detail-item">
                          <span class="icon">👨‍✈️</span>
                          {{ mission.driver_name || '待分配司机' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：资源状态 -->
        <div class="right-column">
          <!-- 快捷操作 -->
          <div class="quick-actions">
            <h3 class="section-title">
              <span class="title-icon">⚡</span>
              快捷操作
            </h3>
            
            <div class="actions-grid">
              <div class="action-item" @click="goToAllTasks">
                <div class="action-icon task">
                  <span>📋</span>
                </div>
                <span class="action-text">任务分配</span>
              </div>
              
              <div class="action-item" @click="goToDriverManagement">
                <div class="action-icon driver">
                  <span>👤</span>
                </div>
                <span class="action-text">司机管理</span>
              </div>
              
              <div class="action-item" @click="goToVehicleManagement">
                <div class="action-icon vehicle">
                  <span>🚗</span>
                </div>
                <span class="action-text">车辆管理</span>
              </div>
              
              <div class="action-item" @click="goToSchedule">
                <div class="action-icon schedule">
                  <span>📅</span>
                </div>
                <span class="action-text">排班管理</span>
              </div>
            </div>
          </div>

          <!-- 车辆状态 -->
          <div class="resource-section">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon">🚗</span>
                车辆状态
              </h3>
              <button @click="goToVehicles" class="btn btn-link">
                <span>管理</span>
                <span class="icon">→</span>
              </button>
            </div>
            
            <div v-if="vehicles.length === 0" class="empty-state small">
              <div class="empty-icon">🚗</div>
              <p>暂无车辆信息</p>
            </div>
            
            <div v-else class="vehicles-grid">
              <div 
                v-for="vehicle in vehicles.slice(0, 4)" 
                :key="vehicle.vehicle_id"
                class="vehicle-card"
                @click="viewVehicle(vehicle)"
              >
                <div class="vehicle-main">
                  <div class="vehicle-header">
                    <div class="vehicle-plate">{{ vehicle.license_plate }}</div>
                    <span :class="['vehicle-status', vehicle.status]">
                      {{ getVehicleStatusText(vehicle.status) }}
                    </span>
                  </div>
                  
                  <div class="vehicle-info">
                    <div class="info-row">
                      <span class="info-item">
                        <span class="icon">🚘</span>
                        {{ getVehicleTypeText(vehicle.vehicle_type) }}
                      </span>
                    </div>
                    <div class="info-row">
                      <span class="info-item">
                        <span class="icon">👨‍✈️</span>
                        {{ vehicle.driver_name || '未分配' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 司机状态 -->
          <div class="resource-section">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon">👤</span>
                司机状态
              </h3>
              <button @click="goToDrivers" class="btn btn-link">
                <span>管理</span>
                <span class="icon">→</span>
              </button>
            </div>
            
            <div v-if="drivers.length === 0" class="empty-state small">
              <div class="empty-icon">👤</div>
              <p>暂无司机信息</p>
            </div>
            
            <div v-else class="drivers-list">
              <div 
                v-for="driver in drivers.slice(0, 3)" 
                :key="driver.user_id"
                class="driver-card"
                @click="viewDriver(driver)"
              >
                <div class="driver-avatar">
                  <span>{{ driver.real_name.charAt(0) }}</span>
                </div>
                
                <div class="driver-info">
                  <div class="driver-header">
                    <h5>{{ driver.real_name }}</h5>
                    <span :class="['driver-status', driver.status]">
                      {{ getDriverStatusText(driver.status) }}
                    </span>
                  </div>
                  
                  <div class="driver-details">
                    <span class="detail-item">
                      <span class="icon">📞</span>
                      {{ driver.phone }}
                    </span>
                    <span class="detail-item">
                      <span class="icon">📊</span>
                      今日 {{ driver.today_trips || 0 }} 单
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ManagerDashboard',
  data() {
    return {
      user: {},
      fleetInfo: null,
      fleetStatus: 'normal',
      fleetStats: {
        vehicleCount: 0,
        availableVehicles: 0,
        driverCount: 0,
        activeMissions: 0
      },
      pendingTasks: [],
      todayMissions: [],
      vehicles: [],
      drivers: [],
      loading: false
    };
  },
  computed: {
    userInitial() {
      return this.user.real_name ? this.user.real_name.charAt(0).toUpperCase() : 'M';
    },
    fleetStatusText() {
      const statusMap = {
        normal: '正常',
        busy: '繁忙',
        warning: '预警',
        error: '异常'
      };
      return statusMap[this.fleetStatus] || this.fleetStatus;
    },
    fleetStatusClass() {
      return `status-${this.fleetStatus}`;
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadFleetData();
    this.loadPendingTasks();
    this.loadTodayMissions();
    this.loadVehicles();
    this.loadDrivers();
  },
  methods: {
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    async loadFleetData() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:3000/api/manager/fleet-info', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.fleetInfo = result.data;
            this.fleetStats = result.stats || this.fleetStats;
            this.fleetStatus = result.status || 'normal';
          }
        }
      } catch (error) {
        console.error('加载车队数据失败:', error);
        this.loadMockData();
      } finally {
        this.loading = false;
      }
    },
    
    async loadPendingTasks() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/manager/pending-missions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.pendingTasks = result.data || [];
          }
        }
      } catch (error) {
        console.error('加载待分配任务失败:', error);
        this.loadMockTasks();
      }
    },
    
    async loadTodayMissions() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/manager/today-missions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.todayMissions = result.data || [];
          }
        }
      } catch (error) {
        console.error('加载今日任务失败:', error);
        this.loadMockMissions();
      }
    },
    
    async loadVehicles() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/manager/vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.vehicles = result.data || [];
          }
        }
      } catch (error) {
        console.error('加载车辆列表失败:', error);
        this.loadMockVehicles();
      }
    },
    
    async loadDrivers() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/manager/drivers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.drivers = result.data || [];
          }
        }
      } catch (error) {
        console.error('加载司机列表失败:', error);
        this.loadMockDrivers();
      }
    },
    
    loadMockData() {
      this.fleetInfo = {
        fleet_id: 1,
        fleet_name: '小车队',
        fleet_type: 'small',
        manager_id: 'manager001'
      };
      
      this.fleetStats = {
        vehicleCount: 8,
        availableVehicles: 5,
        driverCount: 6,
        activeMissions: 3
      };
      
      this.fleetStatus = 'normal';
    },
    
    loadMockTasks() {
      this.pendingTasks = [
        {
          application_id: 1,
          reason: '客户公司拜访',
          applicant_name: '张经理',
          vehicle_type: 'business',
          people_count: 3,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        },
        {
          application_id: 2,
          reason: '会议接送',
          applicant_name: '李总监',
          vehicle_type: 'small',
          people_count: 2,
          start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        },
        {
          application_id: 3,
          reason: '机场接机',
          applicant_name: '王总',
          vehicle_type: 'coach',
          people_count: 5,
          start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
        }
      ];
    },
    
    loadMockMissions() {
      this.todayMissions = [
        {
          application_id: 4,
          reason: '客户接待',
          start_time: new Date().setHours(9, 0),
          end_time: new Date().setHours(11, 0),
          license_plate: '京A88888',
          driver_name: '王师傅',
          status: 'in_progress'
        },
        {
          application_id: 5,
          reason: '材料运输',
          start_time: new Date().setHours(14, 0),
          end_time: new Date().setHours(16, 0),
          license_plate: '京A66666',
          driver_name: '李师傅',
          status: 'assigned'
        },
        {
          application_id: 6,
          reason: '员工通勤',
          start_time: new Date().setHours(18, 0),
          end_time: new Date().setHours(19, 30),
          license_plate: '京A77777',
          driver_name: '张师傅',
          status: 'confirmed'
        }
      ];
    },
    
    loadMockVehicles() {
      this.vehicles = [
        {
          vehicle_id: 1,
          license_plate: '京A88888',
          vehicle_type: 'small',
          driver_name: '王师傅',
          status: 'in_use'
        },
        {
          vehicle_id: 2,
          license_plate: '京A66666',
          vehicle_type: 'small',
          driver_name: '李师傅',
          status: 'available'
        },
        {
          vehicle_id: 3,
          license_plate: '京A77777',
          vehicle_type: 'business',
          driver_name: '张师傅',
          status: 'available'
        },
        {
          vehicle_id: 4,
          license_plate: '京A55555',
          vehicle_type: 'coach',
          driver_name: '赵师傅',
          status: 'maintenance'
        }
      ];
    },
    
    loadMockDrivers() {
      this.drivers = [
        {
          user_id: 'driver001',
          real_name: '王师傅',
          phone: '13800138001',
          status: 'on_duty',
          today_trips: 3
        },
        {
          user_id: 'driver002',
          real_name: '李师傅',
          phone: '13800138002',
          status: 'on_duty',
          today_trips: 2
        },
        {
          user_id: 'driver003',
          real_name: '张师傅',
          phone: '13800138003',
          status: 'resting',
          today_trips: 0
        }
      ];
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return typeMap[type] || type;
    },
    
    getVehicleStatusText(status) {
      const statusMap = {
        available: '可用',
        in_use: '使用中',
        maintenance: '维修中',
        reserved: '已预约'
      };
      return statusMap[status] || status;
    },
    
    getDriverStatusText(status) {
      const statusMap = {
        on_duty: '在岗',
        resting: '休息',
        driving: '驾驶中',
        off_duty: '下班'
      };
      return statusMap[status] || status;
    },
    
    getMissionStatusText(status) {
      const statusMap = {
        pending: '待分配',
        assigned: '已派车',
        confirmed: '已接受',
        in_progress: '进行中',
        completed: '已完成'
      };
      return statusMap[status] || status;
    },
    
    formatTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    formatTimeRange(startStr, endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
      const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
      return `${startTime}-${endTime}`;
    },
    
    // 切换到员工视图
    switchToEmployeeView() {
      this.$router.push('/home');
    },
    
    assignTask(task) {
      this.$router.push({
        path: '/manager/task-assign',
        query: { id: task.application_id }
      });
    },
    
    viewTaskDetails(task) {
      this.$router.push(`/application/${task.application_id}`);
    },
    
    viewMissionDetail(mission) {
      this.$router.push(`/manager/mission/${mission.application_id}`);
    },
    
    viewVehicle(vehicle) {
      alert(`查看车辆详情: ${vehicle.license_plate}`);
    },
    
    viewDriver(driver) {
      alert(`查看司机详情: ${driver.real_name}`);
    },
    
    goToDashboard() {
      this.$router.push('/manager');
    },
    
    goToTasks() {
      this.$router.push('/manager/missions');
    },
    
    goToAllTasks() {
      this.$router.push('/manager/missions');
    },
    
    goToTaskAssignment() {
      this.$router.push('/manager/task-assign');
    },
    
    goToDriverManagement() {
      this.$router.push('/manager/drivers');
    },
    
    goToVehicleManagement() {
      this.$router.push('/manager/vehicles');
    },
    
    goToSchedule() {
      this.$router.push('/manager/schedule');
    },
    
    goToTodaySchedule() {
      this.$router.push('/manager/schedule/today');
    },
    
    goToVehicles() {
      this.$router.push('/manager/vehicles');
    },
    
    goToDrivers() {
      this.$router.push('/manager/drivers');
    },
    
    goToAvailable() {
      this.$router.push('/manager/vehicles?status=available');
    },
    
    logout() {
      localStorage.clear();
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.manager-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 顶部导航 */
.header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-container {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 24px;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
  transition: transform 0.3s ease;
}

.avatar-container:hover {
  transform: scale(1.05);
}

.user-info h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
  line-height: 1.3;
}

.user-role {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #cbd5e1;
  font-weight: 500;
  background: rgba(100, 116, 139, 0.3);
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
}

.fleet-name {
  margin: 8px 0 0 0;
  font-size: 15px;
  color: #60a5fa;
  font-weight: 600;
  background: rgba(96, 165, 250, 0.1);
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  display: inline-block;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
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
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

/* 新增员工按钮样式 */
.btn-employee {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: white;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}

.btn-employee:hover {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 20px rgba(255, 255, 255, 0.1);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.btn-link {
  background: transparent;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
}

.btn-link:hover {
  color: #2563eb;
  background: transparent;
  transform: translateX(3px);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.btn-outline {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* 主要内容区域 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

/* 车队概览 */
.fleet-overview {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.fleet-overview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981);
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.overview-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.fleet-status {
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-normal {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.status-busy {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.status-warning {
  background: linear-gradient(135deg, #ef4444, #f87171);
  color: white;
}

.status-error {
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  color: white;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #f1f5f9;
  transition: all 0.4s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: #3b82f6;
  box-shadow: 0 16px 40px rgba(59, 130, 246, 0.15);
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.stat-icon.vehicles {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.stat-icon.drivers {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.stat-icon.available {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.stat-details {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 6px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* 主要内容网格布局 */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 32px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* 左侧列 */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 右侧列 */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 通用区块样式 */
.task-section,
.timeline-section,
.quick-actions,
.resource-section {
  background: white;
  border-radius: 20px;
  padding: 28px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.task-section::before,
.timeline-section::before,
.quick-actions::before,
.resource-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
  opacity: 0.8;
}

.task-section::before {
  background: linear-gradient(to bottom, #3b82f6, #10b981);
}

.timeline-section::before {
  background: linear-gradient(to bottom, #f59e0b, #ef4444);
}

.quick-actions::before {
  background: linear-gradient(to bottom, #8b5cf6, #ec4899);
}

.resource-section::before {
  background: linear-gradient(to bottom, #10b981, #0d9488);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 10px;
  color: #3b82f6;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  border: 2px dashed #e2e8f0;
}

.empty-state.small {
  padding: 32px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-state h4 {
  font-size: 18px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 12px 0;
}

.empty-state p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

/* 任务卡片 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.task-card:hover {
  transform: translateX(4px);
  border-color: #3b82f6;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.task-main {
  padding: 24px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.task-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  flex: 1;
}

.task-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.task-badge.pending {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .info-row {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
}

.task-actions {
  padding: 20px 24px;
  background: #f8fafc;
  border-top: 2px solid #f1f5f9;
  display: flex;
  gap: 12px;
}

/* 时间线 */
.timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  position: relative;
  flex-shrink: 0;
}

.marker-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border: 3px solid white;
  box-shadow: 0 0 0 3px #fef3c7;
  z-index: 1;
}

.marker-line {
  position: absolute;
  top: 16px;
  width: 2px;
  height: calc(100% + 8px);
  background: linear-gradient(to bottom, #fde68a, transparent);
}

.timeline-content {
  flex: 1;
  padding-bottom: 8px;
}

.timeline-time {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 12px;
  background: #fef3c7;
  padding: 8px 16px;
  border-radius: 12px;
  display: inline-block;
  border: 1px solid #fde68a;
}

.timeline-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
}

.timeline-card:hover {
  border-color: #f59e0b;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
}

.mission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.mission-info {
  flex: 1;
}

.mission-info h5 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.mission-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.mission-status.assigned,
.mission-status.confirmed,
.mission-status.in_progress,
.mission-status.completed {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.mission-details {
  padding-top: 16px;
  border-top: 2px solid #f1f5f9;
}

.detail-row {
  display: flex;
  gap: 24px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.detail-item .icon {
  color: #94a3b8;
  font-size: 16px;
}

/* 快捷操作 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-item {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 24px 16px;
  border: 2px solid #f1f5f9;
  transition: all 0.4s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.action-item:hover {
  transform: translateY(-5px);
  border-color: #8b5cf6;
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.15);
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.action-item:hover .action-icon {
  transform: scale(1.15);
}

.action-icon.task {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.action-icon.driver {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.action-icon.vehicle {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.action-icon.schedule {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.action-text {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
}

/* 车辆网格 */
.vehicles-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vehicle-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
}

.vehicle-card:hover {
  transform: translateX(3px);
  border-color: #10b981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
}

.vehicle-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.vehicle-plate {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  background: #e2e8f0;
  padding: 8px 16px;
  border-radius: 12px;
  font-family: monospace;
}

.vehicle-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.vehicle-status.available {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.vehicle-status.in_use {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.vehicle-status.maintenance {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 司机列表 */
.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.driver-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 20px;
}

.driver-card:hover {
  transform: translateX(3px);
  border-color: #8b5cf6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
}

.driver-avatar {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 20px;
  flex-shrink: 0;
}

.driver-info {
  flex: 1;
}

.driver-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 16px;
}

.driver-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.driver-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.driver-status.on_duty,
.driver-status.driving {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.driver-status.resting {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.driver-status.off_duty {
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  color: white;
}

.driver-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header {
    padding: 20px;
  }
  
  .main-content {
    padding: 24px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 20px 16px;
  }
  
  .user-section {
    flex-direction: column;
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .btn {
    flex: 1;
    min-width: 140px;
    justify-content: center;
  }
  
  .fleet-overview,
  .task-section,
  .timeline-section,
  .quick-actions,
  .resource-section {
    padding: 24px 20px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .content-grid {
    gap: 24px;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .timeline-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .timeline-marker {
    flex-direction: row;
    width: auto;
    height: 40px;
  }
  
  .marker-dot {
    margin-right: 12px;
  }
  
  .marker-line {
    position: relative;
    top: 0;
    left: 16px;
    width: calc(100% - 28px);
    height: 2px;
    background: linear-gradient(to right, #fde68a, transparent);
  }
  
  .timeline-content {
    padding-bottom: 0;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 16px;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .info-row {
    grid-template-columns: 1fr;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .task-actions {
    flex-direction: column;
  }
  
  .btn-sm {
    width: 100%;
  }
}
</style>