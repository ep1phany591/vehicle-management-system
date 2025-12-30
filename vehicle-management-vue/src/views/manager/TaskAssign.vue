<template>
  <div class="task-assign-page">
    <!-- 顶部导航 -->
    <div class="assign-header">
      <div class="header-left">
        <button @click="goBack" class="btn btn-back">
          <span>←</span>
          返回
        </button>
        <h1>任务分配</h1>
      </div>
      <div class="header-right">
        <span class="task-id">任务ID: {{ taskId }}</span>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="assign-content">
      <!-- 任务信息卡片 -->
      <div class="task-info-card">
        <div class="card-header">
          <h2>任务信息</h2>
          <span class="task-status">待分配</span>
        </div>
        
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载任务信息中...</p>
        </div>
        
        <div v-else-if="taskInfo" class="task-details">
          <div class="detail-row">
            <div class="detail-item">
              <label>申请事由</label>
              <div class="value">{{ taskInfo.reason }}</div>
            </div>
            <div class="detail-item">
              <label>申请人</label>
              <div class="value">{{ taskInfo.applicant_name }}</div>
            </div>
          </div>
          
          <div class="detail-row">
            <div class="detail-item">
              <label>部门</label>
              <div class="value">{{ taskInfo.department || '未填写' }}</div>
            </div>
            <div class="detail-item">
              <label>联系电话</label>
              <div class="value">{{ taskInfo.applicant_phone || '未填写' }}</div>
            </div>
          </div>
          
          <div class="detail-row">
            <div class="detail-item">
              <label>用车时间</label>
              <div class="value">{{ formatDateTime(taskInfo.start_time) }} - {{ formatDateTime(taskInfo.end_time) }}</div>
            </div>
            <div class="detail-item">
              <label>乘车人数</label>
              <div class="value">{{ taskInfo.people_count }}人</div>
            </div>
          </div>
          
          <div class="detail-row">
            <div class="detail-item">
              <label>所需车型</label>
              <div class="value">{{ getVehicleTypeText(taskInfo.vehicle_type) }}</div>
            </div>
            <div class="detail-item">
              <label>目的地</label>
              <div class="value">{{ taskInfo.destination || '未填写' }}</div>
            </div>
          </div>
          
          <div class="detail-row" v-if="taskInfo.contact_person || taskInfo.contact_phone">
            <div class="detail-item">
              <label>联系人</label>
              <div class="value">{{ taskInfo.contact_person || '未填写' }}</div>
            </div>
            <div class="detail-item">
              <label>联系电话</label>
              <div class="value">{{ taskInfo.contact_phone || '未填写' }}</div>
            </div>
          </div>
          
          <div class="detail-row" v-if="taskInfo.remarks">
            <div class="detail-item full-width">
              <label>备注</label>
              <div class="value">{{ taskInfo.remarks }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分配表单 -->
      <div class="assign-form">
        <!-- 司机选择 -->
        <div class="form-section">
          <div class="section-header">
            <h3>选择司机</h3>
            <div class="section-actions">
              <button @click="refreshDrivers" class="btn btn-refresh">
                <span>🔄</span>
                刷新列表
              </button>
            </div>
          </div>
          
          <div v-if="loadingDrivers" class="loading-state">
            <div class="spinner"></div>
            <p>加载司机列表中...</p>
          </div>
          
          <div v-else-if="availableDrivers.length === 0" class="empty-state">
            <div class="empty-icon">👤</div>
            <h4>暂无可用司机</h4>
            <p>当前时段没有符合条件的司机</p>
            <button @click="showAllDrivers = !showAllDrivers" class="btn btn-link">
              {{ showAllDrivers ? '隐藏' : '查看' }}所有司机
            </button>
          </div>
          
          <div v-else class="drivers-grid">
            <!-- 可用司机列表 -->
            <div 
              v-for="driver in filteredDrivers" 
              :key="driver.user_id"
              class="driver-card selectable"
              :class="{ 
                'selected': selectedDriver === driver.user_id,
                'unavailable': !driver.is_available
              }"
              @click="selectDriver(driver)"
            >
              <div class="driver-avatar">
                <span>{{ driver.real_name.charAt(0) }}</span>
              </div>
              
              <div class="driver-info">
                <div class="driver-main">
                  <h4>{{ driver.real_name }}</h4>
                  <div class="driver-status">
                    <span :class="['status-dot', driver.status]"></span>
                    {{ getDriverStatusText(driver.status) }}
                  </div>
                </div>
                
                <div class="driver-details">
                  <div class="detail">
                    <span class="icon">📞</span>
                    {{ driver.phone }}
                  </div>
                  <div class="detail">
                    <span class="icon">📊</span>
                    今日 {{ driver.today_task_count || 0 }}/5 单
                  </div>
                  <div class="detail">
                    <span class="icon">🚗</span>
                    {{ driver.driving_years || 0 }}年驾龄
                  </div>
                </div>
                
                <div v-if="!driver.is_available" class="availability-warning">
                  <span class="warning-icon">⚠️</span>
                  {{ driver.availability_reason }}
                </div>
              </div>
              
              <div v-if="selectedDriver === driver.user_id" class="selection-indicator">
                <span>✓</span>
              </div>
            </div>
          </div>
