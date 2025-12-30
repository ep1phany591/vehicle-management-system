<template>
  <div class="manager-missions">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <img :src="user.avatar" alt="头像" class="avatar">
        <div class="user-details">
          <h3>{{ user.real_name }}</h3>
          <p>车队任务管理</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToDashboard" class="home-btn">工作台</button>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <!-- 任务筛选 -->
    <div class="filter-section">
      <div class="filter-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          class="filter-tab"
          :class="{ active: activeTab === tab.value }"
          @click="changeTab(tab.value)"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- 待分配任务 -->
    <div class="pending-section" v-if="activeTab === 'pending'">
      <div class="section-header">
        <h3>待分配任务 ({{ pendingMissions.length }})</h3>
        <button @click="refreshData" class="refresh-btn">刷新</button>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="pendingMissions.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无待分配任务</p>
      </div>
      
      <div v-else class="missions-list">
        <div 
          v-for="mission in pendingMissions" 
          :key="mission.application_id"
          class="mission-card"
        >
          <div class="mission-header">
            <div class="mission-info">
              <h4>{{ mission.reason }}</h4>
              <span class="mission-time">{{ formatDateTime(mission.start_time) }}</span>
            </div>
            <span class="mission-status pending">待分配</span>
          </div>
          
          <div class="mission-details">
            <div class="detail-item">
              <span class="detail-label">申请人：</span>
              <span class="detail-value">{{ mission.applicant_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">乘车人数：</span>
              <span class="detail-value">{{ mission.people_count }}人</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">车型：</span>
              <span class="detail-value">{{ getVehicleTypeText(mission.vehicle_type) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">目的地：</span>
              <span class="detail-value">{{ mission.destination || '未指定' }}</span>
            </div>
          </div>
          
          <div class="mission-footer">
            <div class="time-range">
              {{ formatFullDateTime(mission.start_time) }} - {{ formatTime(mission.end_time) }}
            </div>
            <div class="mission-actions">
              <button 
                @click="assignMission(mission)"
                class="assign-btn"
              >
                分配司机
              </button>
              <button 
                @click="viewMissionDetail(mission)"
                class="detail-btn"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 已分配任务 -->
    <div class="assigned-section" v-if="activeTab === 'assigned'">
      <div class="section-header">
        <h3>已分配任务 ({{ assignedMissions.length }})</h3>
      </div>
      
      <div v-if="assignedMissions.length === 0" class="empty-state">
        <div class="empty-icon">👨‍✈️</div>
        <p>暂无已分配任务</p>
      </div>
      
      <div v-else class="missions-grid">
        <div 
          v-for="mission in assignedMissions" 
          :key="mission.application_id"
          class="mission-item"
        >
          <div class="item-header">
            <h5>{{ mission.reason }}</h5>
            <span class="mission-status" :class="mission.status">
              {{ getStatusText(mission.status) }}
            </span>
          </div>
          <div class="item-details">
            <div class="detail">
              <span class="label">司机：</span>
              <span class="value">{{ mission.driver_name || '未分配' }}</span>
            </div>
            <div class="detail">
              <span class="label">车辆：</span>
              <span class="value">{{ mission.license_plate || '未分配' }}</span>
            </div>
            <div class="detail">
              <span class="label">时间：</span>
              <span class="value">{{ formatTime(mission.start_time) }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button 
              @click="viewMissionDetail(mission)"
              class="view-btn"
            >
              查看
            </button>
            <button 
              v-if="mission.status === 'assigned'"
              @click="reassignMission(mission)"
              class="reassign-btn"
            >
              重新分配
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 进行中任务 -->
    <div class="inprogress-section" v-if="activeTab === 'inprogress'">
      <div class="section-header">
        <h3>进行中任务 ({{ inProgressMissions.length }})</h3>
      </div>
      
      <div v-if="inProgressMissions.length === 0" class="empty-state">
        <div class="empty-icon">🚗</div>
        <p>暂无进行中任务</p>
      </div>
      
      <div v-else class="missions-list">
        <div 
          v-for="mission in inProgressMissions" 
          :key="mission.application_id"
          class="mission-card"
        >
          <div class="mission-header">
            <div class="mission-title">
              <h4>{{ mission.reason }}</h4>
              <span class="mission-time">{{ formatTime(mission.start_time) }}</span>
            </div>
            <span class="mission-status in_progress">进行中</span>
          </div>
          
          <div class="mission-details">
            <div class="detail-row">
              <div class="detail-item">
                <span class="detail-label">司机：</span>
                <span class="detail-value">{{ mission.driver_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">车辆：</span>
                <span class="detail-value">{{ mission.license_plate }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="detail-label">当前位置：</span>
                <span class="detail-value">{{ mission.current_location || '未知' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">已用时：</span>
                <span class="detail-value">{{ calculateDuration(mission.actual_start_time) }}</span>
              </div>
            </div>
          </div>
          
          <div class="mission-footer">
            <button 
              @click="contactDriver(mission)"
              class="contact-btn"
            >
              联系司机
            </button>
            <button 
              @click="viewMissionDetail(mission)"
              class="detail-btn"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分配司机模态框 -->
    <div v-if="showAssignModal" class="modal-overlay">
      <div class="modal-content">
        <h3>分配司机</h3>
        <p><strong>任务：</strong>{{ selectedMission?.reason }}</p>
        
        <div class="form-group">
          <label>选择车辆</label>
          <select v-model="assignment.vehicle_id" class="form-select">
            <option value="">请选择车辆</option>
            <option 
              v-for="vehicle in availableVehicles" 
              :key="vehicle.vehicle_id"
              :value="vehicle.vehicle_id"
            >
              {{ vehicle.license_plate }} ({{ getVehicleTypeText(vehicle.vehicle_type) }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>选择司机</label>
          <select v-model="assignment.driver_id" class="form-select">
            <option value="">请选择司机</option>
            <option 
              v-for="driver in availableDrivers" 
              :key="driver.user_id"
              :value="driver.user_id"
            >
              {{ driver.real_name }} ({{ driver.phone }})
            </option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button @click="showAssignModal = false" class="cancel-btn">取消</button>
          <button @click="confirmAssignment" class="confirm-btn">确认分配</button>
        </div>
      </div>
    </div>

    <!-- 任务统计 -->
    <div class="stats-section">
      <div class="section-header">
        <h3>车队统计</h3>
        <span class="stats-date">{{ currentDate }}</span>
      </div>
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalMissions }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completedMissions }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚗</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.availableDrivers }}</div>
            <div class="stat-label">可用司机</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.onTimeRate }}%</div>
            <div class="stat-label">准时率</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ManagerMissions',
  data() {
    return {
      user: {},
      activeTab: 'pending',
      loading: false,
      
      tabs: [
        { value: 'pending', label: '待分配', count: 0 },
        { value: 'assigned', label: '已分配', count: 0 },
        { value: 'inprogress', label: '进行中', count: 0 },
        { value: 'completed', label: '已完成', count: 0 }
      ],
      
      pendingMissions: [],
      assignedMissions: [],
      inProgressMissions: [],
      completedMissions: [],
      
      showAssignModal: false,
      selectedMission: null,
      assignment: {
        vehicle_id: '',
        driver_id: ''
      },
      
      availableVehicles: [],
      availableDrivers: [],
      
      stats: {
        totalMissions: 0,
        completedMissions: 0,
        availableDrivers: 0,
        onTimeRate: 0
      },
      
      // 模拟数据
      mockPendingMissions: [
        {
          application_id: 1,
          reason: '客户公司拜访',
          applicant_name: '张经理',
          people_count: 3,
          vehicle_type: 'small',
          destination: '科技园区A座',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date().toISOString()
        },
        {
          application_id: 2,
          reason: '会议接送',
          applicant_name: '李总监',
          people_count: 2,
          vehicle_type: 'small',
          destination: '国际会议中心',
          start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      
      mockAssignedMissions: [
        {
          application_id: 3,
          reason: '机场接机',
          status: 'assigned',
          driver_name: '王师傅',
          license_plate: '京A88888',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
  },
  computed: {
    currentDate() {
      return new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadMissions();
    this.loadAvailableResources();
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
        
        // 获取待分配任务
        const pendingRes = await fetch('http://localhost:3000/api/manager/pending-missions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          if (pendingData.success) {
            this.pendingMissions = pendingData.data || [];
            this.tabs[0].count = this.pendingMissions.length;
          }
        } else {
          this.loadMockData();
        }
        
        // 获取已分配任务
        const assignedRes = await fetch('http://localhost:3000/api/applications?status=assigned&limit=20', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (assignedRes.ok) {
          const assignedData = await assignedRes.json();
          if (assignedData.success) {
            this.assignedMissions = assignedData.data || [];
            this.tabs[1].count = this.assignedMissions.length;
          }
        }
        
        // 获取进行中任务
        const inProgressRes = await fetch('http://localhost:3000/api/applications?status=in_progress&limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (inProgressRes.ok) {
          const inProgressData = await inProgressRes.json();
          if (inProgressData.success) {
            this.inProgressMissions = inProgressData.data || [];
            this.tabs[2].count = this.inProgressMissions.length;
          }
        }
        
      } catch (error) {
        console.error('加载任务失败:', error);
        this.loadMockData();
      } finally {
        this.loading = false;
      }
    },
    
    async loadAvailableResources() {
      try {
        const token = localStorage.getItem('token');
        
        // 获取可用车辆
        const vehiclesRes = await fetch('http://localhost:3000/api/vehicles?status=available', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json();
          if (vehiclesData.success) {
            this.availableVehicles = vehiclesData.data || [];
          }
        }
        
        // 获取车队司机
        const driversRes = await fetch('http://localhost:3000/api/manager/drivers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (driversRes.ok) {
          const driversData = await driversRes.json();
          if (driversData.success) {
            this.availableDrivers = driversData.data || [];
            this.stats.availableDrivers = this.availableDrivers.length;
          }
        }
        
      } catch (error) {
        console.error('加载资源失败:', error);
        this.loadMockResources();
      }
    },
    
    loadMockData() {
      this.pendingMissions = this.mockPendingMissions;
      this.assignedMissions = this.mockAssignedMissions;
      this.inProgressMissions = [
        {
          application_id: 4,
          reason: '员工班车',
          status: 'in_progress',
          driver_name: '李师傅',
          license_plate: '京A99999',
          current_location: '京藏高速',
          actual_start_time: new Date(Date.now() - 3600000).toISOString(),
          start_time: new Date().toISOString()
        }
      ];
      
      this.tabs[0].count = this.pendingMissions.length;
      this.tabs[1].count = this.assignedMissions.length;
      this.tabs[2].count = this.inProgressMissions.length;
      
      this.stats = {
        totalMissions: 15,
        completedMissions: 8,
        availableDrivers: 5,
        onTimeRate: 92
      };
    },
    
    loadMockResources() {
      this.availableVehicles = [
        { vehicle_id: 1, license_plate: '京A88888', vehicle_type: 'small' },
        { vehicle_id: 2, license_plate: '京A66666', vehicle_type: 'small' },
        { vehicle_id: 3, license_plate: '京A77777', vehicle_type: 'business' }
      ];
      
      this.availableDrivers = [
        { user_id: 'driver001', real_name: '王师傅', phone: '13800138001' },
        { user_id: 'driver002', real_name: '李师傅', phone: '13800138002' },
        { user_id: 'driver003', real_name: '张师傅', phone: '13800138003' }
      ];
      
      this.stats.availableDrivers = this.availableDrivers.length;
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
        pending: '待审批',
        approved: '已批准',
        assigned: '已分配',
        confirmed: '已接受',
        in_progress: '进行中',
        completed: '已完成',
        rejected: '已拒绝',
        cancelled: '已取消'
      };
      return statusMap[status] || status;
    },
    
    calculateDuration(startTime) {
      if (!startTime) return '0分钟';
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now - start;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes}分钟`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}小时${minutes}分钟`;
      }
    },
    
    changeTab(tab) {
      this.activeTab = tab;
    },
    
    assignMission(mission) {
      this.selectedMission = mission;
      this.assignment = {
        vehicle_id: '',
        driver_id: ''
      };
      this.showAssignModal = true;
    },
    
    async confirmAssignment() {
      if (!this.assignment.vehicle_id || !this.assignment.driver_id) {
        alert('请选择车辆和司机');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:3000/api/manager/assign-driver', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            application_id: this.selectedMission.application_id,
            driver_id: this.assignment.driver_id
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('任务分配成功');
            this.showAssignModal = false;
            this.loadMissions();
          }
        } else {
          throw new Error('分配失败');
        }
      } catch (error) {
        console.error('分配任务失败:', error);
        alert('分配任务失败');
      }
    },
    
    reassignMission(mission) {
      this.selectedMission = mission;
      this.assignMission(mission);
    },
    
    contactDriver(mission) {
      if (mission.driver_phone) {
        window.location.href = `tel:${mission.driver_phone}`;
      } else {
        alert('司机联系电话未设置');
      }
    },
    
    viewMissionDetail(mission) {
      this.$router.push(`/application/${mission.application_id}`);
    },
    
    refreshData() {
      this.loadMissions();
      this.loadAvailableResources();
    },
    
    goToDashboard() {
      this.$router.push('/manager');
    },
    
    logout() {
      localStorage.clear();
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.manager-missions {
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

/* 任务筛选 */
.filter-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.filter-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #fa8c16);
}

.filter-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 12px 24px;
  border: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  color: #666;
}

.filter-tab:hover {
  border-color: #1890ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.filter-tab.active {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  border-color: transparent;
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* 任务区段 */
.pending-section,
.assigned-section,
.inprogress-section,
.stats-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.pending-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #fa8c16, #ff4d4f);
}

.assigned-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #722ed1);
}

.inprogress-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #52c41a, #1890ff);
}

.stats-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #722ed1, #fa8c16, #52c41a);
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

.mission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.mission-info {
  flex: 1;
}

.mission-info h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.mission-time {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  background: #f8f9fa;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #f0f0f0;
  display: inline-block;
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

.mission-status.pending {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.mission-status.assigned {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.mission-status.in_progress {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

/* 任务详情 */
.mission-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px solid #f0f0f0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 2px dashed #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
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

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.mission-footer {
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.time-range {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 12px;
  border: 2px solid #f0f0f0;
}

.mission-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.assign-btn,
.detail-btn,
.contact-btn,
.view-btn,
.reassign-btn {
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.assign-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.assign-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

.detail-btn {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #333;
  border: 2px solid #e8e8e8;
}

.detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.contact-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.contact-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(82, 196, 26, 0.4);
}

.view-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.reassign-btn {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.view-btn:hover,
.reassign-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(250, 140, 22, 0.4);
}

/* 网格布局 */
.missions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.mission-item {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid transparent;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.mission-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.mission-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #52c41a, #1890ff);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.item-header h5 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  flex: 1;
}

.item-details {
  margin-bottom: 20px;
}

.detail {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
}

.detail:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 10px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 22px;
  font-weight: 600;
}

.modal-content p {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 15px;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}

.form-select {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  transition: all 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 14px 0;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cancel-btn {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #333;
  border: 2px solid #e8e8e8;
}

.confirm-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.cancel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

/* 统计卡片 */
.stats-date {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  background: rgba(24, 144, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  font-size: 36px;
  width: 60px;
  height: 60px;
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

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .mission-details {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .manager-missions {
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
  
  .filter-tabs {
    justify-content: center;
  }
  
  .detail-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .missions-grid {
    grid-template-columns: 1fr;
  }
  
  .mission-actions {
    flex-direction: column;
  }
  
  .assign-btn,
  .detail-btn,
  .contact-btn {
    width: 100%;
  }
  
  .modal-content {
    padding: 24px;
    width: 95%;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
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
  
  .modal-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>