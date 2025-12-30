<!-- views/admin/Approval.vue -->
<template>
  <div class="admin-approval">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <div class="avatar-placeholder">
          <span>{{ user.real_name ? user.real_name.charAt(0).toUpperCase() : 'A' }}</span>
        </div>
        <div class="user-details">
          <h3>{{ user.real_name || '管理员' }}</h3>
          <p>申请审批管理</p>
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
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">用车申请审批</h2>
        <div class="page-subtitle">审批和管理所有员工的用车申请</div>
      </div>

      <!-- 筛选和搜索 -->
      <div class="filters-section">
        <div class="filters-row">
          <div class="filter-group">
            <label class="filter-label">申请状态：</label>
            <div class="filter-buttons">
              <button 
                v-for="status in statusOptions" 
                :key="status.value"
                :class="['status-btn', { active: selectedStatus === status.value }]"
                @click="changeStatus(status.value)"
              >
                {{ status.label }}
                <span v-if="statusCounts[status.value]" class="status-count">
                  {{ statusCounts[status.value] }}
                </span>
              </button>
            </div>
          </div>
          
          <div class="search-box">
            <div class="search-input">
              <span class="search-icon">🔍</span>
              <input 
                v-model="searchKeyword"
                type="text" 
                placeholder="搜索申请人、目的地或事由..."
                @keyup.enter="searchApplications"
              >
              <button @click="clearSearch" class="clear-btn" v-if="searchKeyword">
                ✕
              </button>
            </div>
            <button @click="searchApplications" class="search-btn">搜索</button>
          </div>
        </div>

        <div class="filters-row">
          <div class="date-filter">
            <label class="filter-label">申请时间：</label>
            <div class="date-inputs">
              <input 
                type="date" 
                v-model="startDate"
                class="date-input"
              >
              <span class="date-separator">至</span>
              <input 
                type="date" 
                v-model="endDate"
                class="date-input"
              >
            </div>
            <button @click="resetFilters" class="reset-btn">重置筛选</button>
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card total">
          <div class="stat-icon">
            <span>📋</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">总申请数</div>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">
            <span>⏳</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-label">待审批</div>
          </div>
        </div>
        <div class="stat-card approved">
          <div class="stat-icon">
            <span>✅</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ approvedCount }}</div>
            <div class="stat-label">已批准</div>
          </div>
        </div>
        <div class="stat-card rejected">
          <div class="stat-icon">
            <span>❌</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ rejectedCount }}</div>
            <div class="stat-label">已拒绝</div>
          </div>
        </div>
      </div>

      <!-- 申请列表 -->
      <div class="applications-section">
        <div class="section-header">
          <h3 class="section-title">
            {{ getStatusText(selectedStatus) }}申请列表
            <span class="count-badge">{{ filteredApplications.length }}</span>
          </h3>
          <div class="actions">
            <button @click="refreshData" class="refresh-btn">
              <span>🔄</span>
              刷新数据
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载申请列表中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredApplications.length === 0" class="empty-state">
          <div class="empty-icon">📄</div>
          <h3>暂无{{ getStatusText(selectedStatus) }}申请</h3>
          <p v-if="searchKeyword || startDate || endDate">
            尝试调整筛选条件或
            <button @click="resetFilters" class="reset-link">重置筛选</button>
          </p>
          <p v-else>目前没有符合条件的申请记录</p>
        </div>

        <!-- 申请表格 -->
        <div v-else class="applications-table">
          <div class="table-container">
            <table class="applications-table">
              <thead>
                <tr>
                  <th>申请编号</th>
                  <th>申请人</th>
                  <th>部门</th>
                  <th>事由</th>
                  <th>用车时间</th>
                  <th>目的地</th>
                  <th>车型</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="app in paginatedApplications" :key="app.application_id">
                  <td class="app-id">{{ app.application_id }}</td>
                  <td class="applicant">
                    <div class="applicant-info">
                      <span class="avatar-small">
                        {{ app.applicant_name ? app.applicant_name.charAt(0).toUpperCase() : 'U' }}
                      </span>
                      {{ app.applicant_name || '未知用户' }}
                    </div>
                  </td>
                  <td class="department">{{ app.department || '未填写' }}</td>
                  <td class="reason">{{ app.reason }}</td>
                  <td class="time">
                    <div class="time-range">
                      <div>{{ formatDateTime(app.start_time) }}</div>
                      <div>至</div>
                      <div>{{ formatDateTime(app.end_time) }}</div>
                    </div>
                  </td>
                  <td class="destination">{{ app.destination || '未填写' }}</td>
                  <td class="vehicle-type">
                    <span :class="['type-badge', app.vehicle_type]">
                      {{ getVehicleTypeText(app.vehicle_type) }}
                    </span>
                  </td>
                  <td class="apply-time">{{ formatDateTime(app.apply_time) }}</td>
                  <td class="status">
                    <span :class="['status-badge', app.status]">
                      {{ getStatusText(app.status) }}
                    </span>
                  </td>
                  <td class="actions">
                    <div class="action-buttons">
                      <button 
                        v-if="app.status === 'pending'"
                        @click="approveApplication(app)"
                        class="action-btn approve"
                        title="批准申请"
                      >
                        ✅ 批准
                      </button>
                      <button 
                        v-if="app.status === 'pending'"
                        @click="rejectApplication(app)"
                        class="action-btn reject"
                        title="拒绝申请"
                      >
                        ❌ 拒绝
                      </button>
                      <button 
                        @click="viewApplication(app)"
                        class="action-btn view"
                        title="查看详情"
                      >
                        👁️ 详情
                      </button>
                      <button 
                        v-if="['approved', 'assigned'].includes(app.status)"
                        @click="assignApplication(app)"
                        class="action-btn assign"
                        title="分配车辆"
                      >
                        🚗 分配
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              @click="prevPage"
              :disabled="currentPage === 1"
              class="page-btn prev"
            >
              上一页
            </button>
            
            <div class="page-numbers">
              <span class="page-info">
                第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
              </span>
            </div>
            
            <button 
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="page-btn next"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 审批确认模态框 -->
    <div v-if="showApproveModal" class="modal-overlay">
      <div class="modal-content">
        <h3>确认批准申请</h3>
        <div class="modal-body">
          <p>确定要批准以下申请吗？</p>
          <div class="app-info">
            <div class="info-item">
              <span class="label">申请人：</span>
              <span class="value">{{ selectedApp?.applicant_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">事由：</span>
              <span class="value">{{ selectedApp?.reason }}</span>
            </div>
            <div class="info-item">
              <span class="label">用车时间：</span>
              <span class="value">{{ formatDateTime(selectedApp?.start_time) }} 至 {{ formatDateTime(selectedApp?.end_time) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showApproveModal = false" class="cancel-btn">取消</button>
          <button @click="confirmApprove" class="confirm-btn">确认批准</button>
        </div>
      </div>
    </div>

    <!-- 拒绝模态框 -->
    <div v-if="showRejectModal" class="modal-overlay">
      <div class="modal-content">
        <h3>拒绝申请</h3>
        <div class="modal-body">
          <p>请填写拒绝原因：</p>
          <textarea 
            v-model="rejectReason"
            placeholder="请输入拒绝申请的具体原因..."
            rows="4"
            class="reject-textarea"
          ></textarea>
          <div v-if="rejectError" class="error-message">
            {{ rejectError }}
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showRejectModal = false" class="cancel-btn">取消</button>
          <button @click="confirmReject" class="reject-confirm-btn">确认拒绝</button>
        </div>
      </div>
    </div>

    <!-- 分配车辆模态框 -->
    <div v-if="showAssignModal" class="modal-overlay">
      <div class="modal-content large">
        <h3>分配车辆和司机</h3>
        <div class="modal-body">
          <!-- 申请信息 -->
          <div class="app-summary">
            <h4>申请信息</h4>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">申请人：</span>
                <span class="value">{{ selectedApp?.applicant_name }}</span>
              </div>
              <div class="summary-item">
                <span class="label">部门：</span>
                <span class="value">{{ selectedApp?.department }}</span>
              </div>
              <div class="summary-item">
                <span class="label">事由：</span>
                <span class="value">{{ selectedApp?.reason }}</span>
              </div>
              <div class="summary-item">
                <span class="label">用车时间：</span>
                <span class="value">{{ formatDateTime(selectedApp?.start_time) }}</span>
              </div>
              <div class="summary-item">
                <span class="label">目的地：</span>
                <span class="value">{{ selectedApp?.destination || '未填写' }}</span>
              </div>
              <div class="summary-item">
                <span class="label">所需车型：</span>
                <span class="value">{{ getVehicleTypeText(selectedApp?.vehicle_type) }}</span>
              </div>
            </div>
          </div>

          <!-- 车队选择 -->
          <div class="fleet-section">
            <h4>选择车队</h4>
            <div class="fleet-options">
              <div 
                v-for="fleet in fleets" 
                :key="fleet.fleet_id"
                :class="['fleet-option', { active: selectedFleetId === fleet.fleet_id }]"
                @click="selectFleet(fleet.fleet_id)"
              >
                <div class="fleet-icon">🚗</div>
                <div class="fleet-info">
                  <div class="fleet-name">{{ fleet.fleet_name }}</div>
                  <div class="fleet-meta">
                    可用车辆: {{ fleet.available_vehicles || 0 }} | 司机: {{ fleet.driver_count || 0 }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 车辆选择 -->
          <div class="vehicle-section" v-if="selectedFleetId">
            <h4>选择车辆</h4>
            <div v-if="loadingVehicles" class="loading-small">
              <div class="spinner-small"></div>
              <span>加载可用车辆...</span>
            </div>
            <div v-else-if="availableVehicles.length === 0" class="empty-small">
              该车队暂无可用车辆
            </div>
            <div v-else class="vehicle-options">
              <div 
                v-for="vehicle in availableVehicles" 
                :key="vehicle.vehicle_id"
                :class="['vehicle-option', { active: selectedVehicleId === vehicle.vehicle_id }]"
                @click="selectVehicle(vehicle.vehicle_id)"
              >
                <div class="vehicle-icon">
                  <span v-if="vehicle.vehicle_type === 'small'">🚗</span>
                  <span v-else-if="vehicle.vehicle_type === 'business'">🚙</span>
                  <span v-else-if="vehicle.vehicle_type === 'coach'">🚌</span>
                  <span v-else>🚗</span>
                </div>
                <div class="vehicle-info">
                  <div class="vehicle-main">
                    <span class="license-plate">{{ vehicle.license_plate }}</span>
                    <span class="brand">{{ vehicle.brand }} {{ vehicle.model }}</span>
                  </div>
                  <div class="vehicle-meta">
                    <span class="capacity">座位数: {{ vehicle.capacity }}</span>
                    <span class="status" :class="vehicle.status">{{ vehicle.status === 'available' ? '可用' : '忙碌' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 司机选择 -->
          <div class="driver-section" v-if="selectedFleetId">
            <h4>选择司机</h4>
            <div v-if="loadingDrivers" class="loading-small">
              <div class="spinner-small"></div>
              <span>加载可用司机...</span>
            </div>
            <div v-else-if="availableDrivers.length === 0" class="empty-small">
              该车队暂无可用司机
            </div>
            <div v-else class="driver-options">
              <div 
                v-for="driver in availableDrivers" 
                :key="driver.user_id"
                :class="['driver-option', { active: selectedDriverId === driver.user_id }]"
                @click="selectDriver(driver.user_id)"
              >
                <div class="driver-avatar">
                  {{ driver.real_name ? driver.real_name.charAt(0).toUpperCase() : 'D' }}
                </div>
                <div class="driver-info">
                  <div class="driver-name">{{ driver.real_name }}</div>
                  <div class="driver-meta">
                    <span class="phone">{{ driver.phone }}</span>
                    <span class="trips">本月出车: {{ driver.monthly_trips || 0 }}次</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="assignError" class="error-message">
            {{ assignError }}
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeAssignModal" class="cancel-btn">取消</button>
          <button 
            @click="confirmAssign" 
            :disabled="!selectedFleetId || !selectedVehicleId || !selectedDriverId"
            class="confirm-btn"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminApproval',
  data() {
    return {
      user: {},
      applications: [],
      filteredApplications: [],
      loading: true,
      
      // 筛选条件
      selectedStatus: 'pending',
      searchKeyword: '',
      startDate: '',
      endDate: '',
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      
      // 状态统计
      statusCounts: {
        all: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        assigned: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      },
      
      // 模态框
      showApproveModal: false,
      showRejectModal: false,
      showAssignModal: false,
      
      // 选中的申请
      selectedApp: null,
      rejectReason: '',
      rejectError: '',
      
      // 分配相关
      fleets: [],
      availableVehicles: [],
      availableDrivers: [],
      selectedFleetId: null,
      selectedVehicleId: null,
      selectedDriverId: null,
      loadingVehicles: false,
      loadingDrivers: false,
      assignError: ''
    };
  },
  computed: {
    // 状态选项
    statusOptions() {
      return [
        { label: '全部', value: 'all' },
        { label: '待审批', value: 'pending' },
        { label: '已批准', value: 'approved' },
        { label: '已拒绝', value: 'rejected' },
        { label: '已分配', value: 'assigned' },
        { label: '进行中', value: 'in_progress' },
        { label: '已完成', value: 'completed' },
        { label: '已取消', value: 'cancelled' }
      ];
    },
    
    // 分页数据
    paginatedApplications() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredApplications.slice(start, end);
    },
    
    // 总页数
    totalPages() {
      return Math.ceil(this.filteredApplications.length / this.pageSize);
    },
    
    // 统计总数
    totalCount() {
      return this.applications.length;
    },
    
    // 待审批数量
    pendingCount() {
      return this.statusCounts.pending || 0;
    },
    
    // 已批准数量
    approvedCount() {
      return this.statusCounts.approved || 0;
    },
    
    // 已拒绝数量
    rejectedCount() {
      return this.statusCounts.rejected || 0;
    }
  },
  watch: {
    selectedStatus() {
      this.currentPage = 1;
      this.filterApplications();
    },
    searchKeyword() {
      this.currentPage = 1;
      this.filterApplications();
    },
    startDate() {
      this.currentPage = 1;
      this.filterApplications();
    },
    endDate() {
      this.currentPage = 1;
      this.filterApplications();
    },
    
    // 监听车队选择变化，加载车辆和司机
    selectedFleetId(newFleetId) {
      if (newFleetId) {
        this.loadAvailableVehicles();
        this.loadAvailableDrivers();
      } else {
        this.availableVehicles = [];
        this.availableDrivers = [];
      }
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadApplications();
    this.loadFleets();
  },
  methods: {
    // 加载用户信息
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    // 加载所有申请
    async loadApplications() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/applications?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.applications = result.data || [];
            this.calculateStatusCounts();
            this.filterApplications();
          } else {
            this.loadMockData();
          }
        } else {
          this.loadMockData();
        }
      } catch (error) {
        console.error('加载申请列表失败:', error);
        this.loadMockData();
      } finally {
        this.loading = false;
      }
    },
    
    // 加载车队列表
    async loadFleets() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/admin/fleets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.fleets = result.data || [];
          }
        }
      } catch (error) {
        console.error('加载车队列表失败:', error);
      }
    },
    
    // 加载可用车辆
    async loadAvailableVehicles() {
      if (!this.selectedFleetId) return;
      
      this.loadingVehicles = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 筛选出指定车队且状态可用的车辆
            const vehicles = result.data || [];
            this.availableVehicles = vehicles.filter(vehicle => 
              vehicle.fleet_id === this.selectedFleetId && 
              vehicle.status === 'available'
            );
          }
        }
      } catch (error) {
        console.error('加载车辆失败:', error);
        this.availableVehicles = [];
      } finally {
        this.loadingVehicles = false;
      }
    },
    
    // 加载可用司机
    async loadAvailableDrivers() {
      if (!this.selectedFleetId) return;
      
      this.loadingDrivers = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/admin/fleets/${this.selectedFleetId}/available-drivers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.availableDrivers = result.data || [];
          }
        }
      } catch (error) {
        console.error('加载司机失败:', error);
        this.availableDrivers = [];
      } finally {
        this.loadingDrivers = false;
      }
    },
    
    // 计算状态统计
    calculateStatusCounts() {
      // 重置统计
      const counts = {
        all: this.applications.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        assigned: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
      
      this.applications.forEach(app => {
        if (app.status in counts) {
          counts[app.status]++;
        }
      });
      
      this.statusCounts = counts;
    },
    
    // 过滤申请
    filterApplications() {
      let filtered = [...this.applications];
      
      // 状态筛选
      if (this.selectedStatus !== 'all') {
        filtered = filtered.filter(app => app.status === this.selectedStatus);
      }
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(app => 
          (app.applicant_name && app.applicant_name.toLowerCase().includes(keyword)) ||
          (app.reason && app.reason.toLowerCase().includes(keyword)) ||
          (app.destination && app.destination.toLowerCase().includes(keyword)) ||
          (app.department && app.department.toLowerCase().includes(keyword))
        );
      }
      
      // 时间筛选
      if (this.startDate) {
        const startDate = new Date(this.startDate);
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(app => {
          const applyDate = new Date(app.apply_time);
          return applyDate >= startDate;
        });
      }
      
      if (this.endDate) {
        const endDate = new Date(this.endDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(app => {
          const applyDate = new Date(app.apply_time);
          return applyDate <= endDate;
        });
      }
      
      this.filteredApplications = filtered;
    },
    
    // 更改状态筛选
    changeStatus(status) {
      this.selectedStatus = status;
    },
    
    // 搜索申请
    searchApplications() {
      this.filterApplications();
    },
    
    // 清除搜索
    clearSearch() {
      this.searchKeyword = '';
      this.filterApplications();
    },
    
    // 重置筛选
    resetFilters() {
      this.selectedStatus = 'pending';
      this.searchKeyword = '';
      this.startDate = '';
      this.endDate = '';
      this.filterApplications();
    },
    
    // 刷新数据
    refreshData() {
      this.loadApplications();
      this.loadFleets();
    },
    
    // 分页方法
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.scrollToTop();
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.scrollToTop();
      }
    },
    
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    // 格式方法
    formatDateTime(dateStr) {
      if (!dateStr) return '未设置';
      try {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } catch (error) {
        return '日期错误';
      }
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车',
        van: '面包车'
      };
      return typeMap[type] || type;
    },
    
    getStatusText(status) {
      const statusMap = {
        all: '全部',
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        assigned: '已分配',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || status;
    },
    
    // 审批操作
    approveApplication(app) {
      this.selectedApp = app;
      this.showApproveModal = true;
    },
    
    async confirmApprove() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/admin/approve-application/${this.selectedApp.application_id}`, {
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
          alert('申请已批准');
          this.showApproveModal = false;
          this.refreshData();
        } else {
          alert('批准失败: ' + result.message);
        }
      } catch (error) {
        console.error('批准申请失败:', error);
        alert('批准操作失败');
      }
    },
    
    // 拒绝操作
    rejectApplication(app) {
      this.selectedApp = app;
      this.rejectReason = '';
      this.rejectError = '';
      this.showRejectModal = true;
    },
    
    async confirmReject() {
      if (!this.rejectReason.trim()) {
        this.rejectError = '请填写拒绝原因';
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/admin/approve-application/${this.selectedApp.application_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'reject',
            reject_reason: this.rejectReason
          })
        });
        
        const result = await response.json();
        if (result.success) {
          alert('申请已拒绝');
          this.showRejectModal = false;
          this.refreshData();
        } else {
          alert('拒绝失败: ' + result.message);
        }
      } catch (error) {
        console.error('拒绝申请失败:', error);
        alert('拒绝操作失败');
      }
    },
    
    // 分配操作
    assignApplication(app) {
      this.selectedApp = app;
      this.selectedFleetId = null;
      this.selectedVehicleId = null;
      this.selectedDriverId = null;
      this.assignError = '';
      this.showAssignModal = true;
    },
    
    selectFleet(fleetId) {
      this.selectedFleetId = fleetId;
      this.selectedVehicleId = null;
      this.selectedDriverId = null;
    },
    
    selectVehicle(vehicleId) {
      this.selectedVehicleId = vehicleId;
    },
    
    selectDriver(driverId) {
      this.selectedDriverId = driverId;
    },
    
    async confirmAssign() {
      if (!this.selectedFleetId || !this.selectedVehicleId || !this.selectedDriverId) {
        this.assignError = '请选择车队、车辆和司机';
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/admin/assign-application/${this.selectedApp.application_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fleet_id: this.selectedFleetId,
            vehicle_id: this.selectedVehicleId,
            driver_id: this.selectedDriverId
          })
        });
        
        const result = await response.json();
        if (result.success) {
          alert('任务分配成功');
          this.closeAssignModal();
          this.refreshData();
        } else {
          this.assignError = '分配失败: ' + result.message;
        }
      } catch (error) {
        console.error('分配任务失败:', error);
        this.assignError = '分配操作失败，请稍后重试';
      }
    },
    
    closeAssignModal() {
      this.showAssignModal = false;
      this.selectedFleetId = null;
      this.selectedVehicleId = null;
      this.selectedDriverId = null;
      this.assignError = '';
    },
    
    // 查看申请详情
    viewApplication(app) {
      this.$router.push(`/admin/application/${app.application_id}`);
    },
    
    // 其他方法
    switchToEmployeeView() {
      this.$router.push('/home');
    },
    
    logout() {
      localStorage.clear();
      this.$router.push('/login');
    },
    
    // 模拟数据（当API不可用时）
    loadMockData() {
      const mockApplications = [
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
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date().toISOString()
        },
        {
          application_id: 2,
          reason: '会议接送',
          status: 'approved',
          applicant_name: '李总监',
          department: '市场部',
          people_count: 2,
          vehicle_type: 'business',
          destination: '国际会议中心',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 86400000 + 4 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date(Date.now() - 3600000).toISOString()
        },
        {
          application_id: 3,
          reason: '材料运输',
          status: 'rejected',
          applicant_name: '王主管',
          department: '采购部',
          people_count: 1,
          vehicle_type: 'small',
          destination: '物流中心',
          start_time: new Date(Date.now() + 172800000).toISOString(),
          end_time: new Date(Date.now() + 172800000 + 3 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date(Date.now() - 7200000).toISOString(),
          reject_reason: '车辆资源紧张，建议选择其他时间'
        },
        {
          application_id: 4,
          reason: '团队建设',
          status: 'assigned',
          applicant_name: '赵组长',
          department: '技术部',
          people_count: 15,
          vehicle_type: 'coach',
          destination: '团建基地',
          start_time: new Date(Date.now() + 259200000).toISOString(),
          end_time: new Date(Date.now() + 259200000 + 8 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date(Date.now() - 86400000).toISOString(),
          assigned_fleet_id: 'fleet_001',
          assigned_vehicle_id: 'vehicle_003',
          assigned_driver_id: 'driver_002'
        },
        {
          application_id: 5,
          reason: '机场接机',
          status: 'in_progress',
          applicant_name: '钱经理',
          department: '行政部',
          people_count: 2,
          vehicle_type: 'business',
          destination: '国际机场',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      this.applications = mockApplications;
      this.calculateStatusCounts();
      this.filterApplications();
    }
  }
};
</script>

<style scoped>
.admin-approval {
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

/* 页面标题 */
.page-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e8e8e8;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
  position: relative;
  padding-left: 20px;
}

.page-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 32px;
  background: linear-gradient(to bottom, #1890ff, #40a9ff);
  border-radius: 4px;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  padding-left: 20px;
}

/* 筛选区域 */
.filters-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}

.filters-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.filter-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-btn:hover {
  background: #e9ecef;
  border-color: #d9d9d9;
  transform: translateY(-1px);
}

.status-btn.active {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border-color: #1890ff;
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.status-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.search-box {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 300px;
}

.search-input {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #999;
  font-size: 16px;
}

.search-input input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.search-input input:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #999;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.search-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.date-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #f8f9fa;
  max-width: 200px;
}

.date-input:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.date-separator {
  color: #999;
  font-size: 14px;
  font-weight: 500;
}

.reset-btn {
  padding: 10px 20px;
  background: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: #e9ecef;
  border-color: #d9d9d9;
  transform: translateY(-1px);
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.total:hover {
  border-color: #1890ff;
}

.stat-card.pending:hover {
  border-color: #fa8c16;
}

.stat-card.approved:hover {
  border-color: #52c41a;
}

.stat-card.rejected:hover {
  border-color: #ff4d4f;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.stat-card.pending .stat-icon {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.stat-card.approved .stat-icon {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.stat-card.rejected .stat-icon {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-card.total .stat-value {
  color: #1890ff;
}

.stat-card.pending .stat-value {
  color: #fa8c16;
}

.stat-card.approved .stat-value {
  color: #52c41a;
}

.stat-card.rejected .stat-value {
  color: #ff4d4f;
}

.stat-label {
  font-size: 15px;
  color: #666;
  font-weight: 500;
}

/* 申请列表区域 */
.applications-section {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-badge {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 12px;
}

.refresh-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #e9ecef, #f8f9fa);
  transform: translateY(-1px);
  border-color: #1890ff;
  color: #1890ff;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
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

.loading-state p {
  color: #666;
  font-size: 15px;
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
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  color: #666;
  font-size: 15px;
  margin: 0;
}

.reset-link {
  background: none;
  border: none;
  color: #1890ff;
  font-size: 15px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.reset-link:hover {
  color: #096dd9;
}

/* 申请表格 */
.table-container {
  overflow-x: auto;
  margin-bottom: 24px;
}

.applications-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.applications-table th {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 16px 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
  white-space: nowrap;
}

.applications-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  vertical-align: top;
}

.applications-table tbody tr {
  transition: all 0.3s ease;
}

.applications-table tbody tr:hover {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  transform: translateX(2px);
}

/* 表格列样式 */
.app-id {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #666;
}

.applicant {
  min-width: 160px;
}

.applicant-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-small {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.department {
  min-width: 120px;
}

.reason {
  max-width: 200px;
  word-wrap: break-word;
}

.time {
  min-width: 180px;
}

.time-range {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-range div {
  font-size: 13px;
  color: #666;
}

.destination {
  max-width: 150px;
  word-wrap: break-word;
}

.vehicle-type {
  min-width: 100px;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 60px;
}

.type-badge.small {
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  color: #006d75;
}

.type-badge.business {
  background: linear-gradient(135deg, #f6ffed, #d9f7be);
  color: #135200;
}

.type-badge.coach {
  background: linear-gradient(135deg, #fff7e6, #ffe7ba);
  color: #873800;
}

.type-badge.van {
  background: linear-gradient(135deg, #f9f0ff, #efdbff);
  color: #22075e;
}

.apply-time {
  min-width: 140px;
}

.status {
  min-width: 100px;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 70px;
}

.status-badge.pending {
  background: linear-gradient(135deg, #fff7e6, #ffe7ba);
  color: #d46b08;
}

.status-badge.approved {
  background: linear-gradient(135deg, #f6ffed, #d9f7be);
  color: #389e0d;
}

.status-badge.rejected {
  background: linear-gradient(135deg, #fff1f0, #ffccc7);
  color: #cf1322;
}

.status-badge.assigned {
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  color: #006d75;
}

.status-badge.in_progress {
  background: linear-gradient(135deg, #fff7e6, #ffe7ba);
  color: #d46b08;
}

.status-badge.completed {
  background: linear-gradient(135deg, #f6ffed, #d9f7be);
  color: #389e0d;
}

.status-badge.cancelled {
  background: linear-gradient(135deg, #f0f0f0, #d9d9d9);
  color: #595959;
}

.actions {
  min-width: 200px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn.approve {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.action-btn.reject {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
}

.action-btn.view {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #333;
  border: 1px solid #e8e8e8;
}

.action-btn.assign {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.page-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #e9ecef, #f8f9fa);
  transform: translateY(-1px);
  border-color: #1890ff;
  color: #1890ff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
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

.modal-content.large {
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
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
  font-size: 22px;
  color: #333;
  font-weight: 600;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.modal-body {
  margin-bottom: 32px;
}

.modal-body p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 15px;
  line-height: 1.6;
}

.app-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #f0f0f0;
}

.info-item {
  margin-bottom: 12px;
  display: flex;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  font-weight: 600;
  color: #333;
  min-width: 80px;
}

.info-item .value {
  color: #666;
  flex: 1;
}

.reject-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.reject-textarea:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.error-message {
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fff1f0;
  border-radius: 8px;
  border: 1px solid #ffa39e;
}

.modal-actions {
  display: flex;
  gap: 16px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.cancel-btn,
.confirm-btn,
.reject-confirm-btn {
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

.cancel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #e9ecef, #f8f9fa);
}

.confirm-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(82, 196, 26, 0.4);
  background: linear-gradient(135deg, #73d13d, #52c41a);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.reject-confirm-btn {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.reject-confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.4);
  background: linear-gradient(135deg, #ff7875, #ff4d4f);
}

/* 分配模态框内容 */
.app-summary {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f0f0f0;
}

.app-summary h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #f0f0f0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item .label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.summary-item .value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.fleet-section,
.vehicle-section,
.driver-section {
  margin-bottom: 24px;
}

.fleet-section h4,
.vehicle-section h4,
.driver-section h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.fleet-options,
.vehicle-options,
.driver-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.fleet-option,
.vehicle-option,
.driver-option {
  padding: 12px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
}

.fleet-option:hover,
.vehicle-option:hover,
.driver-option:hover {
  background: #e9ecef;
  border-color: #d9d9d9;
  transform: translateY(-2px);
}

.fleet-option.active,
.vehicle-option.active,
.driver-option.active {
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.fleet-icon,
.vehicle-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.fleet-icon {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.vehicle-icon {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.driver-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #722ed1, #9254de);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.fleet-info,
.vehicle-info,
.driver-info {
  flex: 1;
  min-width: 0;
}

.fleet-name,
.driver-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.fleet-meta,
.vehicle-meta,
.driver-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.vehicle-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.license-plate {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.brand {
  font-size: 13px;
  color: #666;
}

.capacity,
.trips {
  font-size: 12px;
  color: #666;
}

.phone {
  font-size: 12px;
  color: #666;
}

.loading-small,
.empty-small {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-small span {
  color: #666;
  font-size: 14px;
}

.empty-small {
  color: #999;
  font-size: 14px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .date-inputs {
    max-width: none;
  }
  
  .date-input {
    max-width: none;
  }
}

@media (max-width: 768px) {
  .admin-approval {
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
  
  .page-title {
    font-size: 24px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .applications-section {
    padding: 24px 16px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .table-container {
    margin: 0 -16px;
    padding: 0 16px;
  }
  
  .modal-content {
    padding: 24px;
    margin: 0 16px;
  }
  
  .modal-content.large {
    margin: 16px;
    max-height: 70vh;
  }
  
  .fleet-options,
  .vehicle-options,
  .driver-options {
    grid-template-columns: 1fr;
    max-height: 150px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .confirm-btn,
  .reject-confirm-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .filter-buttons {
    justify-content: center;
  }
  
  .status-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .page-btn {
    width: 100%;
  }
}
</style>