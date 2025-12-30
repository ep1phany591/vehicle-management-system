<template>
  <div class="leader-statistics">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <img :src="user.avatar" alt="头像" class="avatar">
        <div class="user-details">
          <h3>{{ user.real_name }}</h3>
          <p>领导统计</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToDashboard" class="home-btn">工作台</button>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <!-- 时间筛选 -->
    <div class="filter-section">
      <h3>统计周期</h3>
      <div class="filter-tabs">
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
    </div>

    <!-- 部门用车统计 -->
    <div class="department-stats">
      <div class="section-header">
        <h3>各部门用车情况</h3>
        <button @click="exportToExcel" class="export-btn">导出Excel</button>
      </div>
      
      <div class="stats-table">
        <table>
          <thead>
            <tr>
              <th>部门</th>
              <th>申请次数</th>
              <th>批准次数</th>
              <th>拒绝次数</th>
              <th>完成次数</th>
              <th>用车率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dept in departmentStats" :key="dept.department">
              <td>{{ dept.department || '其他' }}</td>
              <td>{{ dept.totalCount }}</td>
              <td>{{ dept.approvedCount }}</td>
              <td>{{ dept.rejectedCount }}</td>
              <td>{{ dept.completedCount }}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${dept.utilizationRate}%` }"></div>
                  <span class="progress-text">{{ dept.utilizationRate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 车辆使用排行 -->
    <div class="vehicle-ranking">
      <div class="section-header">
        <h3>车辆使用排行</h3>
      </div>
      
      <div class="ranking-list">
        <div 
          v-for="(vehicle, index) in vehicleRanking" 
          :key="vehicle.vehicle_id"
          class="ranking-item"
        >
          <div class="rank-number">{{ index + 1 }}</div>
          <div class="vehicle-info">
            <div class="vehicle-plate">{{ vehicle.license_plate }}</div>
            <div class="vehicle-details">
              <span class="detail">{{ getVehicleTypeText(vehicle.vehicle_type) }}</span>
              <span class="detail">司机: {{ vehicle.driver_name || '未分配' }}</span>
            </div>
          </div>
          <div class="vehicle-stats">
            <div class="stat">
              <span class="stat-label">出车次数</span>
              <span class="stat-value">{{ vehicle.trips }}次</span>
            </div>
            <div class="stat">
              <span class="stat-label">使用率</span>
              <span class="stat-value">{{ vehicle.utilization }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用车趋势 -->
    <div class="trend-chart">
      <div class="section-header">
        <h3>用车趋势分析</h3>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot application"></span>
            <span>申请数量</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot approval"></span>
            <span>批准数量</span>
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <!-- 这里可以添加图表组件，如ECharts -->
        <div class="chart-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">📈</div>
            <p>用车趋势图表</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 费用统计 -->
    <div class="cost-stats">
      <div class="section-header">
        <h3>费用统计</h3>
        <span class="total-cost">总费用: ¥{{ formatNumber(totalCost) }}</span>
      </div>
      
      <div class="cost-breakdown">
        <div class="cost-item">
          <div class="cost-label">燃油费用</div>
          <div class="cost-amount">¥{{ formatNumber(fuelCost) }}</div>
          <div class="cost-percentage">{{ Math.round((fuelCost / totalCost) * 100) || 0 }}%</div>
        </div>
        <div class="cost-item">
          <div class="cost-label">维护费用</div>
          <div class="cost-amount">¥{{ formatNumber(maintenanceCost) }}</div>
          <div class="cost-percentage">{{ Math.round((maintenanceCost / totalCost) * 100) || 0 }}%</div>
        </div>
        <div class="cost-item">
          <div class="cost-label">其他费用</div>
          <div class="cost-amount">¥{{ formatNumber(otherCost) }}</div>
          <div class="cost-percentage">{{ Math.round((otherCost / totalCost) * 100) || 0 }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LeaderStatistics',
  data() {
    return {
      user: {},
      selectedPeriod: 'month',
      loading: false,
      
      timePeriods: [
        { value: 'week', label: '本周' },
        { value: 'month', label: '本月' },
        { value: 'quarter', label: '本季度' },
        { value: 'year', label: '本年' }
      ],
      
      departmentStats: [
        { department: '销售部', totalCount: 45, approvedCount: 40, rejectedCount: 5, completedCount: 38, utilizationRate: 84 },
        { department: '市场部', totalCount: 38, approvedCount: 35, rejectedCount: 3, completedCount: 32, utilizationRate: 91 },
        { department: '技术部', totalCount: 32, approvedCount: 30, rejectedCount: 2, completedCount: 28, utilizationRate: 88 },
        { department: '行政部', totalCount: 28, approvedCount: 25, rejectedCount: 3, completedCount: 22, utilizationRate: 79 },
        { department: '财务部', totalCount: 25, approvedCount: 23, rejectedCount: 2, completedCount: 21, utilizationRate: 84 }
      ],
      
      vehicleRanking: [
        { vehicle_id: 1, license_plate: '京A88888', vehicle_type: 'small', driver_name: '王师傅', trips: 28, utilization: 85 },
        { vehicle_id: 2, license_plate: '京A66666', vehicle_type: 'small', driver_name: '李师傅', trips: 25, utilization: 78 },
        { vehicle_id: 3, license_plate: '京A77777', vehicle_type: 'business', driver_name: '张师傅', trips: 20, utilization: 92 },
        { vehicle_id: 4, license_plate: '京A99999', vehicle_type: 'coach', driver_name: '赵师傅', trips: 15, utilization: 65 }
      ],
      
      totalCost: 28500,
      fuelCost: 15600,
      maintenanceCost: 8500,
      otherCost: 4400
    };
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
        
        // 调用后端API获取统计信息
        const response = await fetch(`http://localhost:3000/api/admin/statistics?period=${this.selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 更新统计数据
            // 根据实际API响应更新数据
          }
        }
      } catch (error) {
        console.error('加载统计信息失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    changePeriod(period) {
      this.selectedPeriod = period;
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
    
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    exportToExcel() {
      // 实现导出功能
      alert('导出功能开发中...');
    },
    
    goToDashboard() {
      this.$router.push('/leader');
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
  padding: 20px;
  animation: fadeIn 0.5s ease;
}

/* 头部样式 - 与前面统一 */
.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, #096dd9 100%);
  border-radius: var(--card-radius);
  padding: 15px 25px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--card-shadow);
  position: sticky;
  top: 20px;
  z-index: 100;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  object-fit: cover;
}

