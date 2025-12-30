<template>
  <div class="admin-missions">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="header-content">
        <button @click="$router.push('/admin')" class="back-btn">
          ← 返回工作台
        </button>
        <h1>任务管理</h1>
        <div class="header-actions">
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            🔄 {{ loading ? '刷新中...' : '刷新' }}
          </button>
        </div>
      </div>
      
      <!-- 筛选工具栏 -->
      <div class="filter-toolbar">
        <div class="filter-group">
          <div class="filter-item">
            <label>状态筛选:</label>
            <div class="filter-buttons">
              <button 
                v-for="status in statusOptions" 
                :key="status.value"
                :class="['status-filter-btn', { active: filterStatus === status.value }]"
                @click="toggleStatusFilter(status.value)"
              >
                {{ status.label }} ({{ statusCounts[status.value] || 0 }})
              </button>
            </div>
          </div>
          
          <div class="filter-item">
            <label>日期范围:</label>
            <div class="date-range">
              <input 
                type="date" 
                v-model="filterStartDate" 
                class="date-input"
                @change="applyDateFilter"
              >
              <span>至</span>
              <input 
                type="date" 
                v-model="filterEndDate" 
                class="date-input"
                @change="applyDateFilter"
              >
              <button @click="clearDateFilter" class="clear-btn">
                ✕ 清除
              </button>
            </div>
          </div>
          
          <div class="filter-item">
            <label>搜索:</label>
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="搜索申请人、车牌、目的地..." 
                class="search-input"
                @input="applySearch"
              >
              <span class="search-icon">🔍</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon total">
            <span>📋</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalTasks }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon today">
            <span>📅</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayTasks }}</div>
            <div class="stat-label">今日任务</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <span>🚗</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeTasks }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon completed">
            <span>✅</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completedTasks }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="content-container">
        <!-- 任务表格 -->
        <div class="missions-table-container">
          <div class="table-header">
            <h3>任务列表</h3>
            <div class="table-controls">
              <span class="total-count">共 {{ filteredMissions.length }} 条记录</span>
              <div class="view-options">
                <button 
                  :class="['view-btn', { active: viewMode === 'list' }]"
                  @click="viewMode = 'list'"
                >
                  📋 列表视图
                </button>
                <button 
                  :class="['view-btn', { active: viewMode === 'calendar' }]"
                  @click="viewMode = 'calendar'"
                >
                  📅 日历视图
                </button>
              </div>
              <div class="table-actions">
                <button @click="exportToExcel" class="export-btn">
                  📊 导出Excel
                </button>
                <button @click="showBulkActions = !showBulkActions" class="bulk-btn">
                  ⚙️ 批量操作
                </button>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-if="viewMode === 'list'" class="missions-list">
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>加载任务中...</p>
            </div>
            
            <div v-else-if="filteredMissions.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <h3>暂无任务</h3>
              <p>没有找到符合条件的任务</p>
              <button @click="clearFilters" class="reset-btn">
                🔄 重置筛选条件
              </button>
            </div>
            
            <div v-else class="missions-grid">
              <div 
                v-for="mission in paginatedMissions" 
                :key="mission.application_id"
                :class="['mission-card', mission.status]"
                @click="viewMissionDetail(mission)"
              >
                <div class="card-header">
                  <div class="mission-title">
                    <h4>{{ mission.reason }}</h4>
                    <span :class="['status-badge', mission.status]">
                      {{ getStatusText(mission.status) }}
                    </span>
                  </div>
                  <span class="mission-time">
                    {{ formatDateTime(mission.start_time) }}
                  </span>
                </div>
                
                <div class="card-content">
                  <div class="mission-info">
                    <div class="info-row">
                      <div class="info-item">
                        <span class="label">申请人:</span>
                        <span class="value">{{ mission.applicant_name }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">部门:</span>
                        <span class="value">{{ mission.department || '未填写' }}</span>
                      </div>
                    </div>
                    
                    <div class="info-row">
                      <div class="info-item">
                        <span class="label">车牌:</span>
                        <span class="value highlight">
                          {{ mission.license_plate || '待分配' }}
                        </span>
                      </div>
                      <div class="info-item">
                        <span class="label">司机:</span>
                        <span class="value highlight">
                          {{ mission.driver_name || '待分配' }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="info-row">
                      <div class="info-item">
                        <span class="label">目的地:</span>
                        <span class="value">{{ mission.destination || '未填写' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">人数:</span>
                        <span class="value">{{ mission.people_count }}人</span>
                      </div>
                    </div>
                    
                    <div v-if="mission.remarks" class="info-row">
                      <div class="info-item full">
                        <span class="label">备注:</span>
                        <span class="value remarks">{{ mission.remarks }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="card-actions">
                    <template v-if="mission.status === 'assigned'">
                      <button @click.stop="assignVehicle(mission)" class="action-btn assign-btn">
                        🚗 分配车辆
                      </button>
                      <button @click.stop="assignDriver(mission)" class="action-btn driver-btn">
                        👨‍✈️ 分配司机
                      </button>
                    </template>
                    <template v-else-if="mission.status === 'in_progress'">
                      <button @click.stop="completeMission(mission)" class="action-btn complete-btn">
                        ✅ 完成任务
                      </button>
                    </template>
                    <button @click.stop="viewMissionDetail(mission)" class="action-btn detail-btn">
                      📄 查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 分页控件 -->
            <div v-if="filteredMissions.length > 0" class="pagination">
              <div class="pagination-info">
                显示 {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredMissions.length) }} 条，共 {{ filteredMissions.length }} 条
              </div>
              <div class="pagination-controls">
                <button 
                  @click="prevPage" 
                  :disabled="currentPage === 1"
                  class="page-btn prev"
                >
                  ← 上一页
                </button>
                <div class="page-numbers">
                  <button 
                    v-for="page in visiblePages" 
                    :key="page"
                    :class="['page-number', { active: page === currentPage }]"
                    @click="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                </div>
                <button 
                  @click="nextPage" 
                  :disabled="currentPage === totalPages"
                  class="page-btn next"
                >
                  下一页 →
                </button>
              </div>
              <div class="page-size-selector">
                <label>每页显示:</label>
                <select v-model="pageSize" @change="resetPage">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 日历视图 -->
          <div v-else-if="viewMode === 'calendar'" class="calendar-view">
            <div class="calendar-header">
              <h4>任务日历视图</h4>
              <div class="calendar-controls">
                <button @click="prevMonth">← 上月</button>
                <span class="current-month">{{ currentMonth }}</span>
                <button @click="nextMonth">下月 →</button>
              </div>
            </div>
            <div class="calendar-placeholder">
              <p>📅 日历视图正在开发中...</p>
              <p>暂未实现，请使用列表视图</p>
            </div>
          </div>
        </div>

        <!-- 右侧统计面板 -->
        <div class="right-sidebar">
          <!-- 今日出车计划 -->
          <div class="today-plan">
            <h3>今日出车计划</h3>
            <div class="plan-list">
              <div v-if="todayMissions.length === 0" class="empty-plan">
                <p>今日无出车计划</p>
              </div>
              <div v-else>
                <div 
                  v-for="mission in todayMissions" 
                  :key="mission.application_id"
                  class="plan-item"
                  @click="viewMissionDetail(mission)"
                >
                  <div class="plan-time">
                    {{ formatTime(mission.start_time) }}
                  </div>
                  <div class="plan-info">
                    <h5>{{ mission.reason }}</h5>
                    <p>{{ mission.applicant_name }} • {{ mission.license_plate || '待分配' }}</p>
                  </div>
                  <div :class="['plan-status', mission.status]">
                    {{ getStatusText(mission.status) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 任务状态分布 -->
          <div class="status-distribution">
            <h3>任务状态分布</h3>
            <div class="distribution-chart">
              <div class="chart-bars">
                <div 
                  v-for="status in statusOptions.filter(s => s.value !== 'all')" 
                  :key="status.value"
                  class="chart-bar"
                >
                  <div class="bar-label">
                    <span class="status-dot" :class="status.value"></span>
                    {{ status.label }}
                  </div>
                  <div class="bar-container">
                    <div 
                      class="bar-fill"
                      :class="status.value"
                      :style="{ width: getStatusPercentage(status.value) }"
                    ></div>
                    <span class="bar-count">{{ statusCounts[status.value] || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 车辆使用统计 -->
          <div class="vehicle-stats">
            <h3>车辆使用排行</h3>
            <div class="vehicle-list">
              <div v-for="vehicle in vehicleUsage" :key="vehicle.license_plate" class="vehicle-item">
                <div class="vehicle-info">
                  <span class="license-plate">{{ vehicle.license_plate }}</span>
                  <span class="vehicle-model">{{ vehicle.brand }} {{ vehicle.model }}</span>
                </div>
                <div class="usage-count">
                  <span class="count">{{ vehicle.mission_count }}</span>
                  <span class="label">次任务</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模态框：任务详情 -->
    <div v-if="showMissionDetail" class="modal-overlay">
      <div class="modal-content mission-detail-modal">
        <div class="modal-header">
          <h3>任务详情</h3>
          <button @click="closeMissionDetail" class="close-btn">×</button>
        </div>
        
        <div v-if="selectedMission" class="modal-body">
          <div class="detail-sections">
            <div class="section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">申请事由:</span>
                  <span class="value">{{ selectedMission.reason }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">申请人:</span>
                  <span class="value">{{ selectedMission.applicant_name }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">部门:</span>
                  <span class="value">{{ selectedMission.department }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">申请时间:</span>
                  <span class="value">{{ formatFullDateTime(selectedMission.apply_time) }}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h4>用车信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">用车时间:</span>
                  <span class="value">{{ formatFullDateTime(selectedMission.start_time) }} - {{ formatTime(selectedMission.end_time) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">出行人数:</span>
                  <span class="value">{{ selectedMission.people_count }}人</span>
                </div>
                <div class="detail-item">
                  <span class="label">车型需求:</span>
                  <span class="value">{{ getVehicleTypeText(selectedMission.vehicle_type) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">目的地:</span>
                  <span class="value">{{ selectedMission.destination }}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h4>分配信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">分配车辆:</span>
                  <span class="value highlight">{{ selectedMission.license_plate || '待分配' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">司机:</span>
                  <span class="value highlight">{{ selectedMission.driver_name || '待分配' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">车队:</span>
                  <span class="value">{{ selectedMission.fleet_name || '未分配' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前状态:</span>
                  <span :class="['status-value', selectedMission.status]">
                    {{ getStatusText(selectedMission.status) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="selectedMission.remarks" class="section">
              <h4>备注信息</h4>
              <div class="remarks-content">
                {{ selectedMission.remarks }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeMissionDetail" class="cancel-btn">关闭</button>
          <button @click="editMission(selectedMission)" class="edit-btn">编辑</button>
          <button 
            v-if="selectedMission && selectedMission.status === 'assigned'"
            @click="assignVehicle(selectedMission)"
            class="action-btn assign-btn"
          >
            分配车辆
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
export default {
  name: 'AdminMissions',
  data() {
    return {
      missions: [],
      todayMissions: [],
      vehicleUsage: [],
      loading: true,
      
      // 筛选条件
      filterStatus: 'all',
      filterStartDate: '',
      filterEndDate: '',
      searchQuery: '',
      
      // 视图模式
      viewMode: 'list',
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      
      // 模态框
      showMissionDetail: false,
      selectedMission: null,
      
      // 数据统计
      stats: {
        totalTasks: 0,
        todayTasks: 0,
        activeTasks: 0,
        completedTasks: 0
      },
      
      // 状态选项
      statusOptions: [
        { value: 'all', label: '全部' },
        { value: 'pending', label: '待审批' },
        { value: 'approved', label: '已批准' },
        { value: 'assigned', label: '已分配' },
        { value: 'in_progress', label: '进行中' },
        { value: 'completed', label: '已完成' },
        { value: 'rejected', label: '已拒绝' },
        { value: 'cancelled', label: '已取消' }
      ]
    };
  },
  computed: {
    // 状态计数
    statusCounts() {
      const counts = {};
      this.statusOptions.forEach(status => {
        counts[status.value] = this.missions.filter(m => m.status === status.value).length;
      });
      return counts;
    },
    
    // 筛选后的任务
    filteredMissions() {
      let filtered = this.missions;
      
      // 状态筛选
      if (this.filterStatus && this.filterStatus !== 'all') {
        filtered = filtered.filter(m => m.status === this.filterStatus);
      }
      
      // 日期筛选
      if (this.filterStartDate) {
        const startDate = new Date(this.filterStartDate);
        filtered = filtered.filter(m => new Date(m.start_time) >= startDate);
      }
      
      if (this.filterEndDate) {
        const endDate = new Date(this.filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(m => new Date(m.start_time) <= endDate);
      }
      
      // 搜索筛选
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(m => 
          (m.reason && m.reason.toLowerCase().includes(query)) ||
          (m.applicant_name && m.applicant_name.toLowerCase().includes(query)) ||
          (m.license_plate && m.license_plate.toLowerCase().includes(query)) ||
          (m.driver_name && m.driver_name.toLowerCase().includes(query)) ||
          (m.destination && m.destination.toLowerCase().includes(query))
        );
      }
      
      // 按开始时间排序（最新在前）
      return filtered.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    },
    
    // 分页后的任务
    paginatedMissions() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredMissions.slice(start, end);
    },
    
    // 分页信息
    totalPages() {
      return Math.ceil(this.filteredMissions.length / this.pageSize);
    },
    
    // 可见页码
    visiblePages() {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(this.totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    },
    
    // 当前月份
    currentMonth() {
      const now = new Date();
      return `${now.getFullYear()}年${now.getMonth() + 1}月`;
    }
  },
  watch: {
    missions: {
      handler(newMissions) {
        this.updateStats(newMissions);
      },
      deep: true
    }
  },
  mounted() {
    this.loadMissions();
    this.loadTodayMissions();
    this.loadVehicleUsage();
  },
  methods: {
    // 加载数据
    async loadMissions() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/applications?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.missions = result.data || [];
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
    
    async loadTodayMissions() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/admin/today-missions', {
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
      }
    },
    
    async loadVehicleUsage() {
      try {
        // 模拟车辆使用数据
        this.vehicleUsage = [
          { license_plate: '京A88888', brand: '奔驰', model: 'S400', mission_count: 12 },
          { license_plate: '京B12345', brand: '奥迪', model: 'A6L', mission_count: 9 },
          { license_plate: '京C66666', brand: '宝马', model: '530Li', mission_count: 7 },
          { license_plate: '京D77777', brand: '别克', model: 'GL8', mission_count: 5 },
          { license_plate: '京E99999', brand: '丰田', model: '凯美瑞', mission_count: 3 }
        ];
      } catch (error) {
        console.error('加载车辆使用数据失败:', error);
      }
    },
    
    // 模拟数据
    loadMockData() {
      const mockMissions = [];
      const reasons = [
        '客户拜访', '会议接待', '材料运输', '机场接机', 
        '商务洽谈', '员工通勤', '活动支持', '设备运输'
      ];
      const applicants = ['张经理', '李总监', '王主管', '刘总', '陈主任', '赵部长'];
      const departments = ['销售部', '市场部', '研发部', '人事部', '财务部', '行政部'];
      const vehicles = ['京A88888', '京B12345', '京C66666', '京D77777', '京E99999'];
      const drivers = ['王师傅', '李师傅', '张师傅', '刘师傅', '陈师傅'];
      const statuses = ['pending', 'approved', 'assigned', 'in_progress', 'completed'];
      
      for (let i = 1; i <= 25; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const startTime = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        mockMissions.push({
          application_id: i,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          applicant_name: applicants[Math.floor(Math.random() * applicants.length)],
          department: departments[Math.floor(Math.random() * departments.length)],
          people_count: Math.floor(Math.random() * 5) + 1,
          vehicle_type: 'small',
          destination: '目的地' + (Math.floor(Math.random() * 10) + 1),
          start_time: startTime.toISOString(),
          end_time: new Date(startTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          apply_time: new Date(startTime.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          license_plate: Math.random() > 0.3 ? vehicles[Math.floor(Math.random() * vehicles.length)] : null,
          driver_name: Math.random() > 0.3 ? drivers[Math.floor(Math.random() * drivers.length)] : null,
          status: status,
          remarks: Math.random() > 0.7 ? '需要特别注意的事项说明' : ''
        });
      }
      
      this.missions = mockMissions;
    },
    
    // 更新统计
    updateStats(missions) {
      const today = new Date().toISOString().split('T')[0];
      
      this.stats = {
        totalTasks: missions.length,
        todayTasks: missions.filter(m => new Date(m.start_time).toISOString().split('T')[0] === today).length,
        activeTasks: missions.filter(m => m.status === 'in_progress').length,
        completedTasks: missions.filter(m => m.status === 'completed').length
      };
    },
    
    // 筛选和搜索
    toggleStatusFilter(status) {
      this.filterStatus = status === this.filterStatus ? 'all' : status;
      this.resetPage();
    },
    
    applyDateFilter() {
      this.resetPage();
    },
    
    applySearch() {
      this.resetPage();
    },
    
    clearDateFilter() {
      this.filterStartDate = '';
      this.filterEndDate = '';
      this.resetPage();
    },
    
    clearFilters() {
      this.filterStatus = 'all';
      this.filterStartDate = '';
      this.filterEndDate = '';
      this.searchQuery = '';
      this.resetPage();
    },
    
    // 分页
    resetPage() {
      this.currentPage = 1;
    },
    
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    
    goToPage(page) {
      this.currentPage = page;
    },
    
    // 日历视图
    prevMonth() {
      // 实现月份切换
      console.log('切换到上个月');
    },
    
    nextMonth() {
      // 实现月份切换
      console.log('切换到下个月');
    },
    
    // 任务操作
    viewMissionDetail(mission) {
      this.selectedMission = mission;
      this.showMissionDetail = true;
    },
    
    closeMissionDetail() {
      this.showMissionDetail = false;
      this.selectedMission = null;
    },
    
    editMission(mission) {
      alert('编辑功能开发中: ' + mission.reason);
      // 实际开发中这里会跳转到编辑页面
    },
    
    assignVehicle(mission) {
      alert('分配车辆功能开发中: ' + mission.reason);
      // 实际开发中这里会弹出车辆选择模态框
    },
    
    assignDriver(mission) {
      alert('分配司机功能开发中: ' + mission.reason);
      // 实际开发中这里会弹出司机选择模态框
    },
    
    completeMission(mission) {
      if (confirm(`确定要完成任务 "${mission.reason}" 吗？`)) {
        alert('完成任务功能开发中');
        // 实际开发中这里会调用API更新状态
      }
    },
    
    // 批量操作
   exportToExcel() {
  const data = this.filteredMissions.map(m => ({
    任务ID: m.application_id,
    事由: m.reason,
    申请人: m.applicant_name,
    部门: m.department,
    车牌: m.license_plate || '未分配',
    司机: m.driver_name || '未分配',
    目的地: m.destination,
    人数: m.people_count,
    状态: this.getStatusText(m.status),
    开始时间: this.formatFullDateTime(m.start_time),
    结束时间: this.formatFullDateTime(m.end_time),
    备注: m.remarks
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '任务列表');

  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveAs(blob, `任务管理_${new Date().toISOString().slice(0, 10)}.xlsx`);
},

    
    // 刷新数据
    refreshData() {
      this.loading = true;
      this.loadMissions();
      this.loadTodayMissions();
      this.loadVehicleUsage();
    },
    
    // 工具函数
    formatDateTime(dateStr) {
      if (!dateStr) return '未设置';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    formatFullDateTime(dateStr) {
      if (!dateStr) return '未设置';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    formatTime(dateStr) {
      if (!dateStr) return '未设置';
      const date = new Date(dateStr);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return typeMap[type] || type;
    },
    
    getStatusPercentage(status) {
      const count = this.statusCounts[status] || 0;
      const total = this.missions.length;
      return total > 0 ? `${(count / total * 100)}%` : '0%';
    }
  }
};
</script>

<style scoped>
.admin-missions {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航 */
.header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 10px 30px rgba(24, 144, 255, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-5px);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 筛选工具栏 */
.filter-toolbar {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-item label {
  font-weight: 600;
  min-width: 80px;
  font-size: 14px;
  opacity: 0.9;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-filter-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-filter-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.status-filter-btn.active {
  background: white;
  color: #1890ff;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  flex: 1;
  max-width: 150px;
}

.date-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.clear-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: rgba(255, 77, 79, 0.3);
  transform: translateY(-2px);
}

.search-box {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 14px;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

/* 统计概览 */
.stats-overview {
  padding: 0 24px;
  margin-bottom: 32px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon.total {
  background: linear-gradient(135deg, #722ed1, #9254de);
  color: white;
}

.stat-icon.today {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.stat-icon.completed {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 主要内容区域 */
.main-content {
  padding: 0 24px 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.content-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
}

/* 任务表格容器 */
.missions-table-container {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.table-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.total-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.view-options {
  display: flex;
  gap: 8px;
}

.view-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.view-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.export-btn,
.bulk-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn:hover,
.bulk-btn:hover {
  border-color: #52c41a;
  color: #52c41a;
}

/* 任务列表 */
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  color: #d9d9d9;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  color: #666;
  margin: 0 0 20px 0;
}

.reset-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: #096dd9;
  transform: translateY(-2px);
}

/* 任务卡片 */
.missions-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mission-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.mission-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.mission-card.pending {
  border-left: 4px solid #fa8c16;
}

.mission-card.approved {
  border-left: 4px solid #1890ff;
}

.mission-card.assigned {
  border-left: 4px solid #722ed1;
}

.mission-card.in_progress {
  border-left: 4px solid #52c41a;
}

.mission-card.completed {
  border-left: 4px solid #13c2c2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.mission-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.mission-title h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  flex: 1;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.approved {
  background: #e6f7ff;
  color: #1890ff;
}

.status-badge.assigned {
  background: #f9f0ff;
  color: #722ed1;
}

.status-badge.in_progress {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.completed {
  background: #e6fffb;
  color: #13c2c2;
}

.mission-time {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  background: #f8f9fa;
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
}

.card-content {
  margin-bottom: 16px;
}

.mission-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  gap: 20px;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full {
  flex: 2;
}

.label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.value.highlight {
  color: #1890ff;
  font-weight: 600;
}

.value.remarks {
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  font-size: 13px;
  line-height: 1.5;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.assign-btn {
  background: #722ed1;
  color: white;
}

.assign-btn:hover {
  background: #531dab;
  transform: translateY(-2px);
}

.driver-btn {
  background: #1890ff;
  color: white;
}

.driver-btn:hover {
  background: #096dd9;
  transform: translateY(-2px);
}

.complete-btn {
  background: #52c41a;
  color: white;
}

.complete-btn:hover {
  background: #389e0d;
  transform: translateY(-2px);
}

.detail-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e8e8e8;
}

.detail-btn:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.pagination-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number:hover {
  background: #e6f7ff;
  color: #1890ff;
  border-color: #1890ff;
}

.page-number.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-selector label {
  font-size: 13px;
  color: #666;
}

.page-size-selector select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.page-size-selector select:focus {
  outline: none;
  border-color: #1890ff;
}

/* 日历视图 */
.calendar-view {
  text-align: center;
  padding: 40px 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-header h4 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.calendar-controls button {
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.calendar-controls button:hover {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.current-month {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.calendar-placeholder {
  padding: 40px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #d9d9d9;
}

.calendar-placeholder p {
  color: #666;
  margin: 8px 0;
}

/* 右侧边栏 */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.today-plan,
.status-distribution,
.vehicle-stats {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.today-plan h3,
.status-distribution h3,
.vehicle-stats h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-plan {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.plan-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.plan-item:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  transform: translateX(5px);
}

.plan-time {
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
  min-width: 60px;
}

.plan-info {
  flex: 1;
}

.plan-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.plan-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.plan-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.plan-status.assigned {
  background: #f9f0ff;
  color: #722ed1;
}

.plan-status.in_progress {
  background: #f6ffed;
  color: #52c41a;
}

/* 状态分布 */
.distribution-chart {
  padding: 12px 0;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  min-width: 60px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.pending { background: #fa8c16; }
.status-dot.approved { background: #1890ff; }
.status-dot.assigned { background: #722ed1; }
.status-dot.in_progress { background: #52c41a; }
.status-dot.completed { background: #13c2c2; }

.bar-container {
  flex: 1;
  height: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
}

.bar-fill.pending { background: #fa8c16; }
.bar-fill.approved { background: #1890ff; }
.bar-fill.assigned { background: #722ed1; }
.bar-fill.in_progress { background: #52c41a; }
.bar-fill.completed { background: #13c2c2; }

.bar-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: white;
}

/* 车辆使用统计 */
.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vehicle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.license-plate {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.vehicle-model {
  font-size: 12px;
  color: #999;
}

.usage-count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.usage-count .count {
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
}

.usage-count .label {
  font-size: 11px;
  color: #999;
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

.mission-detail-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 2px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.close-btn {
  width: 36px;
  height: 36px;
  background: #f8f9fa;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #ff4d4f;
  color: white;
  transform: rotate(90deg);
}

.modal-body {
  padding: 32px;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-sections .section {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
}

.detail-sections h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8e8e8;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.detail-item .value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.status-value {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.status-value.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-value.approved {
  background: #e6f7ff;
  color: #1890ff;
}

.status-value.assigned {
  background: #f9f0ff;
  color: #722ed1;
}

.status-value.in_progress {
  background: #f6ffed;
  color: #52c41a;
}

.remarks-content {
  background: white;
  border-radius: 12px;
  padding: 16px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  border: 1px solid #f0f0f0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px;
  border-top: 2px solid #f0f0f0;
}

.cancel-btn,
.edit-btn,
.action-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e8e8e8;
}

.cancel-btn:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.edit-btn {
  background: #1890ff;
  color: white;
}

.edit-btn:hover {
  background: #096dd9;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-container {
    grid-template-columns: 1fr;
  }
  
  .right-sidebar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .filter-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-item label {
    margin-bottom: 8px;
  }
  
  .filter-buttons {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  
  .date-range {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .date-input {
    min-width: 120px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
    gap: 12px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 22px;
  }
  
  .stat-value {
    font-size: 28px;
  }
  
  .table-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .table-controls {
    width: 100%;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .info-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .pagination {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .pagination-controls {
    justify-content: center;
  }
  
  .right-sidebar {
    grid-template-columns: 1fr;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0 12px 12px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .filter-buttons {
    justify-content: flex-start;
  }
  
  .status-filter-btn {
    padding: 6px 12px;
    font-size: 11px;
  }
  
  .mission-card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .mission-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>