<!-- 已拒绝司机列表 -->
<div
  v-if="rejectedDrivers.length > 0"
  class="drivers-rejected"
>
  <h4 class="section-subtitle rejected">
    已拒绝该任务的司机
  </h4>

  <ul class="rejected-list">
    <li
      v-for="driver in rejectedDrivers"
      :key="driver.driver_id"
      class="rejected-item"
    >
      <span class="reject-icon">❌</span>
      <span class="reject-name">{{ driver.real_name }}</span>
      <span class="reject-reason">
        （{{ driver.reject_reason || '未填写拒绝原因' }}）
      </span>
    </li>
  </ul>
</div>

        </div>

        <!-- 车辆选择 -->
        <div class="form-section">
          <div class="section-header">
            <h3>选择车辆</h3>
            <div class="section-actions">
              <button @click="refreshVehicles" class="btn btn-refresh">
                <span>🔄</span>
                刷新列表
              </button>
            </div>
          </div>
          
          <div v-if="loadingVehicles" class="loading-state">
            <div class="spinner"></div>
            <p>加载车辆列表中...</p>
          </div>
          
          <div v-else-if="availableVehicles.length === 0 && alternatives.length === 0" class="empty-state">
            <div class="empty-icon">🚗</div>
            <h4>暂无可用车辆</h4>
            <p>当前时段没有符合条件的车辆</p>
          </div>
          
          <div v-else>
            <!-- 匹配车辆列表 -->
            <div v-if="availableVehicles.length > 0" class="vehicles-section">
              <h4 class="section-subtitle">车型匹配</h4>
              <div class="vehicles-grid">
                <div 
                  v-for="vehicle in availableVehicles" 
                  :key="vehicle.vehicle_id"
                  class="vehicle-card selectable"
                  :class="{ 'selected': selectedVehicle === vehicle.vehicle_id }"
                  @click="selectVehicle(vehicle)"
                >
                  <div class="vehicle-header">
                    <div class="vehicle-plate">{{ vehicle.license_plate }}</div>
                    <div class="match-badge" v-if="vehicle.is_exact_match">
                      车型匹配
                    </div>
                  </div>
                  
                  <div class="vehicle-info">
                    <div class="info-row">
                      <span class="info-item">
                        <span class="icon">🚘</span>
                        {{ getVehicleTypeText(vehicle.vehicle_type) }}
                      </span>
                      <span class="info-item">
                        <span class="icon">👥</span>
                        可坐 {{ vehicle.capacity }} 人
                      </span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-item">
                        <span class="icon">🎨</span>
                        {{ vehicle.color || '未指定' }}
                      </span>
                      <span class="info-item">
                        <span class="icon">🏭</span>
                        {{ vehicle.brand }} {{ vehicle.model }}
                      </span>
                    </div>
                    
                    <div v-if="vehicle.current_driver_name" class="info-row">
                      <span class="info-item">
                        <span class="icon">👨‍✈️</span>
                        当前司机: {{ vehicle.current_driver_name }}
                      </span>
                    </div>
                  </div>
                  
                  <div v-if="selectedVehicle === vehicle.vehicle_id" class="selection-indicator">
                    <span>✓</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 替代车辆列表 -->
            <div v-if="alternatives.length > 0" class="vehicles-section">
              <h4 class="section-subtitle alternative">替代车型</h4>
              <div class="vehicles-grid">
                <div 
                  v-for="vehicle in alternatives" 
                  :key="vehicle.vehicle_id"
                  class="vehicle-card selectable alternative"
                  :class="{ 'selected': selectedVehicle === vehicle.vehicle_id }"
                  @click="selectVehicle(vehicle)"
                >
                  <div class="vehicle-header">
                    <div class="vehicle-plate">{{ vehicle.license_plate }}</div>
                    <div class="match-badge alternative">
                      容量满足
                    </div>
                  </div>
                  
                  <div class="vehicle-info">
                    <div class="info-row">
                      <span class="info-item">
                        <span class="icon">🚘</span>
                        {{ getVehicleTypeText(vehicle.vehicle_type) }}
                      </span>
                      <span class="info-item">
                        <span class="icon">👥</span>
                        可坐 {{ vehicle.capacity }} 人
                      </span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-item">
                        <span class="icon">🎨</span>
                        {{ vehicle.color || '未指定' }}
                      </span>
                      <span class="info-item">
                        <span class="icon">🏭</span>
                        {{ vehicle.brand }} {{ vehicle.model }}
                      </span>
                    </div>
                    
                    <div class="info-note">
                      <span class="note-icon">ℹ️</span>
                      车型与申请要求不完全匹配
                    </div>
                  </div>
                  
                  <div v-if="selectedVehicle === vehicle.vehicle_id" class="selection-indicator">
                    <span>✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <button @click="goBack" class="btn btn-cancel">
            取消
          </button>
          <button 
            @click="submitAssignment" 
            class="btn btn-submit"
            :disabled="!canSubmit || submitting"
          >
            <span v-if="submitting" class="spinner-small"></span>
            {{ submitting ? '分配中...' : '确认分配' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      <div class="error-content">
        <span class="error-icon">❌</span>
        <span>{{ errorMessage }}</span>
        <button @click="errorMessage = ''" class="btn-error-close">×</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskAssign',
  data() {
  return {
    taskId: null,
    taskInfo: null,

    availableDrivers: [],
    busyDrivers: [],          // ❗不可用司机
    rejectedDrivers: [],      // ❗已拒绝司机

    availableVehicles: [],
    alternatives: [],

    selectedDriver: null,
    selectedVehicle: null,

    loading: true,
    loadingDrivers: false,
    loadingVehicles: false,

    showAllDrivers: false,
    submitting: false,
    errorMessage: ''
  };
},
  computed: {
    canSubmit() {
      return this.selectedDriver && this.selectedVehicle;
    },
    filteredDrivers() {
      if (this.showAllDrivers) {
        return this.availableDrivers;
      }
      return this.availableDrivers.filter(driver => driver.is_available);
    }
  },
  mounted() {
    this.taskId = this.$route.query.id;
    if (!this.taskId) {
      this.$router.push('/manager');
      return;
    }
    
    this.loadTaskInfo();
    this.loadAvailableDrivers();
    this.loadAvailableVehicles();
  },
  methods: {
    async loadTaskInfo() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:3000/api/manager/assignments/${this.taskId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.taskInfo = result.data;
          } else {
            this.errorMessage = result.message || '加载任务信息失败';
            setTimeout(() => this.$router.push('/manager'), 2000);
          }
        } else {
          this.errorMessage = '获取任务信息失败';
        }
      } catch (error) {
        console.error('加载任务信息错误:', error);
        this.errorMessage = '网络错误，请稍后重试';
      } finally {
        this.loading = false;
      }
    },
    
    async loadAvailableDrivers() {
  this.loadingDrivers = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:3000/api/manager/assignments/${this.taskId}/available-drivers`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        this.availableDrivers = result.data || [];
        this.busyDrivers = result.busy || [];
        this.rejectedDrivers = result.rejected || [];
      }
    }
  } catch (error) {
    console.error('加载司机列表错误:', error);
    this.errorMessage = '加载司机列表失败';
  } finally {
    this.loadingDrivers = false;
  }
},

    
    async loadAvailableVehicles() {
      this.loadingVehicles = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:3000/api/manager/assignments/${this.taskId}/available-vehicles`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.availableVehicles = result.data || [];
            this.alternatives = result.alternatives || [];
          }
        }
      } catch (error) {
        console.error('加载车辆列表错误:', error);
        this.errorMessage = '加载车辆列表失败';
      } finally {
        this.loadingVehicles = false;
      }
    },
    
    selectDriver(driver) {
      if (!driver.is_available && !this.showAllDrivers) {
        this.errorMessage = '该司机当前不可用：' + driver.availability_reason;
        return;
      }
      this.selectedDriver = driver.user_id;
    },
    
    selectVehicle(vehicle) {
      this.selectedVehicle = vehicle.vehicle_id;
    },
    
    async submitAssignment() {
  if (!this.canSubmit || this.submitting) return;
  
  this.submitting = true;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:3000/api/manager/assignments/${this.taskId}/assign`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driver_id: this.selectedDriver,
          vehicle_id: this.selectedVehicle
        })
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      // 使用简单的 alert
      alert('✅ 任务分配成功！');
      
      // 立即返回管理页面
      this.$router.push('/manager');
      
    } else {
      alert(`❌ 分配失败：${result.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('分配任务错误:', error);
    alert('❌ 网络错误，请稍后重试');
  } finally {
    this.submitting = false;
  }
},
    
    refreshDrivers() {
      this.loadAvailableDrivers();
    },
    
    refreshVehicles() {
      this.loadAvailableVehicles();
    },
    
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return typeMap[type] || type;
    },
    
    getDriverStatusText(status) {
      const statusMap = {
        on_duty: '在岗',
        driving: '驾驶中',
        resting: '休息',
        off_duty: '下班'
      };
      return statusMap[status] || status;
    },
    
    goBack() {
      this.$router.push('/manager');
    }
  }
};
</script>

