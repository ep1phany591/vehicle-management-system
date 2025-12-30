<!-- src/views/ApplicationDetail.vue -->
<template>
  <div class="application-detail-page">
    <!-- 顶部导航 -->
    <div class="header">
      <button @click="goBack" class="back-btn">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>
      <h1>申请详情</h1>
      <div class="header-right">
        <span class="app-id">申请编号: {{ application.application_id }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="goBack" class="back-action-btn">返回</button>
    </div>

    <!-- 申请详情内容 -->
    <div v-else class="detail-content">
      <!-- 状态卡片 -->
      <div class="status-card">
        <div class="status-info">
          <div class="status-label">当前状态</div>
          <div class="status-value" :class="getStatusColor(application.status)">
            {{ getStatusText(application.status) }}
          </div>
        </div>
        <div class="apply-time">
          <span class="time-label">申请时间</span>
          <span class="time-value">{{ formatDateTime(application.apply_time) }}</span>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="info-section">
        <h2 class="section-title">
          <span class="section-icon">📋</span>
          申请信息
        </h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">用车事由</span>
            <span class="info-value">{{ application.reason }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">申请人</span>
            <span class="info-value">{{ application.applicant_name || application.applicant_id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所在部门</span>
            <span class="info-value">{{ application.department || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">乘车人数</span>
            <span class="info-value">{{ application.people_count }}人</span>
          </div>
          <div class="info-item">
            <span class="info-label">车型选择</span>
            <span class="info-value">{{ getVehicleTypeText(application.vehicle_type) }}</span>
          </div>
        </div>
      </div>

      <!-- 时间安排 -->
      <div class="info-section">
        <h2 class="section-title">
          <span class="section-icon">🕒</span>
          时间安排
        </h2>
        <div class="time-grid">
          <div class="time-item">
            <div class="time-icon">⏰</div>
            <div class="time-details">
              <div class="time-label">开始时间</div>
              <div class="time-value">{{ formatDateTime(application.start_time) }}</div>
            </div>
          </div>
          <div class="time-item">
            <div class="time-icon">⏰</div>
            <div class="time-details">
              <div class="time-label">结束时间</div>
              <div class="time-value">{{ formatDateTime(application.end_time) }}</div>
            </div>
          </div>
          <div class="time-duration">
            <span class="duration-label">预计用车时长</span>
            <span class="duration-value">{{ calculateDuration(application.start_time, application.end_time) }}</span>
          </div>
        </div>
      </div>

      <!-- 其他信息 -->
      <div class="info-section">
        <h2 class="section-title">
          <span class="section-icon">📍</span>
          其他信息
        </h2>
        <div class="info-grid">
          <div v-if="application.destination" class="info-item">
            <span class="info-label">目的地</span>
            <span class="info-value">{{ application.destination }}</span>
          </div>
          <div v-if="application.contact_person" class="info-item">
            <span class="info-label">联系人</span>
            <span class="info-value">{{ application.contact_person }}</span>
          </div>
          <div v-if="application.contact_phone" class="info-item">
            <span class="info-label">联系电话</span>
            <span class="info-value">{{ application.contact_phone }}</span>
          </div>
          <div v-if="application.remarks" class="info-item full-width">
            <span class="info-label">备注信息</span>
            <span class="info-value">{{ application.remarks }}</span>
          </div>
        </div>
      </div>

      <!-- 审批信息 -->
      <div v-if="application.status === 'rejected' && application.reject_reason" class="info-section warning">
        <h2 class="section-title">
          <span class="section-icon">❌</span>
          审批意见
        </h2>
        <div class="reject-info">
          <div class="reject-reason">
            <span class="reject-label">拒绝原因：</span>
            <span class="reject-text">{{ application.reject_reason }}</span>
          </div>
          <div v-if="application.review_time" class="review-time">
            <span class="time-label">审批时间：</span>
            <span class="time-value">{{ formatDateTime(application.review_time) }}</span>
          </div>
        </div>
      </div>

      <!-- 司机信息（如有分配） -->
      <div v-if="application.status !== 'pending' && application.status !== 'rejected'" class="info-section">
        <h2 class="section-title">
          <span class="section-icon">👨‍✈️</span>
          司机信息
        </h2>
        <div class="driver-info">
          <div v-if="application.assigned_driver_id" class="driver-details">
            <div class="driver-icon">🚗</div>
            <div class="driver-content">
              <div class="driver-name">司机编号: {{ application.assigned_driver_id }}</div>
              <div v-if="application.driver_name" class="driver-phone">
                司机姓名: {{ application.driver_name }}
              </div>
              <div v-if="application.driver_phone" class="driver-phone">
                联系电话: {{ application.driver_phone }}
              </div>
            </div>
          </div>
          <div v-else class="no-driver">
            <div class="no-driver-icon">⏳</div>
            <div class="no-driver-text">等待司机接单...</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <!-- 申请人操作 -->
        <div v-if="user && application.applicant_id === user.user_id" class="action-buttons">
          <button 
            v-if="application.status === 'pending'"
            @click="cancelApplication"
            class="action-btn cancel-btn"
          >
            取消申请
          </button>
          <button 
            v-if="application.status === 'rejected'"
            @click="reapplyApplication"
            class="action-btn reapply-btn"
          >
            重新申请
          </button>
        </div>

        <!-- 司机操作 -->
        <div v-if="user && user.role === 'driver'" class="action-buttons">
          <button 
            v-if="application.status === 'assigned' && application.assigned_driver_id === user.user_id"
            @click="updateStatus('confirmed')"
            class="action-btn confirm-btn"
          >
            接受任务
          </button>
          <button 
            v-if="application.status === 'confirmed' && application.assigned_driver_id === user.user_id"
            @click="updateStatus('in_progress')"
            class="action-btn progress-btn"
          >
            开始行程
          </button>
          <button 
            v-if="application.status === 'in_progress' && application.assigned_driver_id === user.user_id"
            @click="updateStatus('completed')"
            class="action-btn complete-btn"
          >
            完成行程
          </button>
        </div>

        <!-- 管理员操作 -->
        <div v-if="user && user.role === 'admin'" class="action-buttons">
          <button 
            v-if="application.status === 'pending'"
            @click="approveApplication"
            class="action-btn approve-btn"
          >
            批准申请
          </button>
          <button 
            v-if="application.status === 'pending'"
            @click="showRejectDialog = true"
            class="action-btn reject-btn"
          >
            拒绝申请
          </button>
          <button 
            v-if="['approved', 'confirmed'].includes(application.status)"
            @click="showAssignDialog = true"
            class="action-btn assign-btn"
          >
            分配司机
          </button>
        </div>
      </div>
    </div>

    <!-- 拒绝申请对话框 -->
    <div v-if="showRejectDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h3 class="dialog-title">拒绝申请</h3>
        <div class="dialog-body">
          <label class="dialog-label">请填写拒绝原因：</label>
          <textarea 
            v-model="rejectReason" 
            class="dialog-textarea" 
            placeholder="请输入拒绝原因..."
            rows="4"
          ></textarea>
        </div>
        <div class="dialog-actions">
          <button @click="showRejectDialog = false" class="dialog-btn cancel-btn">
            取消
          </button>
          <button @click="rejectApplication" class="dialog-btn confirm-btn">
            确认拒绝
          </button>
        </div>
      </div>
    </div>

    <!-- 分配司机对话框 -->
    <div v-if="showAssignDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h3 class="dialog-title">分配司机</h3>
        <div class="dialog-body">
          <label class="dialog-label">选择司机：</label>
          <select v-model="selectedDriver" class="dialog-select">
            <option value="">请选择司机</option>
            <option v-for="driver in drivers" :key="driver.user_id" :value="driver.user_id">
              {{ driver.real_name || driver.username }} - {{ driver.phone || '暂无电话' }}
            </option>
          </select>
          <div v-if="selectedDriver" class="driver-info-dialog">
            <div class="info-row">
              <span class="info-label">司机姓名：</span>
              <span class="info-value">{{ getDriverInfo(selectedDriver, 'real_name') }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">联系电话：</span>
              <span class="info-value">{{ getDriverInfo(selectedDriver, 'phone') }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="showAssignDialog = false" class="dialog-btn cancel-btn">
            取消
          </button>
          <button @click="assignDriver" class="dialog-btn confirm-btn">
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ApplicationDetail',
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      application: {},
      loading: false,
      error: null,
      user: null,
      showRejectDialog: false,
      rejectReason: '',
      showAssignDialog: false,
      selectedDriver: '',
      drivers: []
    };
  },
  computed: {
    // 计算是否可操作
    canOperate() {
      if (!this.user || !this.application) return false;
      
      // 申请人只能操作自己的申请
      if (this.user.user_id === this.application.applicant_id) {
        return true;
      }
      
      // 管理员可以操作所有
      if (this.user.role === 'admin') {
        return true;
      }
      
      // 司机只能操作分配给自己的任务
      if (this.user.role === 'driver') {
        return this.application.assigned_driver_id === this.user.user_id;
      }
      
      return false;
    }
  },
  watch: {
    // 监听路由参数变化
    id: {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.loadApplicationDetail();
        }
      }
    }
  },
  mounted() {
    this.loadUserInfo();
  },
  methods: {
    // 加载用户信息
    loadUserInfo() {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          this.user = JSON.parse(userData);
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    },
    
    // 加载申请详情
    async loadApplicationDetail() {
      this.loading = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登录');
        }
        
        const response = await fetch(`http://localhost:3000/api/applications/${this.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.application = result.data;
        } else {
          throw new Error(result.message || '加载申请详情失败');
        }
      } catch (error) {
        console.error('加载申请详情失败:', error);
        this.error = error.message || '加载失败，请检查网络连接';
        
        // 开发环境：使用模拟数据
        if (process.env.NODE_ENV === 'development') {
          console.log('使用模拟数据');
          this.loadMockData();
        }
      } finally {
        this.loading = false;
      }
    },
    
    // 加载模拟数据
    loadMockData() {
      const mockData = {
        application_id: this.id,
        reason: '客户公司拜访和技术交流',
        applicant_id: 1,
        applicant_name: '张三',
        department: '技术部',
        people_count: 3,
        vehicle_type: 'business',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        destination: '科技园区A座',
        contact_person: '李经理',
        contact_phone: '13800138000',
        remarks: '需要携带演示设备',
        status: 'pending',
        apply_time: new Date().toISOString(),
        reject_reason: null,
        review_time: null,
        assigned_driver_id: null,
        driver_name: null,
        driver_phone: null
      };
      
      // 根据ID设置不同的状态用于测试
      const statuses = ['pending', 'approved', 'rejected', 'assigned', 'confirmed', 'in_progress', 'completed'];
      const statusIndex = parseInt(this.id) % statuses.length;
      mockData.status = statuses[statusIndex];
      
      if (mockData.status === 'rejected') {
        mockData.reject_reason = '当前无可用车辆，建议调整出行时间';
      } else if (['assigned', 'confirmed', 'in_progress', 'completed'].includes(mockData.status)) {
        mockData.assigned_driver_id = 10;
        mockData.driver_name = '王师傅';
        mockData.driver_phone = '13900139000';
      }
      
      this.application = mockData;
    },
    
    // 加载司机列表（管理员用）
    async loadDrivers() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/drivers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        if (result.success) {
          this.drivers = result.data || [];
        }
      } catch (error) {
        console.error('加载司机列表失败:', error);
      }
    },
    
    // 获取司机信息
    getDriverInfo(driverId, field) {
      const driver = this.drivers.find(d => d.user_id == driverId);
      return driver ? driver[field] || '' : '';
    },
    
    // 取消申请
    async cancelApplication() {
      if (!confirm('确定要取消这个申请吗？')) return;
      
      try {
        const response = await this.updateApplicationStatus('cancelled');
        if (response.success) {
          alert('申请已取消');
          this.loadApplicationDetail();
        }
      } catch (error) {
        console.error('取消申请失败:', error);
        alert('操作失败');
      }
    },
    
    // 批准申请
    async approveApplication() {
      if (!confirm('确定批准这个申请吗？')) return;
      
      try {
        const response = await this.updateApplicationStatus('approved');
        if (response.success) {
          alert('申请已批准');
          this.loadApplicationDetail();
        }
      } catch (error) {
        console.error('批准申请失败:', error);
        alert('操作失败');
      }
    },
    
    // 拒绝申请
    async rejectApplication() {
      if (!this.rejectReason.trim()) {
        alert('请输入拒绝原因');
        return;
      }
      
      try {
        const response = await this.updateApplicationStatus('rejected', this.rejectReason);
        if (response.success) {
          alert('申请已拒绝');
          this.showRejectDialog = false;
          this.rejectReason = '';
          this.loadApplicationDetail();
        }
      } catch (error) {
        console.error('拒绝申请失败:', error);
        alert('操作失败');
      }
    },
    
    // 分配司机
    async assignDriver() {
      if (!this.selectedDriver) {
        alert('请选择司机');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/applications/${this.id}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            driver_id: this.selectedDriver
          })
        });
        
        const result = await response.json();
        if (result.success) {
          alert('司机分配成功');
          this.showAssignDialog = false;
          this.selectedDriver = '';
          this.loadApplicationDetail();
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('分配司机失败:', error);
        alert('分配失败: ' + error.message);
      }
    },
    
    // 更新申请状态通用方法
    async updateApplicationStatus(status, rejectReason = '') {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/applications/${this.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          reject_reason: rejectReason
        })
      });
      
      return await response.json();
    },
    
    // 状态相关方法
    getStatusText(status) {
      const statusMap = {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        assigned: '已派车',
        confirmed: '已接单',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || status;
    },
    
    getStatusColor(status) {
      const colorMap = {
        pending: 'status-pending',
        approved: 'status-approved',
        rejected: 'status-rejected',
        assigned: 'status-assigned',
        confirmed: 'status-confirmed',
        in_progress: 'status-in-progress',
        completed: 'status-completed',
        cancelled: 'status-cancelled'
      };
      return colorMap[status];
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return typeMap[type] || type;
    },
    
    // 格式化时间
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    // 计算时长
    calculateDuration(startTime, endTime) {
      if (!startTime || !endTime) return '';
      
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      
      if (diffMs <= 0) return '时间无效';
      
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        return `${Math.round(diffHours * 60)}分钟`;
      } else if (diffHours < 24) {
        return `${diffHours.toFixed(1)}小时`;
      } else {
        return `${(diffHours / 24).toFixed(1)}天`;
      }
    },
    
    // 重新申请
    reapplyApplication() {
      this.$router.push({
        path: '/apply',
        query: {
          reason: this.application.reason,
          people_count: this.application.people_count,
          vehicle_type: this.application.vehicle_type,
          destination: this.application.destination,
          contact_person: this.application.contact_person,
          contact_phone: this.application.contact_phone,
          remarks: this.application.remarks
        }
      });
    },
    
    // 更新状态（司机用）
    async updateStatus(status) {
      let confirmText = '';
      let successText = '';
      
      switch (status) {
        case 'confirmed':
          confirmText = '确定接受这个任务吗？';
          successText = '任务已接受';
          break;
        case 'in_progress':
          confirmText = '确定开始行程吗？';
          successText = '行程已开始';
          break;
        case 'completed':
          confirmText = '确定完成行程吗？';
          successText = '行程已完成';
          break;
        default:
          confirmText = '确定执行此操作吗？';
      }
      
      if (!confirm(confirmText)) return;
      
      try {
        const response = await this.updateApplicationStatus(status);
        if (response.success) {
          alert(successText);
          this.loadApplicationDetail();
        }
      } catch (error) {
        console.error('状态更新失败:', error);
        alert('操作失败');
      }
    },
    
    // 返回上一页
    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push('/applications');
      }
    }
  }
};
</script>

<style scoped>
.application-detail-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 头部样式 */
.header {
  background-color: white;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.back-btn {
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.back-btn:hover {
  background-color: #f8f9fa;
  border-color: #1890ff;
  color: #1890ff;
}

.back-icon {
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.app-id {
  font-size: 14px;
  color: #666;
  background-color: #f8f9fa;
  padding: 4px 12px;
  border-radius: 4px;
}

/* 加载状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(24, 144, 255, 0.1);
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p,
.error-state p {
  font-size: 16px;
  color: #666;
  margin: 10px 0 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-state h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 10px 0;
}

.back-action-btn {
  padding: 10px 24px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-action-btn:hover {
  background-color: #40a9ff;
}

/* 详情内容 */
.detail-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* 状态卡片 */
.status-card {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-label {
  font-size: 14px;
  color: #666;
}

.status-value {
  font-size: 20px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 20px;
  display: inline-block;
}

.status-value.status-pending {
  background-color: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.status-value.status-approved {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-value.status-rejected {
  background-color: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
}

.status-value.status-assigned {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.status-value.status-confirmed {
  background-color: #e6fffb;
  color: #13c2c2;
  border: 1px solid #87e8de;
}

.status-value.status-in_progress {
  background-color: #f9f0ff;
  color: #722ed1;
  border: 1px solid #d3adf7;
}

.status-value.status-completed {
  background-color: #fff0f6;
  color: #eb2f96;
  border: 1px solid #ffadd2;
}

.status-value.status-cancelled {
  background-color: #fafafa;
  color: #8c8c8c;
  border: 1px solid #d9d9d9;
}

.apply-time {
  text-align: right;
}

.time-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.time-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

/* 信息区域 */
.info-section {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.info-section.warning {
  border-left: 4px solid #ff4d4f;
}

.section-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 20px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  line-height: 1.5;
}

/* 时间网格 */
.time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.time-icon {
  font-size: 24px;
}

.time-details {
  flex: 1;
}

.time-duration {
  grid-column: 1 / -1;
  text-align: center;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.duration-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.duration-value {
  font-size: 16px;
  color: #1890ff;
  font-weight: 600;
}

/* 拒绝信息 */
.reject-info {
  background-color: #fff2f0;
  border-radius: 8px;
  padding: 16px;
}

.reject-reason {
  margin-bottom: 12px;
}

.reject-label {
  font-size: 14px;
  color: #ff4d4f;
  font-weight: 600;
}

.reject-text {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
}

.review-time {
  font-size: 13px;
  color: #666;
}

/* 司机信息 */
.driver-info {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.driver-details {
  display: flex;
  align-items: center;
  gap: 16px;
}

.driver-icon {
  font-size: 32px;
}

.driver-content {
  flex: 1;
}

.driver-name {
  font-size: 16px;
  color: #333;
  font-weight: 600;
  margin-bottom: 4px;
}

.driver-phone {
  font-size: 14px;
  color: #666;
}

.no-driver {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  color: #666;
}

.no-driver-icon {
  font-size: 24px;
}

.no-driver-text {
  font-size: 16px;
}

/* 操作区域 */
.action-section {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cancel-btn {
  background-color: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.cancel-btn:hover {
  background-color: #ffccc7;
}

.reapply-btn {
  background-color: #f0f5ff;
  color: #1890ff;
  border: 1px solid #d6e4ff;
}

.reapply-btn:hover {
  background-color: #d6e4ff;
}

.approve-btn {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.approve-btn:hover {
  background-color: #d9f7be;
}

.reject-btn {
  background-color: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.reject-btn:hover {
  background-color: #ffccc7;
}

.assign-btn {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.assign-btn:hover {
  background-color: #bae7ff;
}

.confirm-btn {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.progress-btn {
  background-color: #f9f0ff;
  color: #722ed1;
  border: 1px solid #d3adf7;
}

.progress-btn:hover {
  background-color: #efdbff;
}

.complete-btn {
  background-color: #fff0f6;
  color: #eb2f96;
  border: 1px solid #ffadd2;
}

.complete-btn:hover {
  background-color: #ffd6e7;
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
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

.dialog-content {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  animation: slideUp 0.3s ease;
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

.dialog-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.dialog-body {
  margin-bottom: 24px;
}

.dialog-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.dialog-textarea,
.dialog-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.dialog-textarea:focus,
.dialog-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.dialog-select {
  height: 40px;
}

.driver-info-dialog {
  margin-top: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dialog-btn.cancel-btn {
  background-color: #f8f9fa;
  color: #666;
  border: 1px solid #dcdfe6;
}

.dialog-btn.cancel-btn:hover {
  background-color: #e9ecef;
}

.dialog-btn.confirm-btn {
  background-color: #1890ff;
  color: white;
}

.dialog-btn.confirm-btn:hover {
  background-color: #40a9ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-content {
    padding: 15px;
  }
  
  .status-card {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .info-grid,
  .time-grid {
    grid-template-columns: 1fr;
  }
  
  .time-duration {
    grid-column: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .dialog-content {
    width: 95%;
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 15px;
    text-align: center;
  }
  
  .header-right {
    order: -1;
  }
  
  .back-btn {
    align-self: flex-start;
  }
  
  .info-section {
    padding: 16px;
  }
}
</style>