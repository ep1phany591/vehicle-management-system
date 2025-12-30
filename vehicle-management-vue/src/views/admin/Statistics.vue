<template>
  <div class="statistics-page">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <img :src="user.avatar" alt="头像" class="avatar">
        <div class="user-details">
          <h3>{{ user.real_name }}</h3>
          <p>数据统计</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToDashboard" class="home-btn">工作台</button>
        <button @click="goToHome" class="home-btn">首页</button>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <!-- 时间筛选 -->
    <div class="filter-section">
      <div class="filter-card">
        <h3>统计周期</h3>
        <div class="filter-options">
          <button 
            v-for="period in timePeriods" 
            :key="period.value"
            class="period-btn"
            :class="{ active: selectedPeriod === period.value }"
            @click="changePeriod(period.value)"
          >
            {{ period.label }}
          </button>
        </div>
        <div class="date-range">
          <div class="date-input">
            <label>开始日期：</label>
            <input type="date" v-model="startDate">
          </div>
          <div class="date-input">
            <label>结束日期：</label>
            <input type="date" v-model="endDate">
          </div>
          <button @click="applyDateRange" class="apply-btn">应用</button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-overview">
      <h3>统计概览</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ overview.totalApplications }}</div>
            <div class="stat-label">总申请数</div>
            <div class="stat-change" :class="getChangeClass(overview.applicationGrowth)">
              {{ overview.applicationGrowth >= 0 ? '+' : '' }}{{ overview.applicationGrowth }}%
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon approved">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ overview.approvedCount }}</div>
            <div class="stat-label">批准数量</div>
            <div class="stat-change" :class="getChangeClass(overview.approvalRate)">
              批准率 {{ overview.approvalRate }}%
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon vehicle">🚗</div>
          <div class="stat-content">
            <div class="stat-value">{{ overview.vehicleUtilization }}%</div>
            <div class="stat-label">车辆使用率</div>
            <div class="stat-change" :class="getChangeClass(overview.utilizationChange)">
              {{ overview.utilizationChange >= 0 ? '+' : '' }}{{ overview.utilizationChange }}%
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon cost">💰</div>
          <div class="stat-content">
            <div class="stat-value">¥{{ formatNumber(overview.totalCost) }}</div>
            <div class="stat-label">总费用</div>
            <div class="stat-change" :class="getChangeClass(overview.costChange)">
              {{ overview.costChange >= 0 ? '+' : '' }}{{ overview.costChange }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 部门申请统计 -->
    <div class="department-stats">
      <div class="section-header">
        <h3>各部门用车情况</h3>
        <button @click="exportToExcel" class="export-btn">
          <span>📊</span>
          <span>导出Excel</span>
        </button>
      </div>
      <div class="chart-container">
        <div class="chart-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">📈</div>
            <p>申请数量统计图表</p>
          </div>
        </div>
      </div>
      <div class="department-list">
        <div 
          v-for="dept in departmentStats" 
          :key="dept.department"
          class="department-item"
        >
          <div class="dept-info">
            <span class="dept-name">{{ dept.department || '未指定部门' }}</span>
            <span class="dept-count">{{ dept.count }} 次</span>
          </div>
          <div class="dept-bar">
            <div 
              class="bar-fill" 
              :style="{ width: `${(dept.count / maxDeptCount) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 车辆使用统计 -->
    <div class="vehicle-stats">
      <div class="section-header">
        <h3>车辆使用排行</h3>
      </div>
      <div class="vehicle-grid">
        <div 
          v-for="vehicle in vehicleStats" 
          :key="vehicle.vehicle_id"
          class="vehicle-card"
        >
          <div class="vehicle-header">
            <div class="vehicle-plate">{{ vehicle.license_plate }}</div>
            <div class="vehicle-type">{{ getVehicleTypeText(vehicle.vehicle_type) }}</div>
          </div>
          <div class="vehicle-metrics">
            <div class="metric">
              <span class="metric-label">出车次数</span>
              <span class="metric-value">{{ vehicle.trips }} 次</span>
            </div>
            <div class="metric">
              <span class="metric-label">总里程</span>
              <span class="metric-value">{{ vehicle.mileage }} km</span>
            </div>
            <div class="metric">
              <span class="metric-label">使用率</span>
              <span class="metric-value">{{ vehicle.utilization }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间趋势图 -->
    <div class="trend-chart">
      <div class="section-header">
        <h3>申请趋势</h3>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot pending"></span>
            <span>待审批</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot approved"></span>
            <span>已批准</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot completed"></span>
            <span>已完成</span>
          </div>
        </div>
      </div>
      <div class="chart-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">📊</div>
          <p>时间趋势图表</p>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table">
      <div class="section-header">
        <h3>详细数据</h3>
        <div class="table-actions">
          <button @click="refreshData" class="refresh-btn">刷新</button>
          <button @click="exportAllData" class="export-btn">导出全部</button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>申请数量</th>
              <th>批准数量</th>
              <th>拒绝数量</th>
              <th>完成数量</th>
              <th>总里程(km)</th>
              <th>总费用(元)</th>
              <th>车辆使用率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in dailyStats" :key="day.date">
              <td>{{ day.date }}</td>
              <td>{{ day.total }}</td>
              <td>{{ day.approved }}</td>
              <td>{{ day.rejected }}</td>
              <td>{{ day.completed }}</td>
              <td>{{ day.mileage }}</td>
              <td>{{ day.cost }}</td>
              <td>
                <div class="utilization-bar">
                  <div 
                    class="utilization-fill" 
                    :style="{ width: `${day.utilization}%` }"
                  ></div>
                  <span class="utilization-text">{{ day.utilization }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminStatistics',
  data() {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    return {
      user: {},
      selectedPeriod: 'month',
      startDate: oneMonthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      loading: false,
      
      timePeriods: [
        { value: 'week', label: '本周' },
        { value: 'month', label: '本月' },
        { value: 'quarter', label: '本季度' },
        { value: 'year', label: '本年' },
        { value: 'custom', label: '自定义' }
      ],
      
      // 统计数据
      overview: {
        totalApplications: 0,
        approvedCount: 0,
        vehicleUtilization: 0,
        totalCost: 0,
        applicationGrowth: 0,
        approvalRate: 0,
        utilizationChange: 0,
        costChange: 0
      },
      
      departmentStats: [],
      vehicleStats: [],
      dailyStats: [],
      
      // 模拟数据
      mockDepartments: [
        { department: '销售部', count: 45 },
        { department: '市场部', count: 38 },
        { department: '技术部', count: 32 },
        { department: '行政部', count: 28 },
        { department: '财务部', count: 25 },
        { department: '人事部', count: 18 },
        { department: '采购部', count: 15 }
      ],
      
      mockVehicles: [
        { vehicle_id: 1, license_plate: '京A88888', vehicle_type: 'small', trips: 28, mileage: 1560, utilization: 85 },
        { vehicle_id: 2, license_plate: '京A66666', vehicle_type: 'small', trips: 25, mileage: 1420, utilization: 78 },
        { vehicle_id: 3, license_plate: '京A77777', vehicle_type: 'business', trips: 20, mileage: 1850, utilization: 92 },
        { vehicle_id: 4, license_plate: '京A99999', vehicle_type: 'coach', trips: 15, mileage: 2150, utilization: 65 }
      ],
      
      mockDailyStats: [
        { date: '2024-01-01', total: 8, approved: 6, rejected: 1, completed: 5, mileage: 450, cost: 2250, utilization: 72 },
        { date: '2024-01-02', total: 12, approved: 10, rejected: 1, completed: 8, mileage: 620, cost: 3100, utilization: 85 },
        { date: '2024-01-03', total: 10, approved: 9, rejected: 0, completed: 7, mileage: 580, cost: 2900, utilization: 78 },
        { date: '2024-01-04', total: 9, approved: 8, rejected: 0, completed: 6, mileage: 520, cost: 2600, utilization: 69 },
        { date: '2024-01-05', total: 15, approved: 13, rejected: 1, completed: 10, mileage: 780, cost: 3900, utilization: 91 }
      ]
    };
  },
  computed: {
    maxDeptCount() {
      return Math.max(...this.departmentStats.map(dept => dept.count));
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadStatistics();
  },
  methods: {
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    async loadStatistics() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        
        // 获取统计数据
        const response = await fetch('http://localhost:3000/api/admin/statistics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.updateStatistics(result.data);
          }
        } else {
          // 使用模拟数据
          this.loadMockStatistics();
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
        this.loadMockStatistics();
      } finally {
        this.loading = false;
      }
    },
    
    updateStatistics(data) {
      // 这里根据实际返回的数据结构更新
      this.overview = data.overview || this.overview;
      this.departmentStats = data.departmentStats || [];
      this.vehicleStats = data.vehicleStats || [];
      this.dailyStats = data.dailyStats || [];
    },
    
    loadMockStatistics() {
      // 模拟数据
      this.overview = {
        totalApplications: 156,
        approvedCount: 138,
        vehicleUtilization: 78,
        totalCost: 28500,
        applicationGrowth: 12,
        approvalRate: 89,
        utilizationChange: 5,
        costChange: -2
      };
      
      this.departmentStats = this.mockDepartments;
      this.vehicleStats = this.mockVehicles;
      this.dailyStats = this.mockDailyStats;
    },
    
    changePeriod(period) {
      this.selectedPeriod = period;
      
      const today = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(today.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'custom':
          return; // 自定义不修改日期
      }
      
      this.startDate = startDate.toISOString().split('T')[0];
      this.endDate = today.toISOString().split('T')[0];
      
      // 重新加载数据
      this.loadStatistics();
    },
    
    applyDateRange() {
      this.selectedPeriod = 'custom';
      this.loadStatistics();
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return typeMap[type] || type;
    },
    
    getChangeClass(value) {
      return value >= 0 ? 'positive' : 'negative';
    },
    
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    exportToExcel() {
      // 这里可以实现导出功能
      alert('导出功能开发中...');
    },
    
    exportAllData() {
      // 导出所有数据
      alert('导出所有数据功能开发中...');
    },
    
    refreshData() {
      this.loadStatistics();
    },
    
    goToDashboard() {
      this.$router.push('/admin');
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
.statistics-page {
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

/* 时间筛选 */
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
  background: linear-gradient(90deg, #1890ff, #722ed1);
}

.filter-card h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.filter-options {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.period-btn {
  padding: 12px 24px;
  border: 2px solid #e8e8e8;
  background: #f8f9fa;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.period-btn:hover {
  transform: translateY(-2px);
  border-color: #1890ff;
  background: #e6f7ff;
  color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
}

.period-btn.active {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.date-range {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.date-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.date-input label {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.date-input input {
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  background: #f8f9fa;
  color: #333;
  transition: all 0.3s ease;
}

.date-input input:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.apply-btn {
  padding: 14px 28px;
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
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
}

/* 统计概览 */
.stats-overview {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.stats-overview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #52c41a, #1890ff);
}

.stats-overview h3 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 32px;
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-icon.total { 
  background: linear-gradient(135deg, #e6f7ff, #ffffff); 
  color: #1890ff; 
}

.stat-icon.approved { 
  background: linear-gradient(135deg, #f6ffed, #ffffff); 
  color: #52c41a; 
}

.stat-icon.vehicle { 
  background: linear-gradient(135deg, #f9f0ff, #ffffff); 
  color: #722ed1; 
}

.stat-icon.cost { 
  background: linear-gradient(135deg, #fff0f6, #ffffff); 
  color: #eb2f96; 
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.stat-change {
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 12px;
  display: inline-block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-change.positive {
  background: linear-gradient(135deg, #f6ffed, #ffffff);
  color: #52c41a;
  border: 1px solid #d9f7be;
}

.stat-change.negative {
  background: linear-gradient(135deg, #fff2f0, #ffffff);
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

/* 部门统计 */
.department-stats,
.vehicle-stats,
.trend-chart,
.data-table {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.department-stats::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #722ed1, #eb2f96);
}

.vehicle-stats::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #fa8c16, #ffc53d);
}

.trend-chart::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #13c2c2, #1890ff);
}

.data-table::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #52c41a, #1890ff);
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

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(82, 196, 26, 0.3);
}

.chart-container {
  margin-bottom: 24px;
}

.chart-placeholder {
  height: 240px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #d9d9d9;
  position: relative;
  overflow: hidden;
}

.placeholder-content {
  text-align: center;
  z-index: 1;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.placeholder-content p {
  color: #999;
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.department-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.department-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.department-item:hover {
  transform: translateX(5px);
  border-color: #1890ff;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
}

.dept-info {
  display: flex;
  justify-content: space-between;
  min-width: 240px;
  align-items: center;
}

.dept-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.dept-count {
  color: #1890ff;
  font-weight: 700;
  font-size: 18px;
  background: #e6f7ff;
  padding: 6px 14px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.dept-bar {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #722ed1);
  border-radius: 12px;
  transition: width 1s ease;
  position: relative;
}

.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    transparent 50%, 
    rgba(255, 255, 255, 0.3) 50%, 
    rgba(255, 255, 255, 0.3) 100%);
  background-size: 20px 24px;
  animation: progress-stripe 1s linear infinite;
}

@keyframes progress-stripe {
  0% { background-position: 0 0; }
  100% { background-position: 20px 0; }
}

/* 车辆统计 */
.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
}

.vehicle-card {
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border-left: 6px solid #1890ff;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.vehicle-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-left-color: #722ed1;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.vehicle-plate {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.vehicle-type {
  padding: 8px 16px;
  background: linear-gradient(135deg, #e6f7ff, #ffffff);
  color: #1890ff;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #bae7ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.vehicle-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
}

.metric:hover {
  transform: translateY(-3px);
  border-color: #1890ff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.metric-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.metric-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

/* 趋势图 */
.chart-legend {
  display: flex;
  gap: 25px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 20px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.legend-item:hover {
  border-color: #1890ff;
  background: white;
  transform: translateY(-2px);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.legend-dot.pending { background: #fa8c16; }
.legend-dot.approved { background: #52c41a; }
.legend-dot.completed { background: #1890ff; }

/* 数据表格 */
.table-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn,
.export-btn {
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

.refresh-btn {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #333;
  border: 2px solid #e8e8e8;
}

.refresh-btn:hover {
  background: #e9ecef;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-2px);
}

.export-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

.table-container {
  overflow-x: auto;
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 800px;
}

thead {
  background: linear-gradient(135deg, #f8f9fa, #e6f7ff);
}

th {
  padding: 20px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
  white-space: nowrap;
  font-size: 14px;
  position: relative;
}

th:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  height: 50%;
  width: 1px;
  background: #e8e8e8;
}

td {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
  font-size: 14px;
  color: #333;
}

tbody tr {
  transition: all 0.3s ease;
}

tbody tr:hover {
  background: linear-gradient(135deg, #f8f9fa, #f6ffed);
  transform: translateX(5px);
}

tbody tr:last-child td {
  border-bottom: none;
}

.utilization-bar {
  position: relative;
  height: 30px;
  background: #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
}

.utilization-fill {
  height: 100%;
  background: linear-gradient(90deg, #52c41a, #1890ff);
  border-radius: 15px;
  transition: width 0.8s ease;
}

.utilization-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .vehicle-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .statistics-page {
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
    flex-wrap: wrap;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-input {
    min-width: auto;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .chart-legend {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  
  .vehicle-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dept-info {
    min-width: auto;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .dept-count {
    align-self: flex-start;
  }
  
  .table-actions {
    flex-direction: column;
  }
  
  .refresh-btn,
  .export-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .vehicle-metrics {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .metric {
    padding: 16px;
  }
  
  table {
    font-size: 12px;
    min-width: 600px;
  }
  
  th, td {
    padding: 12px 8px;
  }
  
  .dept-bar {
    height: 20px;
  }
}
</style>