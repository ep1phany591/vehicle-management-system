<template>
  <div class="manager-drivers">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <div class="avatar-container">
          <span class="avatar-letter">{{ userInitial }}</span>
        </div>
        <div class="user-details">
          <h3>{{ user.real_name }}</h3>
          <p>司机管理</p>
          <p class="fleet-info" v-if="fleetInfo">{{ fleetInfo.fleet_name }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToDashboard" class="home-btn">
          <span>🏠</span>
          <span>工作台</span>
        </button>
        <button @click="logout" class="logout-btn">
          <span>🚪</span>
          <span>退出</span>
        </button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchKeyword"
          placeholder="搜索司机姓名或电话"
          class="search-input"
          @keyup.enter="loadDrivers"
        >
        <span class="search-icon">🔍</span>
      </div>
      <div class="filter-options">
        <div class="filter-group">
          <label>状态：</label>
          <select v-model="filterStatus" class="filter-select" @change="loadDrivers">
            <option value="all">全部状态</option>
            <option value="on_duty">在岗</option>
            <option value="resting">休息</option>
            <option value="driving">驾驶中</option>
            <option value="off_duty">下班</option>
          </select>
        </div>
        <div class="filter-group">
          <label>排序：</label>
          <select v-model="sortBy" class="filter-select" @change="loadDrivers">
            <option value="name">按姓名</option>
            <option value="trips">按出车次数</option>
            <option value="mileage">按总里程</option>
          </select>
        </div>
        <button @click="loadDrivers" class="refresh-btn" title="刷新数据">
          🔄
        </button>
      </div>
    </div>

    <!-- 司机统计 -->
    <div class="driver-stats">
      <div class="stats-cards">
        <div class="stat-card" @click="filterStatus = 'on_duty'; loadDrivers()">
          <div class="stat-icon on_duty">👨‍✈️</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.onDutyCount }}</div>
            <div class="stat-label">在岗司机</div>
          </div>
        </div>
        <div class="stat-card" @click="filterStatus = 'driving'; loadDrivers()">
          <div class="stat-icon driving">🚗</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.drivingCount }}</div>
            <div class="stat-label">出勤中</div>
          </div>
        </div>
        <div class="stat-card" @click="showTodaySchedule">
          <div class="stat-icon schedule">📅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.todayTrips }}</div>
            <div class="stat-label">今日出车</div>
          </div>
        </div>
        <div class="stat-card" @click="showPerformance">
          <div class="stat-icon performance">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.availableCount }}</div>
            <div class="stat-label">可用司机</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 司机列表 -->
    <div class="drivers-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="filteredDrivers.length === 0" class="empty-state">
        <div class="empty-icon">👨‍✈️</div>
        <h3>暂无司机数据</h3>
        <p>当前筛选条件下没有找到司机</p>
        <button @click="resetFilters" class="reset-btn">重置筛选</button>
      </div>
      
      <div v-else class="drivers-grid">
        <div 
          v-for="driver in filteredDrivers" 
          :key="driver.user_id"
          class="driver-card"
          :class="driver.status"
          @click="viewDriverDetail(driver.user_id)"
        >
          <div class="driver-header">
            <div class="driver-avatar">
              <span>{{ driver.real_name.charAt(0) }}</span>
            </div>
            <div class="driver-badge" :class="driver.status">
              {{ getStatusText(driver.status) }}
            </div>
          </div>
          
          <div class="driver-info">
            <div class="driver-name">{{ driver.real_name }}</div>
            <div class="driver-meta">
              <span class="meta-item" v-if="driver.department">📋 {{ driver.department }}</span>
              <span class="meta-item" v-if="driver.position">👨‍💼 {{ driver.position }}</span>
            </div>
            <div class="driver-phone">📞 {{ driver.phone || '未设置电话' }}</div>
            <div class="driver-details">
              <div class="detail-item">
                <span class="detail-label">本月出车：</span>
                <span class="detail-value">{{ driver.monthly_trips || 0 }} 次</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">总里程：</span>
                <span class="detail-value">{{ formatNumber(driver.total_mileage) }} km</span>
              </div>
              <div class="detail-item" v-if="driver.driving_years">
                <span class="detail-label">驾龄：</span>
                <span class="detail-value">{{ driver.driving_years }} 年</span>
              </div>
            </div>
          </div>
          
          <div class="driver-actions">
            <button 
              @click.stop="assignTask(driver)"
              class="action-btn assign"
              :disabled="driver.status !== 'on_duty'"
              :title="driver.status !== 'on_duty' ? '该司机不在岗' : '派发任务'"
            >
              📋 派发任务
            </button>
            <button 
              @click.stop="contactDriver(driver)"
              class="action-btn contact"
              :disabled="!driver.phone"
              :title="!driver.phone ? '该司机未设置电话' : '联系司机'"
            >
              📞 联系
            </button>
            <button 
              @click.stop="updateDriverStatus(driver)"
              class="action-btn status"
              :title="'更新状态：' + getStatusText(driver.status)"
            >
              🔄 状态
            </button>
          </div>
          
          <!-- 今日任务 -->
          <div v-if="driver.today_tasks && driver.today_tasks.length > 0" class="today-tasks">
            <div class="tasks-header">
              <span class="tasks-title">今日任务</span>
              <span class="tasks-count">{{ driver.today_tasks.length }}个</span>
            </div>
            <div class="tasks-list">
              <div 
                v-for="task in driver.today_tasks.slice(0, 2)" 
                :key="task.application_id"
                class="task-item"
                @click.stop="viewTask(task)"
              >
                <span class="task-time">{{ formatTime(task.start_time) }}</span>
                <span class="task-reason">{{ task.reason }}</span>
                <span class="task-status" :class="task.status">{{ getTaskStatusText(task.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 派发任务模态框 -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="modal-content">
        <h3>派发任务</h3>
        <p>司机：<strong>{{ selectedDriver?.real_name }}</strong></p>
        
        <div class="form-group">
          <label>选择任务</label>
          <select v-model="selectedTask" class="form-select">
            <option value="">请选择任务</option>
            <option 
              v-for="task in availableTasks" 
              :key="task.application_id"
              :value="task.application_id"
            >
              #{{ task.application_id }} {{ task.reason }} ({{ formatTime(task.start_time) }})
            </option>
          </select>
        </div>
        
        <div v-if="selectedTaskDetails" class="task-details">
          <h4>任务详情</h4>
          <div class="detail-item">
            <span>申请人：</span>
            <span>{{ selectedTaskDetails.applicant_name }}</span>
          </div>
          <div class="detail-item">
            <span>乘车人数：</span>
            <span>{{ selectedTaskDetails.people_count }}人</span>
          </div>
          <div class="detail-item">
            <span>目的地：</span>
            <span>{{ selectedTaskDetails.destination || '未指定' }}</span>
          </div>
          <div class="detail-item">
            <span>用车时间：</span>
            <span>{{ formatFullDateTime(selectedTaskDetails.start_time) }}</span>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showAssignModal = false" class="cancel-btn">取消</button>
          <button @click="confirmAssignment" class="confirm-btn" :disabled="!selectedTask || assigning">
            {{ assigning ? '派发中...' : '确认派发' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 司机详情模态框 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content large">
        <h3>司机详情</h3>
        
        <div class="driver-detail">
          <div class="detail-header">
            <div class="detail-avatar">
              <span>{{ selectedDriver?.real_name?.charAt(0) || '?' }}</span>
            </div>
            <div class="detail-info">
              <h4>{{ selectedDriver?.real_name }}</h4>
              <div class="detail-meta">
                <span v-if="selectedDriver?.department" class="meta-item">📋 {{ selectedDriver.department }}</span>
                <span v-if="selectedDriver?.position" class="meta-item">👨‍💼 {{ selectedDriver.position }}</span>
              </div>
              <p>📞 {{ selectedDriver?.phone || '未设置电话' }}</p>
              <div class="status-badge" :class="selectedDriver?.status">
                {{ getStatusText(selectedDriver?.status) }}
              </div>
            </div>
          </div>
          
          <div class="detail-sections">
            <div class="detail-section">
              <h5>基本信息</h5>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">工号：</span>
                  <span class="value">{{ selectedDriver?.employee_id || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">入职时间：</span>
                  <span class="value">{{ formatDate(selectedDriver?.hire_date) || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">驾龄：</span>
                  <span class="value">{{ selectedDriver?.driving_years || '--' }}年</span>
                </div>
                <div class="detail-item">
                  <span class="label">驾照类型：</span>
                  <span class="value">{{ selectedDriver?.license_type || '--' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">驾照有效期：</span>
                  <span class="value">{{ formatDate(selectedDriver?.license_expiry) || '--' }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h5>工作统计</h5>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">本月出车：</span>
                  <span class="value">{{ selectedDriver?.monthly_trips || 0 }} 次</span>
                </div>
                <div class="detail-item">
                  <span class="label">总出车：</span>
                  <span class="value">{{ selectedDriver?.total_trips || 0 }} 次</span>
                </div>
                <div class="detail-item">
                  <span class="label">总里程：</span>
                  <span class="value">{{ formatNumber(selectedDriver?.total_mileage) }} km</span>
                </div>
                <div class="detail-item">
                  <span class="label">准时率：</span>
                  <span class="value">{{ selectedDriver?.punctuality_rate || 0 }}%</span>
                </div>
                <div class="detail-item">
                  <span class="label">注册时间：</span>
                  <span class="value">{{ formatDateTime(selectedDriver?.created_at) }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section" v-if="selectedDriver?.recent_tasks && selectedDriver.recent_tasks.length > 0">
              <h5>近期任务（最近30天）</h5>
              <div class="recent-tasks">
                <div 
                  v-for="task in selectedDriver.recent_tasks" 
                  :key="task.application_id"
                  class="task-item"
                  @click="viewTask(task)"
                >
                  <div class="task-header">
                    <span class="task-id">#{{ task.application_id }}</span>
                    <span class="task-status" :class="task.status">
                      {{ getTaskStatusText(task.status) }}
                    </span>
                  </div>
                  <p class="task-reason">{{ task.reason }}</p>
                  <div class="task-footer">
                    <span class="task-date">{{ formatDateTime(task.start_time) }}</span>
                    <span v-if="task.actual_mileage" class="task-mileage">📏 {{ task.actual_mileage }} km</span>
                    <span v-if="task.license_plate" class="task-vehicle">🚗 {{ task.license_plate }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showDetailModal = false" class="cancel-btn">关闭</button>
          <button @click="updateDriverStatus(selectedDriver)" class="edit-btn">更新状态</button>
        </div>
      </div>
    </div>

    <!-- 状态更新模态框 -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="showStatusModal = false">
      <div class="modal-content">
        <h3>更新司机状态</h3>
        <p>司机：<strong>{{ statusDriver?.real_name }}</strong></p>
        <p>当前状态：<span class="current-status" :class="statusDriver?.status">{{ getStatusText(statusDriver?.status) }}</span></p>
        
        <div class="form-group">
          <label>选择新状态</label>
          <select v-model="newDriverStatus" class="form-select">
            <option value="on_duty">在岗</option>
            <option value="resting">休息</option>
            <option value="driving">驾驶中</option>
            <option value="off_duty">下班</option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button @click="showStatusModal = false" class="cancel-btn">取消</button>
          <button @click="confirmStatusUpdate" class="confirm-btn" :disabled="updatingStatus">
            {{ updatingStatus ? '更新中...' : '确认更新' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 绩效统计模态框 -->
    <div v-if="showPerformanceModal" class="modal-overlay" @click.self="showPerformanceModal = false">
      <div class="modal-content large">
        <h3>司机绩效统计</h3>
        
        <div class="performance-header">
          <div class="period-selector">
            <button 
              v-for="period in ['week', 'month', 'quarter']" 
              :key="period"
              :class="{ active: performancePeriod === period }"
              @click="loadPerformance(period)"
            >
              {{ { week: '本周', month: '本月', quarter: '本季度' }[period] }}
            </button>
          </div>
        </div>
        
        <div v-if="performanceData.length === 0" class="empty-performance">
          <p>暂无绩效数据</p>
        </div>
        
        <div v-else class="performance-list">
          <div class="performance-table">
            <div class="table-header">
              <div>司机</div>
              <div>任务数</div>
              <div>总里程</div>
              <div>完成率</div>
              <div>准时率</div>
            </div>
            <div 
              v-for="driver in performanceData" 
              :key="driver.user_id"
              class="table-row"
              @click="viewDriverDetail(driver.user_id)"
            >
              <div class="driver-cell">
                <span class="driver-avatar-small">{{ driver.real_name.charAt(0) }}</span>
                <span class="driver-name">{{ driver.real_name }}</span>
              </div>
              <div>{{ driver.task_count }}</div>
              <div>{{ formatNumber(driver.total_mileage) }} km</div>
              <div>
                <span class="completion-rate" :class="getCompletionRateClass(driver.completion_rate)">
                  {{ driver.completion_rate }}%
                </span>
              </div>
              <div>
                <span class="punctuality-rate" :class="getPunctualityRateClass(driver.punctuality_rate)">
                  {{ driver.punctuality_rate }}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showPerformanceModal = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ManagerDrivers',
  data() {
    return {
      user: {},
      fleetInfo: null,
      drivers: [],
      filteredDrivers: [],
      loading: false,
      searchLoading: false,
      
      searchKeyword: '',
      filterStatus: 'all',
      sortBy: 'name',
      
      stats: {
        onDutyCount: 0,
        drivingCount: 0,
        todayTrips: 0,
        availableCount: 0
      },
      
      // 模态框相关
      showAssignModal: false,
      showDetailModal: false,
      showStatusModal: false,
      showPerformanceModal: false,
      
      selectedDriver: null,
      statusDriver: null,
      selectedTask: '',
      newDriverStatus: 'on_duty',
      
      availableTasks: [],
      selectedTaskDetails: null,
      performanceData: [],
      performancePeriod: 'month',
      
      // 加载状态
      assigning: false,
      updatingStatus: false,
      loadingDetail: false,
      loadingPerformance: false
    };
  },
  computed: {
    userInitial() {
      return this.user.real_name ? this.user.real_name.charAt(0).toUpperCase() : 'M';
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadDrivers();
    this.loadFleetInfo();
  },
  methods: {
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    async loadFleetInfo() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/manager/fleet-info', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.fleetInfo = result.data;
          }
        }
      } catch (error) {
        console.error('加载车队信息失败:', error);
      }
    },
    
    async loadDrivers() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        
        if (this.searchKeyword) params.append('search', this.searchKeyword);
        if (this.filterStatus !== 'all') params.append('status', this.filterStatus);
        if (this.sortBy) params.append('sort', this.sortBy);
        
        const url = `http://localhost:3000/api/manager/fleet-drivers${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.drivers = result.data || [];
            this.stats = result.stats || this.stats;
            this.filteredDrivers = this.drivers; // 直接使用后端筛选结果
          } else {
            this.showError('加载司机数据失败');
          }
        } else {
          this.showError('加载司机数据失败');
        }
      } catch (error) {
        console.error('加载司机数据失败:', error);
        this.showError('网络错误，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    
    async loadDriverDetail(driverId) {
      this.loadingDetail = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/manager/driver-detail/${driverId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.selectedDriver = result.data;
            this.showDetailModal = true;
          } else {
            this.showError(result.message || '获取司机详情失败');
          }
        }
      } catch (error) {
        console.error('加载司机详情失败:', error);
        this.showError('网络错误，请稍后重试');
      } finally {
        this.loadingDetail = false;
      }
    },
    
    async loadAvailableTasks() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/manager/pending-missions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.availableTasks = result.data || [];
          }
        }
      } catch (error) {
        console.error('加载待分配任务失败:', error);
        this.showError('加载任务列表失败');
      }
    },
    
    async loadPerformance(period = 'month') {
      this.loadingPerformance = true;
      this.performancePeriod = period;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/manager/driver-performance?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.performanceData = result.data || [];
            this.showPerformanceModal = true;
          }
        }
      } catch (error) {
        console.error('加载绩效数据失败:', error);
        this.showError('加载绩效数据失败');
      } finally {
        this.loadingPerformance = false;
      }
    },
    
    async confirmAssignment() {
      if (!this.selectedTask) {
        this.showError('请选择任务');
        return;
      }
      
      this.assigning = true;
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:3000/api/manager/assign-driver', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            application_id: this.selectedTask,
            driver_id: this.selectedDriver.user_id
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.showSuccess('任务派发成功');
            this.showAssignModal = false;
            this.loadDrivers(); // 重新加载司机数据
            this.loadAvailableTasks(); // 重新加载待分配任务
          } else {
            this.showError(result.message || '派发失败');
          }
        } else {
          throw new Error('派发失败');
        }
      } catch (error) {
        console.error('派发任务失败:', error);
        this.showError('派发任务失败');
      } finally {
        this.assigning = false;
      }
    },
    
    async confirmStatusUpdate() {
      if (!this.statusDriver || !this.newDriverStatus) {
        this.showError('请选择状态');
        return;
      }
      
      this.updatingStatus = true;
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3000/api/manager/driver-status/${this.statusDriver.user_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: this.newDriverStatus
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.showSuccess('状态更新成功');
            this.showStatusModal = false;
            this.loadDrivers(); // 重新加载司机数据
            
            // 如果详情模态框打开，也更新详情数据
            if (this.selectedDriver && this.selectedDriver.user_id === this.statusDriver.user_id) {
              this.loadDriverDetail(this.statusDriver.user_id);
            }
          } else {
            this.showError(result.message || '更新失败');
          }
        } else {
          throw new Error('更新失败');
        }
      } catch (error) {
        console.error('更新司机状态失败:', error);
        this.showError('更新司机状态失败');
      } finally {
        this.updatingStatus = false;
      }
    },
    
    // 辅助方法
    getStatusText(status) {
      const statusMap = {
        on_duty: '在岗',
        resting: '休息',
        driving: '驾驶中',
        off_duty: '下班',
        available: '可用'
      };
      return statusMap[status] || '未知';
    },
    
    getTaskStatusText(status) {
      const statusMap = {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        assigned: '已派车',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || status;
    },
    
    formatTime(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } catch {
        return dateStr;
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      } catch {
        return dateStr;
      }
    },
    
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } catch {
        return dateStr;
      }
    },
    
    formatFullDateTime(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } catch {
        return dateStr;
      }
    },
    
    formatNumber(num) {
      if (!num) return '0';
      return parseFloat(num).toLocaleString('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    },
    
    getCompletionRateClass(rate) {
      if (rate >= 90) return 'excellent';
      if (rate >= 70) return 'good';
      if (rate >= 50) return 'average';
      return 'poor';
    },
    
    getPunctualityRateClass(rate) {
      if (rate >= 95) return 'excellent';
      if (rate >= 80) return 'good';
      if (rate >= 60) return 'average';
      return 'poor';
    },
    
    // UI方法
    assignTask(driver) {
      if (driver.status !== 'on_duty') {
        this.showError('该司机不在岗，无法派发任务');
        return;
      }
      
      this.selectedDriver = driver;
      this.selectedTask = '';
      this.selectedTaskDetails = null;
      this.loadAvailableTasks();
      this.showAssignModal = true;
    },
    
    contactDriver(driver) {
      if (!driver.phone) {
        this.showError('该司机未设置电话号码');
        return;
      }
      
      if (confirm(`是否要联系司机 ${driver.real_name}？\n电话号码：${driver.phone}`)) {
        window.location.href = `tel:${driver.phone}`;
      }
    },
    
    updateDriverStatus(driver) {
      this.statusDriver = driver;
      this.newDriverStatus = driver.status || 'on_duty';
      this.showStatusModal = true;
    },
    
    viewDriverDetail(driverId) {
      this.loadDriverDetail(driverId);
    },
    
    viewTask(task) {
      alert(`查看任务 #${task.application_id}\n${task.reason}\n时间：${this.formatDateTime(task.start_time)}`);
    },
    
    resetFilters() {
      this.searchKeyword = '';
      this.filterStatus = 'all';
      this.sortBy = 'name';
      this.loadDrivers();
    },
    
    showTodaySchedule() {
      alert('今日排班表功能开发中...');
    },
    
    showPerformance() {
      this.loadPerformance();
    },
    
    showError(message) {
      alert(`错误：${message}`);
    },
    
    showSuccess(message) {
      alert(`成功：${message}`);
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
.manager-drivers {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航 */
.header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981);
}

.user-info {
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
}

.user-details h3 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 22px;
  font-weight: 700;
}

.user-details p {
  margin: 4px 0;
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 500;
}

.fleet-info {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  font-weight: 600;
  font-size: 15px;
  margin-top: 8px !important;
  display: inline-block;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.home-btn,
.logout-btn {
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.home-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logout-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15);
}

.logout-btn:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
}

/* 搜索和筛选 */
.filter-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  position: relative;
}

.filter-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 20px 20px 0 0;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 16px 24px 16px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 20px;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-size: 14px;
  color: #475569;
  font-weight: 600;
  white-space: nowrap;
}

.filter-select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  min-width: 150px;
  font-size: 14px;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.3s ease;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.refresh-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 司机统计 */
.driver-stats {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: #3b82f6;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-icon.on_duty {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.stat-icon.driving {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.stat-icon.schedule {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.stat-icon.performance {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* 司机列表 */
.drivers-list {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 80px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f1f5f9;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: #64748b;
  font-size: 15px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  border: 2px dashed #e2e8f0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #cbd5e1;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #475569;
  font-size: 20px;
}

.empty-state p {
  color: #94a3b8;
  margin: 0 0 24px 0;
  font-size: 15px;
}

.reset-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 司机网格 */
.drivers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.driver-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.driver-card:hover {
  transform: translateY(-4px);
  border-color: #3b82f6;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.driver-card.on_duty {
  border-left: 6px solid #10b981;
}

.driver-card.driving {
  border-left: 6px solid #3b82f6;
}

.driver-card.resting {
  border-left: 6px solid #f59e0b;
}

.driver-card.off_duty {
  border-left: 6px solid #64748b;
}

.driver-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.driver-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 24px;
}

.driver-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.driver-badge.on_duty {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.driver-badge.driving {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.driver-badge.resting {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.driver-badge.off_duty {
  background: linear-gradient(135deg, #64748b, #94a3b8);
  color: white;
}

.driver-info {
  margin-bottom: 20px;
}

.driver-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.driver-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
}

.driver-phone {
  font-size: 14px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.driver-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.detail-label {
  font-size: 14px;
  color: #64748b;
}

.detail-value {
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
}

.driver-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn.assign {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.action-btn.assign:disabled {
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  color: #64748b;
  cursor: not-allowed;
}

.action-btn.contact {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.action-btn.contact:disabled {
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  color: #64748b;
  cursor: not-allowed;
}

.action-btn.status {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 今日任务 */
.today-tasks {
  padding-top: 20px;
  border-top: 2px solid #f1f5f9;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tasks-title {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
}

.tasks-count {
  font-size: 13px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  border: 2px solid #f1f5f9;
  transition: all 0.2s ease;
  cursor: pointer;
}

.task-item:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.task-time {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.task-reason {
  flex: 1;
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-status {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.task-status.assigned,
.task-status.in_progress {
  background: #eff6ff;
  color: #3b82f6;
}

.task-status.completed {
  background: #f0fdf4;
  color: #10b981;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.4s ease;
}

.modal-content.large {
  max-width: 600px;
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
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #1e293b;
  font-weight: 700;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.6;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
}

.modal-content p strong {
  color: #1e293b;
}

.current-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.current-status.on_duty {
  background: #10b981;
  color: white;
}

.current-status.driving {
  background: #3b82f6;
  color: white;
}

.current-status.resting {
  background: #f59e0b;
  color: white;
}

.current-status.off_duty {
  background: #64748b;
  color: white;
}

/* 表单 */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #475569;
  font-weight: 600;
}

.form-select {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.3s ease;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.task-details {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 2px solid #f1f5f9;
}

.task-details h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #1e293b;
  font-weight: 600;
}

.task-details .detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.task-details .detail-item:last-child {
  border-bottom: none;
}

/* 司机详情 */
.driver-detail {
  margin: 20px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 30px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f1f5f9;
}

.detail-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 32px;
}

.detail-info h4 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1e293b;
  font-weight: 700;
}

.detail-meta {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}

.detail-info p {
  margin: 8px 0;
  color: #64748b;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
}

.status-badge.on_duty {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.status-badge.driving {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.status-badge.resting {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.status-badge.off_duty {
  background: linear-gradient(135deg, #64748b, #94a3b8);
  color: white;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section h5 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #1e293b;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.detail-item .label {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.detail-item .value {
  display: block;
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
}

.recent-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-tasks .task-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recent-tasks .task-item:hover {
  border-color: #3b82f6;
  background: white;
  transform: translateX(4px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-id {
  font-size: 13px;
  color: #64748b;
}

.task-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.task-status.completed {
  background: #10b981;
  color: white;
}

.task-status.in_progress {
  background: #3b82f6;
  color: white;
}

.task-status.assigned {
  background: #f59e0b;
  color: white;
}

.task-reason {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
}

.task-footer {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #64748b;
}

/* 绩效统计 */
.performance-header {
  margin-bottom: 24px;
}

.period-selector {
  display: flex;
  gap: 8px;
}

.period-selector button {
  padding: 10px 20px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 12px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.period-selector button.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-color: #3b82f6;
}

.period-selector button:hover:not(.active) {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.empty-performance {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 16px;
}

.performance-table {
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr;
  padding: 16px 20px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.driver-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.driver-avatar-small {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.driver-name {
  font-weight: 600;
  color: #1e293b;
}

.completion-rate.excellent,
.punctuality-rate.excellent {
  color: #10b981;
  font-weight: 600;
}

.completion-rate.good,
.punctuality-rate.good {
  color: #3b82f6;
  font-weight: 600;
}

.completion-rate.average,
.punctuality-rate.average {
  color: #f59e0b;
  font-weight: 600;
}

.completion-rate.poor,
.punctuality-rate.poor {
  color: #ef4444;
  font-weight: 600;
}

/* 模态框操作按钮 */
.modal-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f1f5f9;
}

.cancel-btn,
.confirm-btn,
.edit-btn {
  flex: 1;
  padding: 16px;
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
  background: #f1f5f9;
  color: #475569;
  border: 2px solid #e2e8f0;
}

.confirm-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.edit-btn {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.cancel-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.confirm-btn:hover:not(:disabled),
.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.confirm-btn:disabled {
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .drivers-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .manager-drivers {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 20px;
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .filter-options {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .drivers-grid {
    grid-template-columns: 1fr;
  }
  
  .driver-actions {
    flex-direction: column;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-header div:nth-child(3),
  .table-row div:nth-child(3),
  .table-header div:nth-child(5),
  .table-row div:nth-child(5) {
    display: none;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .driver-header {
    flex-direction: column;
    gap: 16px;
    align-items: center;
    text-align: center;
  }
  
  .modal-content {
    padding: 24px;
    margin: 16px;
  }
  
  .detail-header {
    flex-direction: column;
    text-align: center;
  }
  
  .driver-actions button span:not(:first-child) {
    display: none;
  }
}
</style>