<style scoped>
.task-assign-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding-bottom: 40px;
}

/* 顶部导航 */
.assign-header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.header-right .task-id {
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
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
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-refresh {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
  padding: 8px 16px;
}

.btn-link {
  background: transparent;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  padding: 8px 12px;
}

.btn-link:hover {
  color: #2563eb;
  background: transparent;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
  border: 2px solid #e2e8f0;
  padding: 12px 32px;
}

.btn-cancel:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.btn-submit {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  padding: 12px 48px;
  font-size: 16px;
  font-weight: 600;
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #34d399, #10b981);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

/* 主要内容 */
.assign-content {
  max-width: 1200px;
  margin: 32px auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 1024px) {
  .assign-content {
    grid-template-columns: 400px 1fr;
  }
}

/* 任务信息卡片 */
.task-info-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.task-status {
  padding: 8px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f5f9;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

/* 任务详情 */
.task-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .detail-row {
    grid-template-columns: 1fr;
  }
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  display: block;
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 6px;
}

.detail-item .value {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  line-height: 1.5;
}

/* 分配表单 */
.assign-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  background: white;
  border-radius: 20px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
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

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.3;
}

.empty-state h4 {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 16px 0;
}

/* 司机网格 */
.drivers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .drivers-grid {
    grid-template-columns: 1fr;
  }
}