.user-details h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-details p {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.home-btn, .logout-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.home-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.logout-btn {
  background: rgba(255, 71, 87, 0.2);
  color: white;
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.home-btn:hover, .logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 筛选部分优化 */
.filter-section {
  background: var(--card-bg);
  border-radius: var(--card-radius);
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: var(--card-shadow);
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
  background: linear-gradient(90deg, var(--primary-color), #722ed1);
}

.filter-card h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.filter-options {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.period-btn {
  padding: 10px 20px;
  border: 2px solid #e8e8e8;
  background: #f8f9fa;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.period-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: #e6f7ff;
  transform: translateY(-2px);
}

.period-btn.active {
  background: linear-gradient(135deg, var(--primary-color), #40a9ff);
  color: white;
  border-color: var(--primary-color);
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
  font-weight: 500;
}

.date-input input {
  padding: 12px 15px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.date-input input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.apply-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary-color), #40a9ff);
  color: white;
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

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
}

/* 统计概览优化 */
.stats-overview {
  background: var(--card-bg);
  border-radius: var(--card-radius);
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: var(--card-shadow);
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
  background: linear-gradient(90deg, var(--success-color), var(--info-color));
}

.stats-overview h3 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary-color);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-icon.total { background: linear-gradient(135deg, #e6f7ff, #ffffff); color: var(--primary-color); }
.stat-icon.approved { background: linear-gradient(135deg, #f6ffed, #ffffff); color: var(--success-color); }
.stat-icon.vehicle { background: linear-gradient(135deg, #f9f0ff, #ffffff); color: #722ed1; }
.stat-icon.cost { background: linear-gradient(135deg, #fff0f6, #ffffff); color: #eb2f96; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.2;
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
  padding: 4px 10px;
  border-radius: 12px;
  display: inline-block;
}

.stat-change.positive {
  background: linear-gradient(135deg, #f6ffed, #ffffff);
  color: var(--success-color);
  border: 1px solid #d9f7be;
}

.stat-change.negative {
  background: linear-gradient(135deg, #fff2f0, #ffffff);
  color: var(--error-color);
  border: 1px solid #ffccc7;
}

/* 部门统计优化 */
.department-stats, .vehicle-stats, .trend-chart, .data-table {
  background: var(--card-bg);
  border-radius: var(--card-radius);
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: var(--card-shadow);
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
  background: linear-gradient(90deg, #fa8c16, var(--warning-color));
}

.trend-chart::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--info-color), var(--primary-color));
}

.data-table::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--success-color), var(--primary-color));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--success-color), #73d13d);
  color: white;
  border: none;
  border-radius: 10px;
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
  margin-bottom: 25px;
}

.chart-placeholder {
  height: 220px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 12px;
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
  font-size: 56px;
  margin-bottom: 15px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
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
  gap: 18px;
}

.department-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.department-item:hover {
  transform: translateX(5px);
  border-color: var(--primary-color);
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
}

.dept-info {
  display: flex;
  justify-content: space-between;
  min-width: 220px;
  align-items: center;
}

.dept-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.dept-count {
  color: var(--primary-color);
  font-weight: 700;
  font-size: 16px;
  background: #e6f7ff;
  padding: 4px 12px;
  border-radius: 20px;
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
  background: linear-gradient(90deg, var(--primary-color), #722ed1);
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
    rgba(255, 255, 255, 0.4) 50%, 
    rgba(255, 255, 255, 0.4) 100%);
  background-size: 20px 24px;
  animation: progress-stripe 1s linear infinite;
}

@keyframes progress-stripe {
  0% { background-position: 0 0; }
  100% { background-position: 20px 0; }
}

/* 车辆统计优化 */
.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.vehicle-card {
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border-left: 6px solid var(--primary-color);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.vehicle-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-left-color: #722ed1;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.vehicle-plate {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.vehicle-type {
  padding: 6px 14px;
  background: linear-gradient(135deg, #e6f7ff, #ffffff);
  color: var(--primary-color);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #bae7ff;
}

.vehicle-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.metric {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
}

.metric:hover {
  transform: translateY(-3px);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.metric-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.metric-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

/* 趋势图优化 */
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
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 20px;
  border: 2px solid transparent;
}

.legend-item:hover {
  border-color: var(--primary-color);
  background: white;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.pending { background: var(--warning-color); }
.legend-dot.approved { background: var(--success-color); }
.legend-dot.completed { background: var(--primary-color); }

/* 数据表格优化 */
.table-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn:hover {
  background: #e9ecef;
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
  background: white;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

thead {
  background: linear-gradient(135deg, #f8f9fa, #e6f7ff);
}

th {
  padding: 18px 20px;
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
  top: 20%;
  height: 60%;
  width: 1px;
  background: #e8e8e8;
}

td {
  padding: 18px 20px;
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
  height: 28px;
  background: #f0f0f0;
  border-radius: 14px;
  overflow: hidden;
}

.utilization-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-color), var(--primary-color));
  border-radius: 14px;
  transition: width 0.5s ease;
}

.utilization-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .vehicle-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .statistics-page {
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
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
    align-items: flex-start;
    gap: 15px;
  }
  
  .chart-legend {
    flex-wrap: wrap;
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
}

@media (max-width: 480px) {
  .vehicle-metrics {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .table-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .export-btn, .refresh-btn {
    width: 100%;
    justify-content: center;
  }
  
  table {
    font-size: 12px;
  }
  
  th, td {
    padding: 12px 10px;
  }
}
</style>