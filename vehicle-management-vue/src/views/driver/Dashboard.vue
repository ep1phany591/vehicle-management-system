<template>
  <div class="driver-dashboard">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="driver-status" :class="currentStatus">
        <span class="status-icon">🚗</span>
        <span class="status-text">{{ getStatusText(currentStatus) }}</span>
      </div>
      <div class="driver-info">
        <img :src="user.avatar" alt="司机头像" class="driver-avatar">
        <div class="driver-name">{{ user.real_name }}</div>
      </div>
    </div>

    <!-- 今日工作概览 -->
    <div class="daily-summary">
      <div class="summary-card">
        <div class="summary-icon">📋</div>
        <div class="summary-content">
          <div class="summary-value">{{ dailyStats.totalTasks }}</div>
          <div class="summary-label">今日任务</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">✅</div>
        <div class="summary-content">
          <div class="summary-value">{{ dailyStats.completedTasks }}</div>
          <div class="summary-label">已完成</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🛣️</div>
        <div class="summary-content">
          <div class="summary-value">{{ dailyStats.totalMileage }}km</div>
          <div class="summary-label">总里程</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">⏰</div>
        <div class="summary-content">
          <div class="summary-value">{{ dailyStats.workHours }}h</div>
          <div class="summary-label">工作时长</div>
        </div>
      </div>
    </div>

    <!-- 当前任务 -->
    <div class="current-task-section">
      <div class="section-header">
        <h3>当前任务</h3>
        <button @click="refreshTasks" class="refresh-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>刷新</span>
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载任务中...</p>
      </div>

      <div v-else-if="currentTask" class="current-task">
        <div class="task-header">
          <div class="task-badge" :class="currentTask.status">
            {{ getTaskStatusText(currentTask.status) }}
          </div>
          <div class="task-time">
            {{ formatTime(currentTask.start_time) }} - {{ formatTime(currentTask.end_time) }}
          </div>
        </div>

        <div class="task-content">
          <h4 class="task-title">{{ currentTask.reason }}</h4>
          
          <div class="task-details">
            <div class="detail-row">
              <div class="detail-item">
                <span class="detail-label">申请人：</span>
                <span class="detail-value">{{ currentTask.applicant_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">联系电话：</span>
                <span class="detail-value">{{ currentTask.contact_phone || '无' }}</span>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-item">
                <span class="detail-label">目的地：</span>
                <span class="detail-value">{{ currentTask.destination || '未指定' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">乘车人数：</span>
                <span class="detail-value">{{ currentTask.people_count }}人</span>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-item">
                <span class="detail-label">车辆信息：</span>
                <span class="detail-value">
                  {{ currentTask.license_plate || '未分配' }}
                  <span v-if="currentTask.vehicle_type">({{ getVehicleTypeText(currentTask.vehicle_type) }})</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 任务备注 -->
          <div v-if="currentTask.remarks" class="task-remarks">
            <span class="remarks-label">备注：</span>
            <span class="remarks-content">{{ currentTask.remarks }}</span>
          </div>
        </div>

        <!-- 任务操作 -->
        <div class="task-actions">
          <button 
            v-if="currentTask.status === 'assigned'"
            @click="acceptTask"
            class="action-btn primary large"
          >
            <span class="btn-icon">✅</span>
            <span class="btn-text">接受任务</span>
          </button>
          
          <button 
            v-if="currentTask.status === 'confirmed'"
            @click="startTask"
            class="action-btn primary large"
          >
            <span class="btn-icon">🚗</span>
            <span class="btn-text">开始执行</span>
          </button>
          
          <button 
            v-if="currentTask.status === 'in_progress'"
            @click="completeTask"
            class="action-btn success large"
          >
            <span class="btn-icon">🏁</span>
            <span class="btn-text">完成任务</span>
          </button>

          <!-- 联系相关人员 -->
          <div v-if="currentTask.status === 'in_progress'" class="contact-buttons">
            <button @click="contactApplicant" class="action-btn outline">
              <span class="btn-icon">📞</span>
              <span class="btn-text">联系申请人</span>
            </button>
            <button @click="contactDispatcher" class="action-btn outline">
              <span class="btn-icon">👨‍✈️</span>
              <span class="btn-text">联系调度</span>
            </button>
          </div>
        </div>

        <!-- 进行中任务的时间显示 -->
        <div v-if="currentTask.status === 'in_progress'" class="task-timer">
          <div class="timer-info">
            <span class="timer-label">任务已进行：</span>
            <span class="timer-value">{{ calculateDuration(currentTask.actual_start_time) }}</span>
          </div>
          <div class="timer-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: calculateProgress(currentTask.start_time, currentTask.end_time) }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无任务状态 -->
      <div v-else class="no-task">
        <div class="no-task-icon">🚗</div>
        <h4>暂无任务</h4>
        <p>当前没有分配给您的任务，请等待调度安排</p>
        <div class="waiting-tips">
          <div class="tip-item">
            <span class="tip-icon">⏰</span>
            <span class="tip-text">保持手机畅通</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">📍</span>
            <span class="tip-text">保持在指定待命区域</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🛠️</span>
            <span class="tip-text">检查车辆状况</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日任务列表 -->
    <div class="today-tasks-section" v-if="todayTasks.length > 0">
      <div class="section-header">
        <h3>今日任务安排</h3>
        <span class="tasks-count">{{ todayTasks.length }}个任务</span>
      </div>

      <div class="tasks-timeline">
        <div 
          v-for="task in sortedTodayTasks" 
          :key="task.application_id"
          class="timeline-task"
          :class="{ active: task.application_id === currentTask?.application_id }"
          @click="viewTaskDetail(task)"
        >
          <div class="timeline-time">
            <div class="time-start">{{ formatTime(task.start_time) }}</div>
            <div class="time-duration">{{ calculateTaskDuration(task.start_time, task.end_time) }}</div>
          </div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h5>{{ task.reason }}</h5>
              <span class="task-status" :class="task.status">
                {{ getTaskStatusText(task.status) }}
              </span>
            </div>
            <div class="timeline-details">
              <span class="detail">👤 {{ task.applicant_name }}</span>
              <span class="detail">📍 {{ task.destination || '未指定' }}</span>
              <span v-if="task.license_plate" class="detail">🚗 {{ task.license_plate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作面板 -->
    <div class="quick-actions">
      <div class="action-item" @click="reportLocation">
        <div class="action-icon">📍</div>
        <span class="action-text">上报位置</span>
      </div>
      <div class="action-item" @click="reportIssue">
        <div class="action-icon">⚠️</div>
        <span class="action-text">问题上报</span>
      </div>
      <div class="action-item" @click="checkVehicle">
        <div class="action-icon">🛠️</div>
        <span class="action-text">车辆检查</span>
      </div>
      <div class="action-item" @click="viewStatistics">
        <div class="action-icon">📊</div>
        <span class="action-text">我的统计</span>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <button @click="goToTasks" class="nav-btn">
        <span class="nav-icon">📋</span>
        <span class="nav-text">任务中心</span>
      </button>
      <button @click="logout" class="nav-btn logout">
        <span class="nav-icon">🚪</span>
        <span class="nav-text">退出登录</span>
      </button>
    </div>

    <!-- 完成任务弹窗 -->
    <div v-if="showCompleteModal" class="modal-overlay">
      <div class="modal-content">
        <h3>完成任务</h3>
        
        <div class="form-group">
          <label>实际结束时间</label>
          <input 
            type="datetime-local" 
            v-model="completionData.actual_end_time"
            class="form-input"
          >
        </div>
        
        <div class="form-group">
          <label>实际行驶里程（公里）</label>
          <input 
            type="number" 
            v-model="completionData.actual_mileage"
            class="form-input"
            placeholder="请输入里程数"
            min="0"
            step="0.1"
          >
        </div>
        
        <div class="form-group">
          <label>任务备注（可选）</label>
          <textarea 
            v-model="completionData.remarks"
            class="form-textarea"
            placeholder="可填写路况、任务完成情况等"
            rows="3"
          ></textarea>
        </div>
        
        <div class="modal-actions">
          <button @click="showCompleteModal = false" class="btn-cancel">取消</button>
          <button @click="confirmCompletion" class="btn-confirm" :disabled="!completionData.actual_mileage">
            确认完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DriverDashboard',
  data() {
    return {
      user: {},
      currentTask: null,
      todayTasks: [],
      loading: false,
      currentStatus: 'on_duty',
      showCompleteModal: false,
      
      dailyStats: {
        totalTasks: 0,
        completedTasks: 0,
        totalMileage: 0,
        workHours: 0
      },
      
      completionData: {
        actual_end_time: '',
        actual_mileage: '',
        remarks: ''
      }
    };
  },
  computed: {
    sortedTodayTasks() {
      return [...this.todayTasks].sort((a, b) => 
        new Date(a.start_time) - new Date(b.start_time)
      );
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadDriverData();
    // 每30秒刷新一次任务状态
    this.refreshInterval = setInterval(this.refreshTasks, 30000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    loadUserInfo() {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          this.user = JSON.parse(userData);
          // 默认状态
          this.currentStatus = 'on_duty';
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    },
    
    async loadDriverData() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        
        // 获取司机任务
        const response = await fetch('http://localhost:3000/api/driver/missions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const allTasks = result.data || [];
            this.processTasks(allTasks);
          } else {
            this.loadMockData();
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
    
    processTasks(tasks) {
      // 过滤出今日任务
      const today = new Date().toISOString().split('T')[0];
      this.todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.start_time).toISOString().split('T')[0];
        return taskDate === today;
      });
      
      // 找出当前任务（状态为待接受、已接受、进行中的任务）
      const activeStatuses = ['assigned', 'confirmed', 'in_progress'];
      this.currentTask = tasks.find(task => activeStatuses.includes(task.status));
      
      // 如果没有当前任务，找一个最接近的任务
      if (!this.currentTask && this.todayTasks.length > 0) {
        const now = new Date();
        const upcomingTasks = this.todayTasks.filter(task => 
          new Date(task.start_time) > now && task.status === 'approved'
        ).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        if (upcomingTasks.length > 0) {
          this.currentTask = upcomingTasks[0];
        }
      }
      
      // 计算统计
      this.calculateDailyStats();
    },
    
    calculateDailyStats() {
      const completedTasks = this.todayTasks.filter(task => task.status === 'completed');
      const totalMileage = completedTasks.reduce((sum, task) => 
        sum + (parseFloat(task.actual_mileage) || 0), 0
      );
      
      // 计算工作时长（简化处理）
      let workHours = 0;
      if (this.currentTask && this.currentTask.actual_start_time) {
        const startTime = new Date(this.currentTask.actual_start_time);
        const endTime = this.currentTask.actual_end_time ? 
          new Date(this.currentTask.actual_end_time) : new Date();
        workHours = Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10;
      }
      
      this.dailyStats = {
        totalTasks: this.todayTasks.length,
        completedTasks: completedTasks.length,
        totalMileage: Math.round(totalMileage),
        workHours: workHours
      };
    },
    
    loadMockData() {
      const mockTasks = [
        {
          application_id: 1,
          reason: '公司领导外出会议',
          status: 'in_progress',
          applicant_name: '张总',
          contact_phone: '13800138001',
          destination: '国际会议中心',
          people_count: 3,
          vehicle_type: 'business',
          license_plate: '京A88888',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          actual_start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          remarks: '请准时到达，携带瓶装水'
        },
        {
          application_id: 2,
          reason: '机场接客户',
          status: 'assigned',
          applicant_name: '李经理',
          destination: '首都机场T3航站楼',
          people_count: 2,
          start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          remarks: '客户航班号：CA1234'
        },
        {
          application_id: 3,
          reason: '材料运输',
          status: 'completed',
          applicant_name: '王主管',
          destination: '物流园区',
          people_count: 1,
          license_plate: '京A66666',
          start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actual_start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          actual_end_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actual_mileage: '120'
        }
      ];
      
      this.processTasks(mockTasks);
    },
    
    formatTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    getStatusText(status) {
      const statusMap = {
        on_duty: '在岗',
        resting: '休息',
        driving: '驾驶中',
        off_duty: '下班'
      };
      return statusMap[status] || status;
    },
    
    getTaskStatusText(status) {
      const statusMap = {
        assigned: '待接受',
        confirmed: '已接受',
        in_progress: '进行中',
        completed: '已完成'
      };
      return statusMap[status] || status;
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return typeMap[type] || type;
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
    
    calculateTaskDuration(startTime, endTime) {
      if (!startTime || !endTime) return '';
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        return `${Math.round(diffHours * 60)}分钟`;
      } else {
        return `${diffHours.toFixed(1)}小时`;
      }
    },
    
    calculateProgress(startTime, endTime) {
      if (!startTime || !endTime) return '0%';
      const start = new Date(startTime);
      const end = new Date(endTime);
      const now = new Date();
      
      if (now < start) return '0%';
      if (now > end) return '100%';
      
      const totalDuration = end - start;
      const elapsed = now - start;
      const progress = (elapsed / totalDuration) * 100;
      
      return `${Math.min(100, Math.max(0, progress)).toFixed(1)}%`;
    },
    
    async acceptTask() {
      if (!this.currentTask) return;
      
      if (!confirm(`确定要接受任务吗？\n${this.currentTask.reason}`)) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/applications/${this.currentTask.application_id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'confirmed'
          })
        });
        
        if (response.ok) {
          alert('任务已接受');
          this.refreshTasks();
        } else {
          throw new Error('接受任务失败');
        }
      } catch (error) {
        console.error('接受任务失败:', error);
        alert('接受任务失败');
      }
    },
    
    async startTask() {
      if (!this.currentTask) return;
      
      if (!confirm('确定要开始执行任务吗？')) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/applications/${this.currentTask.application_id}/status`, {
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
        
        if (response.ok) {
          alert('任务已开始');
          this.currentStatus = 'driving';
          this.refreshTasks();
        } else {
          throw new Error('开始任务失败');
        }
      } catch (error) {
        console.error('开始任务失败:', error);
        alert('开始任务失败');
      }
    },
    
    completeTask() {
      if (!this.currentTask) return;
      
      // 设置默认结束时间
      this.completionData = {
        actual_end_time: new Date().toISOString().slice(0, 16),
        actual_mileage: '',
        remarks: ''
      };
      
      this.showCompleteModal = true;
    },
    
    async confirmCompletion() {
      if (!this.completionData.actual_mileage) {
        alert('请输入实际行驶里程');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/applications/${this.currentTask.application_id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'completed',
            actual_end_time: this.completionData.actual_end_time,
            actual_mileage: parseFloat(this.completionData.actual_mileage),
            remarks: this.completionData.remarks
          })
        });
        
        if (response.ok) {
          alert('任务已完成');
          this.showCompleteModal = false;
          this.currentStatus = 'on_duty';
          this.refreshTasks();
        } else {
          throw new Error('完成任务失败');
        }
      } catch (error) {
        console.error('完成任务失败:', error);
        alert('完成任务失败');
      }
    },
    
    contactApplicant() {
      if (this.currentTask?.contact_phone) {
        window.location.href = `tel:${this.currentTask.contact_phone}`;
      } else {
        alert('申请人未提供联系电话');
      }
    },
    
    contactDispatcher() {
      alert('联系调度员功能（可集成电话或即时通讯）');
    },
    
    viewTaskDetail(task) {
      this.$router.push(`/application/${task.application_id}`);
    },
    
    async refreshTasks() {
      await this.loadDriverData();
    },
    
    // 快捷操作
    reportLocation() {
      alert('位置上报功能（可集成GPS定位）');
    },
    
    reportIssue() {
      const issue = prompt('请描述遇到的问题：');
      if (issue) {
        alert(`问题已上报：${issue}`);
      }
    },
    
    checkVehicle() {
      alert('车辆检查功能');
    },
    
    viewStatistics() {
      alert('查看个人统计功能');
    },
    
    goToTasks() {
      this.$router.push('/driver/missions');
    },
    
    logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.clear();
        this.$router.push('/login');
      }
    }
  }
};
</script>

<style scoped>
/* 完善样式 */

.driver-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding-bottom: 100px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
}

/* 顶部状态栏优化 */
.status-bar {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(24, 144, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  color: white;
}

.driver-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.driver-status.on_duty {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.driver-status.driving {
  background: rgba(82, 196, 26, 0.2);
  color: white;
}

.driver-status.resting {
  background: rgba(250, 140, 22, 0.2);
  color: white;
}

.driver-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.driver-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  object-fit: cover;
}

.driver-name {
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 今日概览卡片优化 */
.daily-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 20px;
  background: white;
  margin: 15px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.daily-summary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #52c41a);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border-color: #1890ff;
}

.summary-icon {
  font-size: 28px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.summary-card:hover .summary-icon {
  transform: scale(1.1);
  background: linear-gradient(135deg, #1890ff, #52c41a);
  color: white;
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

/* 当前任务区域优化 */
.current-task-section {
  background: white;
  margin: 15px;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
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
  font-size: 20px;
  color: #333;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
}

.section-header h3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: #1890ff;
  border-radius: 2px;
}

.refresh-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

.refresh-btn:disabled {
  background: linear-gradient(135deg, #bfbfbf, #8c8c8c);
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 当前任务卡片优化 */
.current-task {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.task-badge {
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-badge.assigned {
  background: linear-gradient(135deg, #ffa940, #fa8c16);
  color: white;
}

.task-badge.confirmed {
  background: linear-gradient(135deg, #69c0ff, #1890ff);
  color: white;
}

.task-badge.in_progress {
  background: linear-gradient(135deg, #95de64, #52c41a);
  color: white;
}

.task-time {
  font-size: 15px;
  color: #666;
  font-weight: 600;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.task-content {
  padding: 24px;
}

.task-title {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: #333;
  line-height: 1.5;
  font-weight: 600;
  padding-bottom: 16px;
  border-bottom: 2px dashed #f0f0f0;
}

.task-details {
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.detail-item {
  flex: 1;
}

.detail-label {
  display: block;
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 6px;
  font-weight: 500;
}

.detail-value {
  font-size: 16px;
  color: #333;
  font-weight: 600;
  padding: 10px 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  display: block;
}

.task-remarks {
  padding: 16px;
  background: linear-gradient(135deg, #fff7e6, #fff2d8);
  border-radius: 12px;
  border-left: 4px solid #fa8c16;
  margin-top: 20px;
}

.remarks-label {
  font-weight: 600;
  color: #fa8c16;
  margin-right: 8px;
}

.remarks-content {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

/* 任务操作按钮优化 */
.task-actions {
  padding: 24px;
  border-top: 2px solid #f0f0f0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 18px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.action-btn:hover::after {
  width: 300px;
  height: 300px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
}

.action-btn.success {
  background: linear-gradient(135deg, #52c41a, #389e0d);
  color: white;
  box-shadow: 0 6px 20px rgba(82, 196, 26, 0.3);
}

.action-btn.outline {
  background: white;
  border: 2px solid #1890ff;
  color: #1890ff;
  font-weight: 600;
}

.action-btn.large {
  font-size: 16px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.contact-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

/* 任务计时器优化 */
.task-timer {
  padding: 20px;
  background: linear-gradient(135deg, #f6ffed, #f0f9eb);
  border-top: 2px dashed #d9f7be;
}

.timer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.timer-label {
  font-size: 14px;
  color: #52c41a;
  font-weight: 500;
}

.timer-value {
  font-size: 20px;
  font-weight: 700;
  color: #52c41a;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.progress-bar {
  height: 10px;
  background: rgba(82, 196, 26, 0.1);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.progress-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    transparent 50%, 
    rgba(255, 255, 255, 0.5) 50%, 
    rgba(255, 255, 255, 0.5) 100%);
  background-size: 20px 10px;
  animation: progress-stripe 1s linear infinite;
}

@keyframes progress-stripe {
  0% { background-position: 0 0; }
  100% { background-position: 20px 0; }
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  border-radius: 5px;
  transition: width 0.5s ease-in-out;
  position: relative;
  z-index: 1;
}

/* 无任务状态优化 */
.no-task {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 20px;
  border: 2px dashed #d9d9d9;
}

.no-task-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.no-task h4 {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 20px;
  font-weight: 600;
}

.no-task p {
  color: #8c8c8c;
  margin-bottom: 36px;
  font-size: 15px;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.waiting-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 320px;
  margin: 0 auto;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tip-item:hover {
  transform: translateX(5px);
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.tip-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 50%;
}

.tip-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 今日任务时间线优化 */
.today-tasks-section {
  background: white;
  margin: 15px;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.tasks-count {
  font-size: 14px;
  color: #1890ff;
  font-weight: 600;
  padding: 6px 14px;
  background: #e6f7ff;
  border-radius: 20px;
}

.tasks-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-task {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.timeline-task::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #1890ff;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.timeline-task:hover {
  transform: translateX(5px);
  border-color: #1890ff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.timeline-task:hover::before {
  opacity: 1;
}

.timeline-task.active {
  border-color: #52c41a;
  background: linear-gradient(135deg, #f6ffed, #ffffff);
}

.timeline-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
}

.time-start {
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
  margin-bottom: 4px;
}

.time-duration {
  font-size: 12px;
  color: #8c8c8c;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 10px;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.timeline-header h5 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.task-status {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
}

.task-status.assigned { background: #fff7e6; color: #fa8c16; }
.task-status.confirmed { background: #e6f7ff; color: #1890ff; }
.task-status.in_progress { background: #f6ffed; color: #52c41a; }
.task-status.completed { background: #f9f0ff; color: #722ed1; }

.timeline-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.timeline-details .detail {
  font-size: 13px;
  color: #666;
  padding: 6px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 快速操作面板优化 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 20px;
  margin: 15px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-item:hover {
  transform: translateY(-3px);
  border-color: #1890ff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #e6f7ff, #ffffff);
}

.action-icon {
  font-size: 28px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.action-item:hover .action-icon {
  transform: scale(1.1);
  background: #1890ff;
  color: white;
}

.action-text {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  text-align: center;
}

/* 底部导航优化 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  transform: translateY(-2px);
  border-color: #1890ff;
  color: #1890ff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.nav-btn.logout {
  background: linear-gradient(135deg, #fff2f0, #ffffff);
  border-color: #ffccc7;
  color: #f5222d;
}

.nav-btn.logout:hover {
  background: linear-gradient(135deg, #f5222d, #ff4d4f);
  color: white;
  border-color: #f5222d;
}

.nav-icon {
  font-size: 18px;
}

/* 弹窗优化 */
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
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  width: 90%;
  max-width: 400px;
  animation: slideUp 0.4s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: #333;
  font-weight: 600;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e8e8e8;
}

.btn-cancel:hover {
  background: #e8e8e8;
  transform: translateY(-2px);
}

.btn-confirm {
  background: linear-gradient(135deg, #52c41a, #389e0d);
  color: white;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(82, 196, 26, 0.4);
}

.btn-confirm:disabled {
  background: linear-gradient(135deg, #bfbfbf, #8c8c8c);
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .daily-summary {
    grid-template-columns: repeat(2, 1fr);
    margin: 10px;
    padding: 15px;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
    margin: 10px;
  }
  
  .timeline-task {
    flex-direction: column;
    gap: 12px;
  }
  
  .timeline-time {
    flex-direction: row;
    justify-content: space-between;
    min-width: auto;
  }
  
  .contact-buttons {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .status-bar {
    padding: 12px 15px;
  }
  
  .driver-info {
    padding: 4px 8px;
  }
  
  .daily-summary {
    grid-template-columns: 1fr;
  }
  
  .action-btn.large {
    padding: 16px;
  }
  
  .modal-content {
    padding: 20px;
    margin: 10px;
    width: calc(100% - 20px);
  }
}
</style>