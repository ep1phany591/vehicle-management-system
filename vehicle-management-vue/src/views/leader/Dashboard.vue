<template>
  <div class="leader-dashboard">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <img :src="user.avatar || defaultAvatar" alt="头像" class="avatar">
        <div class="user-details">
          <h3>{{ user.real_name }}</h3>
          <p>领导工作台</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToHome" class="home-btn">首页</button>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <!-- 绩效概览 -->
    <div class="performance-overview">
      <div class="section-header">
        <h3>绩效概览</h3>
        <div class="time-filters">
          <select v-model="timeRange" @change="loadPerformanceData" class="time-select">
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="quarter">本季度</option>
            <option value="year">本年</option>
          </select>
          <input 
            type="date" 
            v-model="startDate" 
            @change="loadPerformanceData" 
            class="date-input"
          >
          <span>至</span>
          <input 
            type="date" 
            v-model="endDate" 
            @change="loadPerformanceData" 
            class="date-input"
          >
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else class="performance-cards">
        <!-- 审批绩效 -->
        <div class="performance-card">
          <div class="card-header">
            <h4>审批绩效</h4>
            <span class="trend positive" v-if="performance.approvalTrend > 0">
              ↑ {{ performance.approvalTrend }}%
            </span>
            <span class="trend negative" v-else-if="performance.approvalTrend < 0">
              ↓ {{ Math.abs(performance.approvalTrend) }}%
            </span>
          </div>
          <div class="card-stats">
            <div class="stat-item">
              <div class="stat-value">{{ performance.totalApprovals }}</div>
              <div class="stat-label">总审批数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ performance.avgApprovalTime }}h</div>
              <div class="stat-label">平均处理时间</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ performance.approvalRate }}%</div>
              <div class="stat-label">审批率</div>
            </div>
          </div>
          <div class="card-chart">
            <div class="chart-bar" 
                 v-for="(item, index) in performance.dailyApprovals" 
                 :key="index"
                 :style="{ height: (item / performance.maxDailyApprovals * 100) + '%' }"
                 :title="`${item} 单`">
              <span class="bar-label">{{ item }}</span>
            </div>
          </div>
        </div>
        
        <!-- 部门对比 -->
        <div class="performance-card">
          <div class="card-header">
            <h4>部门用车对比</h4>
          </div>
          <div class="department-stats">
            <div v-for="dept in performance.departmentStats" 
                 :key="dept.name" 
                 class="department-item">
              <div class="dept-info">
                <span class="dept-name">{{ dept.name }}</span>
                <span class="dept-count">{{ dept.count }} 单</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" 
                     :style="{ width: dept.percentage + '%' }"
                     :class="getDeptColor(dept.name)">
                  <span class="progress-text">{{ dept.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 车辆使用率 -->
        <div class="performance-card">
          <div class="card-header">
            <h4>车辆使用率</h4>
          </div>
          <div class="vehicle-usage">
            <div class="usage-item" v-for="type in performance.vehicleUsage" :key="type.name">
              <div class="usage-info">
                <span class="usage-name">{{ type.name }}</span>
                <span class="usage-rate">{{ type.rate }}%</span>
              </div>
              <div class="usage-chart">
                <div class="usage-bar" :style="{ width: type.rate + '%' }"></div>
              </div>
              <div class="usage-details">
                <span>已用: {{ type.used }}/{{ type.total }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据导出 -->
    <div class="export-section">
      <div class="section-header">
        <h3>数据导出</h3>
      </div>
      
      <div class="export-cards">
        <div class="export-card" @click="exportData('approval')">
          <div class="export-icon">📊</div>
          <h4>审批记录</h4>
          <p>导出所有审批记录，包括批准和拒绝的申请</p>
          <button class="export-btn">导出 Excel</button>
        </div>
        
        <div class="export-card" @click="exportData('performance')">
          <div class="export-icon">📈</div>
          <h4>绩效报表</h4>
          <p>导出详细的绩效统计数据和分析报告</p>
          <button class="export-btn">导出 PDF</button>
        </div>
        
        <div class="export-card" @click="exportData('vehicle')">
          <div class="export-icon">🚗</div>
          <h4>车辆使用报告</h4>
          <p>导出车辆使用情况和效率分析</p>
          <button class="export-btn">导出 Excel</button>
        </div>
        
        <div class="export-card" @click="showCustomExport = true">
          <div class="export-icon">⚙️</div>
          <h4>自定义导出</h4>
          <p>自定义时间范围和数据类型</p>
          <button class="export-btn">配置导出</button>
        </div>
      </div>
    </div>

    <!-- 自定义导出弹窗 -->
    <div v-if="showCustomExport" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>自定义数据导出</h3>
          <button @click="showCustomExport = false" class="close-btn">×</button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>数据范围</label>
            <select v-model="exportConfig.dataType" class="form-select">
              <option value="approval">审批记录</option>
              <option value="performance">绩效数据</option>
              <option value="vehicle">车辆使用</option>
              <option value="all">全部数据</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>时间范围</label>
            <div class="date-range">
              <input type="date" v-model="exportConfig.startDate" class="form-input">
              <span>至</span>
              <input type="date" v-model="exportConfig.endDate" class="form-input">
            </div>
          </div>
          
          <div class="form-group">
            <label>导出格式</label>
            <div class="format-options">
              <label class="format-option">
                <input type="radio" v-model="exportConfig.format" value="excel">
                <span>Excel (.xlsx)</span>
              </label>
              <label class="format-option">
                <input type="radio" v-model="exportConfig.format" value="pdf">
                <span>PDF (.pdf)</span>
              </label>
              <label class="format-option">
                <input type="radio" v-model="exportConfig.format" value="csv">
                <span>CSV (.csv)</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>包含字段</label>
            <div class="field-options">
              <label v-for="field in exportFields[exportConfig.dataType]" 
                     :key="field.id"
                     class="field-option">
                <input type="checkbox" v-model="exportConfig.fields" :value="field.id">
                <span>{{ field.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCustomExport = false" class="cancel-btn">取消</button>
          <button @click="handleCustomExport" class="export-confirm-btn">确认导出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LeaderDashboard',
  data() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return {
      user: {},
      timeRange: 'month',
      startDate: this.formatDate(firstDay),
      endDate: this.formatDate(today),
      loading: false,
      performance: {
        totalApprovals: 156,
        avgApprovalTime: 2.5,
        approvalRate: 87.5,
        approvalTrend: 12.3,
        dailyApprovals: [12, 15, 18, 14, 20, 16, 13],
        maxDailyApprovals: 20,
        departmentStats: [
          { name: '销售部', count: 45, percentage: 28.8 },
          { name: '技术部', count: 38, percentage: 24.4 },
          { name: '市场部', count: 32, percentage: 20.5 },
          { name: '行政部', count: 25, percentage: 16.0 },
          { name: '财务部', count: 16, percentage: 10.3 }
        ],
        vehicleUsage: [
          { name: '小型车', rate: 75, used: 45, total: 60 },
          { name: '商务车', rate: 62, used: 31, total: 50 },
          { name: '大客车', rate: 40, used: 8, total: 20 }
        ]
      },
      showCustomExport: false,
      exportConfig: {
        dataType: 'approval',
        format: 'excel',
        startDate: this.formatDate(firstDay),
        endDate: this.formatDate(today),
        fields: []
      },
      exportFields: {
        approval: [
          { id: 'id', label: '申请ID' },
          { id: 'applicant', label: '申请人' },
          { id: 'department', label: '部门' },
          { id: 'reason', label: '事由' },
          { id: 'vehicle', label: '车辆类型' },
          { id: 'time', label: '使用时间' },
          { id: 'status', label: '审批状态' },
          { id: 'approver', label: '审批人' },
          { id: 'approvalTime', label: '审批时间' }
        ],
        performance: [
          { id: 'date', label: '日期' },
          { id: 'approvalCount', label: '审批数量' },
          { id: 'avgTime', label: '平均处理时间' },
          { id: 'approvalRate', label: '审批率' },
          { id: 'department', label: '部门分布' }
        ],
        vehicle: [
          { id: 'vehicleId', label: '车辆ID' },
          { id: 'type', label: '车辆类型' },
          { id: 'usageRate', label: '使用率' },
          { id: 'distance', label: '行驶里程' },
          { id: 'fuel', label: '油耗' },
          { id: 'maintenance', label: '维护记录' }
        ]
      },
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    };
  },
  mounted() {
    this.loadUserInfo();
    this.loadPerformanceData();
  },
  methods: {
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    formatDate(date) {
      return date.toISOString().split('T')[0];
    },
    
    async loadPerformanceData() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          timeRange: this.timeRange,
          startDate: this.startDate,
          endDate: this.endDate
        });
        
        const response = await fetch(
          `http://localhost:3000/api/admin/performance?${params}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            this.performance = data.data;
          }
        } else {
          // 如果API不可用，使用模拟数据
          this.useMockPerformanceData();
        }
      } catch (error) {
        console.error('加载绩效数据失败:', error);
        this.useMockPerformanceData();
      } finally {
        this.loading = false;
      }
    },
    
    useMockPerformanceData() {
      // 根据时间范围调整模拟数据
      let multiplier = 1;
      switch (this.timeRange) {
        case 'week': multiplier = 0.25; break;
        case 'quarter': multiplier = 3; break;
        case 'year': multiplier = 12; break;
      }
      
      this.performance = {
        totalApprovals: Math.round(156 * multiplier),
        avgApprovalTime: 2.5,
        approvalRate: 87.5 + (Math.random() * 10 - 5),
        approvalTrend: (Math.random() * 30 - 15),
        dailyApprovals: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 10),
        maxDailyApprovals: 20,
        departmentStats: [
          { name: '销售部', count: Math.round(45 * multiplier), percentage: 28.8 },
          { name: '技术部', count: Math.round(38 * multiplier), percentage: 24.4 },
          { name: '市场部', count: Math.round(32 * multiplier), percentage: 20.5 },
          { name: '行政部', count: Math.round(25 * multiplier), percentage: 16.0 },
          { name: '财务部', count: Math.round(16 * multiplier), percentage: 10.3 }
        ],
        vehicleUsage: [
          { name: '小型车', rate: 75, used: Math.round(45 * multiplier), total: 60 },
          { name: '商务车', rate: 62, used: Math.round(31 * multiplier), total: 50 },
          { name: '大客车', rate: 40, used: Math.round(8 * multiplier), total: 20 }
        ]
      };
      
      // 更新最大日审批数用于图表
      this.performance.maxDailyApprovals = Math.max(...this.performance.dailyApprovals);
    },
    
    getDeptColor(deptName) {
      const colors = {
        '销售部': 'sales',
        '技术部': 'tech',
        '市场部': 'marketing',
        '行政部': 'admin',
        '财务部': 'finance'
      };
      return colors[deptName] || '';
    },
    
    async exportData(type) {
      try {
        this.loading = true;
        const token = localStorage.getItem('token');
        
        let endpoint = '';
        let filename = '';
        
        switch (type) {
          case 'approval':
            endpoint = 'export-approvals';
            filename = `审批记录_${new Date().toISOString().split('T')[0]}.xlsx`;
            break;
          case 'performance':
            endpoint = 'export-performance';
            filename = `绩效报表_${new Date().toISOString().split('T')[0]}.pdf`;
            break;
          case 'vehicle':
            endpoint = 'export-vehicle-usage';
            filename = `车辆使用报告_${new Date().toISOString().split('T')[0]}.xlsx`;
            break;
        }
        
        const params = new URLSearchParams({
          startDate: this.startDate,
          endDate: this.endDate
        });
        
        const response = await fetch(
          `http://localhost:3000/api/admin/${endpoint}?${params}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          alert('导出成功！');
        } else {
          throw new Error('导出失败');
        }
      } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败，请重试');
      } finally {
        this.loading = false;
      }
    },
    
    handleCustomExport() {
      // 这里实现自定义导出逻辑
      console.log('自定义导出配置:', this.exportConfig);
      
      // 模拟导出
      const filename = `${this.exportConfig.dataType}_${this.exportConfig.startDate}_to_${this.exportConfig.endDate}.${this.exportConfig.format}`;
      alert(`开始导出: ${filename}`);
      
      this.showCustomExport = false;
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
.leader-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding: 24px;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航 */
.header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 16px;
  padding: 20px 28px;
  margin-bottom: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.2);
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  object-fit: cover;
  background: white;
}

