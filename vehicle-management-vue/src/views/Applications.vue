<!-- src/views/Applications.vue -->
<template>
  <div class="applications-page">
    <!-- 顶部导航 -->
    <div class="header">
      <h1>我的申请</h1>
      <button @click="goBack" class="back-btn">返回</button>
    </div>

    <!-- 状态筛选 -->
    <div class="status-filter">
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
      
      <!-- 排序和筛选 -->
      <div class="filter-actions">
        <button class="filter-btn" @click="showFilter = !showFilter">
          <span>筛选</span>
          <span class="filter-icon">▾</span>
        </button>
        <button class="refresh-btn" @click="refreshData">
          <span>刷新</span>
          <span class="refresh-icon">↻</span>
        </button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilter" class="filter-panel">
      <div class="filter-group">
        <label>申请时间</label>
        <select v-model="filters.timeRange" class="filter-select">
          <option value="all">全部时间</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <!-- 自定义时间选择 -->
      <div v-if="filters.timeRange === 'custom'" class="filter-group">
        <label>自定义时间</label>
        <div class="custom-date-range">
          <input type="date" v-model="filters.customStartDate" class="filter-select" />
          <span>至</span>
          <input type="date" v-model="filters.customEndDate" class="filter-select" />
        </div>
      </div>

      <div class="filter-group">
        <label>车型</label>
        <select v-model="filters.vehicleType" class="filter-select">
          <option value="all">全部车型</option>
          <option value="small">小型车</option>
          <option value="business">商务车</option>
          <option value="coach">大客车</option>
        </select>
      </div>

      <div class="filter-actions">
        <button class="apply-filter" @click="applyFilters">应用筛选</button>
        <button class="reset-filter" @click="resetFilters">重置</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="applications.length === 0" class="empty-state">
      <div class="empty-icon">📄</div>
      <h3>暂无申请记录</h3>
      <p>当前筛选条件下暂无申请</p>
      <button @click="goToApply" class="apply-btn">去申请用车</button>
    </div>

    <!-- 申请列表 -->
    <div v-else class="applications-list">
      <div 
        v-for="app in applications" 
        :key="app.application_id"
        class="application-card"
        :class="getStatusClass(app.status)"
        @click="viewDetail(app.application_id)"
      >
        <div class="card-header">
          <div class="app-info">
            <h3 class="app-reason">{{ app.reason || '无理由' }}</h3>
            <span class="app-status" :class="getStatusColor(app.status)">
              {{ getStatusText(app.status) }}
            </span>
          </div>
          <span class="app-time">{{ formatTime(app.apply_time) }}</span>
        </div>

        <div class="card-content">
          <div class="app-details">
            <div class="detail-item">
              <span class="detail-label">乘车人数</span>
              <span class="detail-value">{{ app.people_count || 0 }}人</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">车型</span>
              <span class="detail-value">{{ getVehicleTypeText(app.vehicle_type) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">用车时间</span>
              <span class="detail-value">{{ formatDateTime(app.start_time) }}</span>
            </div>
            <div class="detail-item" v-if="app.destination">
              <span class="detail-label">目的地</span>
              <span class="detail-value">{{ app.destination || '无目的地' }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="card-actions">
            <button 
              v-if="app.status === 'pending'"
              class="action-btn cancel"
              @click.stop="cancelApplication(app)"
            >
              取消申请
            </button>
            <button 
              v-if="app.status === 'cancelled'"
              class="action-btn reapply"
              @click.stop="reapplyApplication(app)"
            >
              重新申请
            </button>
            <button class="action-btn detail" @click.stop="viewDetail(app.application_id)">
              查看详情
            </button>
          </div>
        </div>

        <!-- 审批信息 -->
        <div v-if="app.status === 'rejected' && app.reject_reason" class="reject-info">
          <span class="reject-label">拒绝原因：</span>
          <span class="reject-reason">{{ app.reject_reason }}</span>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMore" class="load-more-btn">
        加载更多
      </button>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-actions">
      <button @click="goToApply" class="new-apply-btn">
        <span class="plus-icon">+</span>
        <span>新的申请</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Applications',

  data() {
    return {
      applications: [],
      loading: false,

      activeTab: 'all',
      tabs: [
        { value: 'all', label: '全部', count: 0 },
        { value: 'pending', label: '待审批', count: 0 },
        { value: 'approved', label: '已批准', count: 0 },
        { value: 'rejected', label: '已拒绝', count: 0 },
        { value: 'confirmed', label: '已接单', count: 0 },
        { value: 'assigned', label: '已派车', count: 0 },
        { value: 'in_progress', label: '进行中', count: 0 },
        { value: 'completed', label: '已完成', count: 0 },
        { value: 'cancelled', label: '已取消', count: 0 }
      ],

      filters: {
        timeRange: 'all',
        vehicleType: 'all',
        customStartDate: null,
        customEndDate: null,
      },

      showFilter: false,

      currentPage: 1,
      pageSize: 10,
      hasMore: true
    };
  },

  watch: {
    activeTab() {
      console.log('Tab changed:', this.activeTab); // 调试输出
      this.currentPage = 1;
      this.loadApplications();
    },
    filters: {
      deep: true,
      handler() {
        console.log('Filters changed:', this.filters); // 调试输出
        this.currentPage = 1;
        this.loadApplications();
      }
    }
  },

  mounted() {
    console.log('Mounted - Initial load');
    this.loadApplications();
  },

  methods: {
    async loadApplications() {
      if (this.currentPage === 1) {
        this.hasMore = true;
        this.applications = [];
      }

      this.loading = true;
      console.log('Loading applications...'); // 调试输出

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('未登录');

        const params = new URLSearchParams();

        // 传递状态筛选
        if (this.activeTab !== 'all') {
          console.log('Adding status filter:', this.activeTab); // 调试输出
          params.append('status', this.activeTab);
        }

        // 传递时间筛选条件
        if (this.filters.timeRange !== 'all') {
          const timeRange = this.getTimeRange(this.filters.timeRange);
          if (timeRange.startDate && timeRange.endDate) {
            console.log('Adding time range filter:', timeRange); // 调试输出
            params.append('startDate', timeRange.startDate);
            params.append('endDate', timeRange.endDate);
          }
        }

        // 传递车型筛选条件
        if (this.filters.vehicleType !== 'all') {
          console.log('Adding vehicle type filter:', this.filters.vehicleType); // 调试输出
          params.append('vehicleType', this.filters.vehicleType);
        }

        params.append('page', this.currentPage);
        params.append('limit', this.pageSize);

        console.log('Requesting API with params:', params.toString()); // 调试输出

        const res = await fetch(
          `http://localhost:3000/api/applications/my?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const result = await res.json();
        console.log('API response:', result); // 调试输出

        if (!result.success) throw new Error(result.message);

        this.tabs.forEach(tab => {
          if (tab.value === 'all') {
            tab.count = result.stats.total;
          } else {
            tab.count = result.stats[tab.value] || 0;
          }
        });

        const list = result.data || [];
        this.applications = this.currentPage === 1 ? list : [...this.applications, ...list];

        if (list.length < this.pageSize) {
          this.hasMore = false;
        }
      } catch (err) {
        console.error('Error loading applications:', err); // 错误输出
        this.applications = [];
      } finally {
        this.loading = false;
        console.log('Loading complete'); // 调试输出
      }
    },

    loadMore() {
      console.log('Loading more applications...');
      this.currentPage++;
      this.loadApplications();
    },

    refreshData() {
      console.log('Refreshing data...');
      this.currentPage = 1;
      this.loadApplications();
    },

    changeTab(tab) {
      console.log('Tab changed to:', tab);
      this.activeTab = tab;
    },

    applyFilters() {
      console.log('Applying filters:', this.filters); // 调试输出
      this.currentPage = 1;

      // 如果是自定义时间筛选
      if (this.filters.timeRange === 'custom') {
        const startDate = this.filters.customStartDate ? new Date(this.filters.customStartDate).toISOString() : null;
        const endDate = this.filters.customEndDate ? new Date(this.filters.customEndDate).toISOString() : null;

        // 如果有有效的开始和结束日期，将其加入到请求中
        if (startDate && endDate) {
          this.filters.startDate = startDate;
          this.filters.endDate = endDate;
        }
      }

      // 重新加载数据
      this.loadApplications();
      this.showFilter = false;
    },

    resetFilters() {
      console.log('Resetting filters...');
      this.filters = { timeRange: 'all', vehicleType: 'all', customStartDate: null, customEndDate: null };
      this.showFilter = false;
      this.loadApplications();
    },

    // 转换时间为本地时区
getTimeRange(timeRange) {
  const today = new Date();
  let startDate = null;
  let endDate = null;

  switch (timeRange) {
    case 'today':
      // 获取今天的开始时间和结束时间（本地时区）
      startDate = new Date(today.setHours(0, 0, 0, 0));  // 今天00:00:00
      endDate = new Date(today.setHours(23, 59, 59, 999)); // 今天23:59:59
      break;
    case 'week':
      const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));  // 获取当前周的第一天
      startDate = new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
      endDate = new Date(firstDayOfWeek.setDate(firstDayOfWeek.getDate() + 6));  // 获取当前周的最后一天
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);  // 获取本月第一天
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // 获取本月最后一天
      break;
    default:
      startDate = null;
      endDate = null;
      break;
  }

  return {
    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endDate.toISOString() : null,
  };
}
,

    viewDetail(id) {
      console.log('Viewing details for application ID:', id);
      this.$router.push(`/application/${id}`);
    },

    goToApply() {
      console.log('Navigating to apply page');
      this.$router.push('/apply');
    },

    goBack() {
      console.log('Going back to previous page');
      this.$router.back();
    },

    getStatusText(status) {
      const map = {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        assigned: '已派车',
        confirmed: '已接单',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return map[status] || status;
    },

    getStatusClass(status) {
      return `status-${status}`;
    },

    getStatusColor(status) {
      return `status-${status}`;
    },

    formatTime(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('zh-CN');
    },

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${m}月${day}日 ${h}:${min}`;
    },

    getVehicleTypeText(type) {
      const map = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return map[type] || type;
    }
  }
};
</script>


<style scoped>
/* 基础变量 */
.applications-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 24px;
  padding-bottom: 130px; /* 增加底部间距 */
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 头部样式 */
.header {
  background-color: #1890ff;
  border-radius: 20px;
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 30px rgba(24, 144, 255, 0.2);
  color: white;
  position: relative;
  overflow: hidden;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-btn {
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
}

.back-btn:active {
  transform: translateY(0);
}

/* 状态筛选区域 */
.status-filter {
  background-color: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  border-top: 4px solid #1890ff;
}

.filter-tabs {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 20px;
}

.filter-tab {
  padding: 10px 20px;
  border: 2px solid #f0f0f0;
  background-color: white;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.filter-tab:hover {
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-2px);
}

.filter-tab.active {
  background-color: #1890ff;
  border-color: transparent;
  color: white;
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
  transform: translateY(-2px);
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.filter-actions {
  display: flex;
  gap: 12px;
}
.apply-filter, .reset-filter {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.apply-filter {
  background-color: #1890ff; /* 应用筛选按钮的背景色 */
  color: white;
  border: 2px solid #1890ff;
}

.apply-filter:hover {
  background-color: #40a9ff; /* 鼠标悬浮时背景颜色 */
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.apply-filter:active {
  background-color: #096dd9; /* 点击时的背景颜色 */
  transform: translateY(2px);
  box-shadow: none;
}

.reset-filter {
  background-color: #f0f0f0; /* 重置按钮的背景色 */
  color: #333;
  border: 2px solid #ddd;
}

.reset-filter:hover {
  background-color: #e6e6e6; /* 鼠标悬浮时背景颜色 */
  transform: translateY(-2px);
}

.reset-filter:active {
  background-color: #d9d9d9; /* 点击时的背景颜色 */
  transform: translateY(0);
  box-shadow: none;
}

/* 按钮内的图标和文字 */
.filter-actions .filter-icon,
.filter-actions .refresh-icon {
  font-size: 12px;
}
.filter-btn, .refresh-btn {
  padding: 10px 20px;
  border: 2px solid #f0f0f0;
  background-color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.filter-btn:hover, .refresh-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-2px);
}

.filter-btn:active, .refresh-btn:active {
  transform: translateY(0);
}

.filter-icon, .refresh-icon {
  font-size: 12px;
}

/* 筛选面板 */
.filter-panel {
  background-color: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-out;
  border: 2px solid #f0f0f0;
}

@keyframes slideDown {
  from { 
    opacity: 0; 
    transform: translateY(-20px); 
    max-height: 0;
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
    max-height: 300px;
  }
}

.filter-group {
  margin-bottom: 24px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.filter-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  background-color: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.filter-select:hover {
  border-color: #1890ff;
}

.filter-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 300px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(24, 144, 255, 0.1);
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 24px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: white;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 2px dashed #f0f0f0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.empty-state p {
  font-size: 15px;
  color: #666;
  margin: 0 0 32px 0;
  line-height: 1.6;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.apply-btn {
  padding: 14px 36px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.apply-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.apply-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(24, 144, 255, 0.4);
  background-color: #40a9ff;
}

.apply-btn:hover::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}

/* 申请列表 */
.applications-list {
  display: grid;
  gap: 20px;
}

.application-card {
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.645, 0.045, 0.355, 1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 2px solid transparent;
}

.application-card:hover {
  transform: translateY(-5px);
  border-color: #1890ff;
  box-shadow: 0 12px 32px rgba(24, 144, 255, 0.15);
}

.application-card:active {
  transform: translateY(-2px);
}

/* 状态边框 */
.application-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  border-radius: 20px 0 0 20px;
}

.status-pending::before { background-color: #faad14; }
.status-approved::before { background-color: #52c41a; }
.status-rejected::before { background-color: #ff4d4f; }
.status-assigned::before { background-color: #1890ff; }
.status-confirmed::before { background-color: #13c2c2; }
.status-in_progress::before { background-color: #722ed1; }
.status-completed::before { background-color: #eb2f96; }
.status-cancelled::before { background-color: #8c8c8c; }

.card-header {
  padding: 24px 24px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.app-info {
  flex: 1;
  min-width: 0;
}

.app-reason {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.app-status {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.status-pending .app-status { 
  background-color: #fff7e6;
  color: #fa8c16;
  border: 2px solid #ffd591;
}

.status-approved .app-status { 
  background-color: #f6ffed;
  color: #52c41a;
  border: 2px solid #b7eb8f;
}

.status-rejected .app-status { 
  background-color: #fff2f0;
  color: #ff4d4f;
  border: 2px solid #ffa39e;
}

.status-assigned .app-status { 
  background-color: #e6f7ff;
  color: #1890ff;
  border: 2px solid #91d5ff;
}

.status-confirmed .app-status { 
  background-color: #e6fffb;
  color: #13c2c2;
  border: 2px solid #87e8de;
}

.status-in_progress .app-status { 
  background-color: #f9f0ff;
  color: #722ed1;
  border: 2px solid #d3adf7;
}

.status-completed .app-status { 
  background-color: #fff0f6;
  color: #eb2f96;
  border: 2px solid #ffadd2;
}

.status-cancelled .app-status { 
  background-color: #fafafa;
  color: #8c8c8c;
  border: 2px solid #d9d9d9;
}

.app-time {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 6px 12px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  font-weight: 500;
}

.card-content {
  padding: 0 24px 24px;
}

.app-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f0f0f0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-label::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #1890ff;
  border-radius: 50%;
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 24px;
  border: 2px solid #f0f0f0;
  background-color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(0, 0, 0, 0.1);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.action-btn:active::before {
  animation: ripple 0.6s ease-out;
}

.action-btn.cancel {
  color: #ff4d4f;
  border-color: #ffccc7;
  background-color: #fff2f0;
}

.action-btn.cancel:hover {
  background-color: #ffccc7;
  border-color: #ff4d4f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
}

.action-btn.reapply {
  color: #1890ff;
  border-color: #d6e4ff;
  background-color: #f0f5ff;
}

.action-btn.reapply:hover {
  background-color: #d6e4ff;
  border-color: #1890ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.action-btn.detail {
  color: #666;
  border-color: #f0f0f0;
  background-color: #fafafa;
}

.action-btn.detail:hover {
  background-color: #f0f0f0;
  color: #333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 拒绝信息 */
.reject-info {
  padding: 20px 24px;
  background-color: #fff2f0;
  border-top: 2px solid #ffa39e;
  font-size: 14px;
  line-height: 1.6;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border-radius: 0 0 20px 20px;
}

.reject-label {
  color: #ff4d4f;
  font-weight: 700;
  flex-shrink: 0;
  padding: 4px 12px;
  background-color: white;
  border-radius: 12px;
  border: 2px solid #ffa39e;
}

.reject-reason {
  color: #333;
  flex: 1;
  font-weight: 500;
}

/* 加载更多 */
.load-more {
  padding: 40px 20px;
  text-align: center;
}

.load-more-btn {
  padding: 14px 40px;
  border: 2px solid #f0f0f0;
  background-color: white;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.load-more-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(24, 144, 255, 0.2);
  background-color: #f0f5ff;
}

.load-more-btn:active {
  transform: translateY(-1px);
}

/* 底部操作 */
.bottom-actions {
  position: fixed;  /* 固定在页面底部 */
  left: 0;
  right: 0;
  bottom: 0;        /* 直接位于页面底部 */
  background: linear-gradient(transparent, rgba(245, 247, 250, 0.9) 20%);
  padding: 24px 24px 40px;
  display: flex;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.new-apply-btn {
  padding: 18px 48px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(24, 144, 255, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 16px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.new-apply-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.new-apply-btn:hover {
  background-color: #40a9ff;
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(24, 144, 255, 0.4);
}

.new-apply-btn:hover::before {
  width: 300px;
  height: 300px;
}

.new-apply-btn:active {
  transform: translateY(-2px) scale(1.02);
}

.plus-icon {
  font-size: 24px;
  font-weight: bold;
  transition: transform 0.3s;
}

.new-apply-btn:hover .plus-icon {
  transform: rotate(90deg);
}

</style>