/* 司机卡片 */
.driver-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.driver-card.selectable:hover {
  transform: translateY(-3px);
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
}

.driver-card.selected {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #ffffff);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.15);
}

.driver-card.unavailable {
  opacity: 0.7;
}

.driver-card.unavailable:hover {
  border-color: #ef4444;
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

.driver-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.driver-main h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.driver-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.on_duty,
.status-dot.driving {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.status-dot.resting {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.status-dot.off_duty {
  background: linear-gradient(135deg, #6b7280, #9ca3af);
}

.driver-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.driver-details .detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.driver-details .icon {
  color: #94a3b8;
  font-size: 14px;
}

.availability-warning {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.warning-icon {
  font-size: 14px;
}

.selection-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #10b981, #34d399);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

/* 车辆相关 */
.section-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.section-subtitle.alternative {
  color: #f59e0b;
  border-bottom-color: #fef3c7;
}

.vehicles-section {
  margin-bottom: 24px;
}

.vehicles-section:last-child {
  margin-bottom: 0;
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .vehicles-grid {
    grid-template-columns: 1fr;
  }
}

/* 车辆卡片 */
.vehicle-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.vehicle-card.selectable:hover {
  transform: translateY(-3px);
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
}

.vehicle-card.selected {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #ffffff);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.15);
}

.vehicle-card.alternative {
  border-color: #fef3c7;
}

.vehicle-card.alternative:hover {
  border-color: #f59e0b;
}

.vehicle-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
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

.match-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.match-badge.alternative {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #64748b;
}

.info-item .icon {
  color: #94a3b8;
  font-size: 16px;
}

.info-note {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.note-icon {
  font-size: 14px;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid #f1f5f9;
}

/* 错误提示 */
.error-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-icon {
  font-size: 18px;
}

.btn-error-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16px;
}

.btn-error-close:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
/* 已拒绝司机列表 */
.drivers-rejected {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px dashed #fecaca;
}

.section-subtitle.rejected {
  color: #dc2626;
  border-bottom-color: #fee2e2;
}

.rejected-list {
  list-style: none;
  padding: 0;
  margin: 16px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rejected-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fee2e2;
  border-radius: 10px;
  font-size: 14px;
  color: #7f1d1d;
}

.reject-icon {
  font-size: 16px;
}

.reject-name {
  font-weight: 600;
}

.reject-reason {
  font-size: 13px;
  color: #991b1b;
}

</style>