.user-details h3 {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 600;
}

.user-details p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.home-btn,
.logout-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
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

.home-btn:hover,
.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 绩效概览 */
.performance-overview,
.export-section {
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 28px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.time-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.time-select,
.date-input {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  min-width: 120px;
}

.date-input {
  min-width: 140px;
}

/* 绩效卡片 */
.performance-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.performance-card {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.performance-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.card-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.trend {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}

.trend.positive {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.trend.negative {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1890ff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.card-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 120px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
}

.chart-bar {
  flex: 1;
  margin: 0 4px;
  background: linear-gradient(to top, #1890ff, #69c0ff);
  border-radius: 6px 6px 0 0;
  position: relative;
  min-height: 20px;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  background: linear-gradient(to top, #096dd9, #1890ff);
  transform: scale(1.05);
}

.bar-label {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

/* 部门统计 */
.department-item {
  margin-bottom: 16px;
}

.dept-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dept-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.dept-count {
  font-size: 13px;
  color: #666;
}

.progress-bar {
  height: 24px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.6s ease;
  min-width: 40px;
  position: relative;
}

.progress-fill.sales { background: linear-gradient(90deg, #1890ff, #40a9ff); }
.progress-fill.tech { background: linear-gradient(90deg, #52c41a, #73d13d); }
.progress-fill.marketing { background: linear-gradient(90deg, #faad14, #ffc53d); }
.progress-fill.admin { background: linear-gradient(90deg, #722ed1, #9254de); }
.progress-fill.finance { background: linear-gradient(90deg, #eb2f96, #f759ab); }

.progress-text {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
  color: white;
}

/* 车辆使用率 */
.usage-item {
  margin-bottom: 20px;
}

.usage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.usage-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.usage-rate {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.usage-chart {
  height: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.usage-bar {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #69c0ff);
  border-radius: 6px;
  transition: width 0.6s ease;
}

.usage-details {
  font-size: 12px;
  color: #666;
  text-align: right;
}

/* 导出部分 */
.export-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.export-card {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid transparent;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-card:hover {
  transform: translateY(-4px);
  border-color: #1890ff;
  box-shadow: 0 12px 32px rgba(24, 144, 255, 0.15);
}

.export-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.export-card h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.export-card p {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.export-btn {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.export-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
}

/* 弹窗 */
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
}

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-content {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-select,
.form-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.format-options,
.field-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.format-option,
.field-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
}

.field-options {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn,
.export-confirm-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.export-confirm-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.export-confirm-btn:hover {
  background: linear-gradient(135deg, #73d13d, #95de64);
}

/* 加载状态 */
.loading {
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

/* 响应式设计 */
@media (max-width: 768px) {
  .leader-dashboard {
    padding: 16px;
  }
  
  .performance-cards,
  .export-cards {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .time-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .time-select,
  .date-input {
    width: 100%;
  }
  
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .user-info {
    flex-direction: column;
  }
  
  .modal {
    width: 95%;
    margin: 16px;
  }
}
</style>