<template>
  <div class="vehicles-page">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-info">
        <img :src="user.avatar" alt="头像" class="avatar">
        <div class="user-details">
          <h3>{{ user.real_name }}</h3>
          <p>车辆管理</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToDashboard" class="home-btn">工作台</button>
        <button @click="goToHome" class="home-btn">首页</button>
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <button @click="showAddVehicle" class="add-btn">
          <span>➕</span>
          <span>添加车辆</span>
        </button>
        <button @click="refreshData" class="refresh-btn">
          <span>🔄</span>
          <span>刷新</span>
        </button>
      </div>
      <div class="action-right">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchKeyword"
            placeholder="搜索车牌号或品牌"
            class="search-input"
          >
          <span class="search-icon">🔍</span>
        </div>
        <div class="filter-group">
          <label>状态：</label>
          <select v-model="filterStatus" class="filter-select">
            <option value="all">全部状态</option>
            <option value="available">可用</option>
            <option value="in_use">使用中</option>
            <option value="maintenance">维修中</option>
            <option value="reserved">已预约</option>
          </select>
        </div>
        <div class="filter-group">
          <label>车型：</label>
          <select v-model="filterType" class="filter-select">
            <option value="all">全部车型</option>
            <option value="small">小型车</option>
            <option value="business">商务车</option>
            <option value="coach">大客车</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card" @click="filterStatus = 'available'">
        <div class="stat-icon available">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.availableCount }}</div>
          <div class="stat-label">可用车辆</div>
        </div>
      </div>
      <div class="stat-card" @click="filterStatus = 'in_use'">
        <div class="stat-icon in_use">🚗</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.inUseCount }}</div>
          <div class="stat-label">使用中</div>
        </div>
      </div>
      <div class="stat-card" @click="filterStatus = 'maintenance'">
        <div class="stat-icon maintenance">🔧</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.maintenanceCount }}</div>
          <div class="stat-label">维修中</div>
        </div>
      </div>
      <div class="stat-card" @click="showMaintenanceSchedule">
        <div class="stat-icon schedule">📅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.upcomingMaintenance }}</div>
          <div class="stat-label">待保养</div>
        </div>
      </div>
    </div>

    <!-- 车辆列表 -->
    <div class="vehicles-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredVehicles.length === 0" class="empty-state">
        <div class="empty-icon">🚗</div>
        <h3>暂无车辆数据</h3>
        <p>当前筛选条件下没有找到车辆</p>
        <button @click="resetFilters" class="reset-btn">重置筛选</button>
      </div>

      <div v-else class="vehicles-grid">
        <div 
          v-for="vehicle in filteredVehicles" 
          :key="vehicle.vehicle_id"
          class="vehicle-card"
          :class="vehicle.status"
          @click="viewVehicleDetail(vehicle)"
        >
          <div class="vehicle-header">
            <div class="vehicle-badge" :class="vehicle.status">
              {{ getStatusText(vehicle.status) }}
            </div>
            <div class="vehicle-actions">
              <button @click.stop="editVehicle(vehicle)" class="action-btn edit">编辑</button>
              <button @click.stop="changeStatus(vehicle)" class="action-btn status">状态</button>
            </div>
          </div>
          
          <div class="vehicle-plate">{{ vehicle.license_plate }}</div>
          
          <div class="vehicle-info">
            <div class="info-item">
              <span class="info-label">品牌型号：</span>
              <span class="info-value">{{ vehicle.brand }} {{ vehicle.model }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">车型：</span>
              <span class="info-value">{{ getVehicleTypeText(vehicle.vehicle_type) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">颜色：</span>
              <span class="info-value">{{ vehicle.color || '--' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">年份：</span>
              <span class="info-value">{{ vehicle.year || '--' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">载客量：</span>
              <span class="info-value">{{ vehicle.capacity || '--' }}人</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前里程：</span>
              <span class="info-value">{{ vehicle.current_mileage || '0' }}km</span>
            </div>
            <div class="info-item">
              <span class="info-label">车队：</span>
              <span class="info-value">{{ vehicle.fleet_name || '未分配' }}</span>
            </div>
          </div>

          <div class="vehicle-footer">
            <div class="last-maintenance">
              上次保养：{{ vehicle.last_maintenance || '--' }}
            </div>
            <div class="next-maintenance">
              下次保养：{{ vehicle.next_maintenance || '--' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑车辆模态框 -->
    <div v-if="showVehicleModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEditing ? '编辑车辆' : '添加车辆' }}</h3>
        
        <div class="form-group">
          <label>车牌号 *</label>
          <input 
            type="text" 
            v-model="vehicleForm.license_plate"
            placeholder="请输入车牌号"
            class="form-input"
          >
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>车辆类型 *</label>
            <select v-model="vehicleForm.vehicle_type" class="form-select">
              <option value="">请选择类型</option>
              <option value="small">小型车</option>
              <option value="business">商务车</option>
              <option value="coach">大客车</option>
            </select>
          </div>
          <div class="form-group">
            <label>品牌</label>
            <input 
              type="text" 
              v-model="vehicleForm.brand"
              placeholder="品牌"
              class="form-input"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>型号</label>
            <input 
              type="text" 
              v-model="vehicleForm.model"
              placeholder="型号"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>颜色</label>
            <input 
              type="text" 
              v-model="vehicleForm.color"
              placeholder="颜色"
              class="form-input"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>年份</label>
            <input 
              type="number" 
              v-model="vehicleForm.year"
              placeholder="年份"
              class="form-input"
              min="2000"
              :max="new Date().getFullYear()"
            >
          </div>
          <div class="form-group">
            <label>载客量</label>
            <input 
              type="number" 
              v-model="vehicleForm.capacity"
              placeholder="载客量"
              class="form-input"
              min="1"
              max="100"
            >
          </div>
        </div>
        
        <div class="form-group">
          <label>当前里程</label>
          <input 
            type="number" 
            v-model="vehicleForm.current_mileage"
            placeholder="当前里程"
            class="form-input"
            step="0.01"
          >
        </div>
        
        <div class="form-group">
          <label>燃油类型</label>
          <select v-model="vehicleForm.fuel_type" class="form-select">
            <option value="">请选择燃油类型</option>
            <option value="gasoline">汽油</option>
            <option value="diesel">柴油</option>
            <option value="electric">电动</option>
            <option value="hybrid">混合动力</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>所属车队</label>
          <select v-model="vehicleForm.fleet_id" class="form-select">
            <option value="">请选择车队</option>
            <option v-for="fleet in fleets" :key="fleet.fleet_id" :value="fleet.fleet_id">
              {{ fleet.fleet_name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>状态</label>
          <select v-model="vehicleForm.status" class="form-select">
            <option value="available">可用</option>
            <option value="in_use">使用中</option>
            <option value="maintenance">维修中</option>
            <option value="reserved">已预约</option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button @click="showVehicleModal = false" class="cancel-btn">取消</button>
          <button @click="saveVehicle" class="confirm-btn">保存</button>
        </div>
      </div>
    </div>

    <!-- 状态变更模态框 -->
    <div v-if="showStatusModal" class="modal-overlay">
      <div class="modal-content">
        <h3>变更车辆状态</h3>
        <p>车牌号：<strong>{{ selectedVehicle?.license_plate }}</strong></p>
        
        <div class="status-options">
          <div 
            v-for="status in statusOptions" 
            :key="status.value"
            class="status-option"
            :class="{ selected: newStatus === status.value }"
            @click="newStatus = status.value"
          >
            <div class="status-icon">{{ status.icon }}</div>
            <div class="status-info">
              <div class="status-name">{{ status.label }}</div>
              <div class="status-desc">{{ status.description }}</div>
            </div>
          </div>
        </div>
        
        <div v-if="newStatus === 'maintenance'" class="maintenance-form">
          <div class="form-group">
            <label>维修原因</label>
            <textarea 
              v-model="maintenanceReason"
              placeholder="请输入维修原因"
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label>预计完成时间</label>
            <input 
              type="datetime-local" 
              v-model="estimatedFinishTime"
              class="form-input"
            >
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showStatusModal = false" class="cancel-btn">取消</button>
          <button @click="updateVehicleStatus" class="confirm-btn">确认变更</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminVehicles',
  data() {
    return {
      user: {},
      vehicles: [],
      fleets: [],
      loading: false,
      
      // 筛选
      searchKeyword: '',
      filterStatus: 'all',
      filterType: 'all',
      
      // 统计数据
      stats: {
        availableCount: 0,
        inUseCount: 0,
        maintenanceCount: 0,
        upcomingMaintenance: 0
      },
      
      // 车辆模态框
      showVehicleModal: false,
      showStatusModal: false,
      isEditing: false,
      selectedVehicle: null,
      
      // 车辆表单
      vehicleForm: {
        license_plate: '',
        vehicle_type: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        capacity: '',
        current_mileage: '',
        fuel_type: '',
        fleet_id: '',
        status: 'available'
      },
      
      // 状态变更
      newStatus: '',
      maintenanceReason: '',
      estimatedFinishTime: '',
      
      statusOptions: [
        { value: 'available', label: '可用', icon: '✅', description: '车辆正常，可以安排使用' },
        { value: 'in_use', label: '使用中', icon: '🚗', description: '车辆正在执行任务' },
        { value: 'maintenance', label: '维修中', icon: '🔧', description: '车辆正在维修保养' },
        { value: 'reserved', label: '已预约', icon: '📅', description: '车辆已被预约' }
      ]
    };
  },
  computed: {
    filteredVehicles() {
      return this.vehicles.filter(vehicle => {
        // 搜索筛选
        if (this.searchKeyword) {
          const keyword = this.searchKeyword.toLowerCase();
          const matchLicense = vehicle.license_plate.toLowerCase().includes(keyword);
          const matchBrand = vehicle.brand?.toLowerCase().includes(keyword);
          const matchModel = vehicle.model?.toLowerCase().includes(keyword);
          if (!matchLicense && !matchBrand && !matchModel) {
            return false;
          }
        }
        
        // 状态筛选
        if (this.filterStatus !== 'all' && vehicle.status !== this.filterStatus) {
          return false;
        }
        
        // 类型筛选
        if (this.filterType !== 'all' && vehicle.vehicle_type !== this.filterType) {
          return false;
        }
        
        return true;
      });
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadVehicles();
    this.loadFleets();
  },
  methods: {
    loadUserInfo() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    },
    
    async loadVehicles() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/vehicles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.vehicles = result.data || [];
            this.calculateStats();
          }
        } else {
          this.loadMockData();
        }
      } catch (error) {
        console.error('加载车辆数据失败:', error);
        this.loadMockData();
      } finally {
        this.loading = false;
      }
    },
    
    async loadFleets() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/admin/fleets', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.fleets = result.data || [];
          }
        } else {
          this.fleets = [
            { fleet_id: 1, fleet_name: '小车队' },
            { fleet_id: 2, fleet_name: '商务车队' },
            { fleet_id: 3, fleet_name: '大客车队' }
          ];
        }
      } catch (error) {
        console.error('加载车队列表失败:', error);
        this.fleets = [
          { fleet_id: 1, fleet_name: '小车队' },
          { fleet_id: 2, fleet_name: '商务车队' },
          { fleet_id: 3, fleet_name: '大客车队' }
        ];
      }
    },
    
    calculateStats() {
      this.stats = {
        availableCount: this.vehicles.filter(v => v.status === 'available').length,
        inUseCount: this.vehicles.filter(v => v.status === 'in_use').length,
        maintenanceCount: this.vehicles.filter(v => v.status === 'maintenance').length,
        upcomingMaintenance: this.vehicles.filter(v => v.next_maintenance && new Date(v.next_maintenance) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
      };
    },
    
    loadMockData() {
      this.vehicles = [
        {
          vehicle_id: 1,
          license_plate: '京A88888',
          vehicle_type: 'small',
          brand: '奥迪',
          model: 'A6L',
          color: '黑色',
          year: 2022,
          capacity: 5,
          current_mileage: 15680.5,
          fuel_type: 'gasoline',
          status: 'available',
          fleet_name: '小车队',
          last_maintenance: '2024-01-15',
          next_maintenance: '2024-04-15'
        },
        {
          vehicle_id: 2,
          license_plate: '京A66666',
          vehicle_type: 'small',
          brand: '宝马',
          model: '5系',
          color: '白色',
          year: 2021,
          capacity: 5,
          current_mileage: 24520.3,
          fuel_type: 'gasoline',
          status: 'in_use',
          fleet_name: '小车队',
          last_maintenance: '2024-01-10',
          next_maintenance: '2024-04-10'
        },
        {
          vehicle_id: 3,
          license_plate: '京A77777',
          vehicle_type: 'business',
          brand: '奔驰',
          model: 'V级',
          color: '银色',
          year: 2023,
          capacity: 7,
          current_mileage: 8560.2,
          fuel_type: 'diesel',
          status: 'maintenance',
          fleet_name: '商务车队',
          last_maintenance: '2023-12-20',
          next_maintenance: '2024-03-20'
        },
        {
          vehicle_id: 4,
          license_plate: '京A99999',
          vehicle_type: 'coach',
          brand: '宇通',
          model: 'ZK6128',
          color: '蓝色',
          year: 2020,
          capacity: 50,
          current_mileage: 125400.8,
          fuel_type: 'diesel',
          status: 'available',
          fleet_name: '大客车队',
          last_maintenance: '2024-01-05',
          next_maintenance: '2024-04-05'
        }
      ];
      this.calculateStats();
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车'
      };
      return typeMap[type] || type;
    },
    
    getStatusText(status) {
      const statusMap = {
        available: '可用',
        in_use: '使用中',
        maintenance: '维修中',
        reserved: '已预约'
      };
      return statusMap[status] || status;
    },
    
    showAddVehicle() {
      this.isEditing = false;
      this.vehicleForm = {
        license_plate: '',
        vehicle_type: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        capacity: '',
        current_mileage: '',
        fuel_type: '',
        fleet_id: '',
        status: 'available'
      };
      this.showVehicleModal = true;
    },
    
    editVehicle(vehicle) {
      this.isEditing = true;
      this.selectedVehicle = vehicle;
      this.vehicleForm = { ...vehicle };
      this.showVehicleModal = true;
    },
    
    async saveVehicle() {
      // 表单验证
      if (!this.vehicleForm.license_plate.trim()) {
        alert('请输入车牌号');
        return;
      }
      
      if (!this.vehicleForm.vehicle_type) {
        alert('请选择车辆类型');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const method = this.isEditing ? 'PUT' : 'POST';
        const url = this.isEditing 
          ? `http://localhost:3000/api/vehicles/${this.selectedVehicle.vehicle_id}`
          : 'http://localhost:3000/api/vehicles';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.vehicleForm)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert(this.isEditing ? '车辆更新成功' : '车辆添加成功');
            this.showVehicleModal = false;
            this.loadVehicles();
          }
        } else {
          throw new Error('保存失败');
        }
      } catch (error) {
        console.error('保存车辆失败:', error);
        alert('操作失败');
      }
    },
    
    changeStatus(vehicle) {
      this.selectedVehicle = vehicle;
      this.newStatus = vehicle.status;
      this.maintenanceReason = '';
      this.estimatedFinishTime = '';
      this.showStatusModal = true;
    },
    
    async updateVehicleStatus() {
      if (!this.newStatus) {
        alert('请选择状态');
        return;
      }
      
      if (this.newStatus === 'maintenance' && !this.maintenanceReason.trim()) {
        alert('请输入维修原因');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/vehicles/${this.selectedVehicle.vehicle_id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: this.newStatus,
            maintenance_reason: this.maintenanceReason,
            estimated_finish_time: this.estimatedFinishTime
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('车辆状态更新成功');
            this.showStatusModal = false;
            this.loadVehicles();
          }
        } else {
          throw new Error('更新失败');
        }
      } catch (error) {
        console.error('更新车辆状态失败:', error);
        alert('操作失败');
      }
    },
    
    viewVehicleDetail(vehicle) {
      alert(`查看车辆详情: ${vehicle.license_plate}\n状态: ${this.getStatusText(vehicle.status)}`);
    },
    
    showMaintenanceSchedule() {
      alert('保养计划功能开发中...');
    },
    
    refreshData() {
      this.loadVehicles();
    },
    
    resetFilters() {
      this.searchKeyword = '';
      this.filterStatus = 'all';
      this.filterType = 'all';
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
.vehicles-page {
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

/* 操作栏 */
.action-bar {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.action-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #52c41a);
}

.action-left {
  display: flex;
  gap: 16px;
}

.add-btn,
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.add-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.refresh-btn {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.add-btn:hover,
.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.add-btn:active,
.refresh-btn:active {
  transform: translateY(0);
}

.action-right {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 14px 45px 14px 20px;
  border: 2px solid #e8e8e8;
  border-radius: 25px;
  width: 240px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #f8f9fa;
  color: #333;
}

.search-input:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  width: 280px;
}

.search-input::placeholder {
  color: #aaa;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 20px;
  pointer-events: none;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  white-space: nowrap;
}

.filter-select {
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  min-width: 150px;
  font-size: 14px;
  background: #f8f9fa;
  color: #333;
  transition: all 0.3s ease;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.filter-select:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.4s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
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
  font-size: 40px;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-icon.available { 
  background: linear-gradient(135deg, #f6ffed, #ffffff); 
  color: #52c41a; 
}

.stat-icon.in_use { 
  background: linear-gradient(135deg, #e6f7ff, #ffffff); 
  color: #1890ff; 
}

.stat-icon.maintenance { 
  background: linear-gradient(135deg, #fff7e6, #ffffff); 
  color: #fa8c16; 
}

.stat-icon.schedule { 
  background: linear-gradient(135deg, #f9f0ff, #ffffff); 
  color: #722ed1; 
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 车辆列表 */
.vehicles-list {
  margin-bottom: 30px;
}

.loading {
  text-align: center;
  padding: 80px 30px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px dashed #e8e8e8;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 25px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 80px 30px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px dashed #d9d9d9;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 25px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 22px;
  font-weight: 600;
}

.empty-state p {
  color: #666;
  font-size: 16px;
  margin: 0 0 30px 0;
  font-weight: 500;
}

.reset-btn {
  padding: 14px 36px;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

/* 车辆网格 */
.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 25px;
}

.vehicle-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.4s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.vehicle-card:hover {
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
  border-color: #1890ff;
}

.vehicle-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 100%;
  background: #1890ff;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.vehicle-card:hover::before {
  opacity: 1;
}

.vehicle-card.available {
  border-left: 6px solid #52c41a;
}

.vehicle-card.in_use {
  border-left: 6px solid #1890ff;
}

.vehicle-card.maintenance {
  border-left: 6px solid #fa8c16;
}

.vehicle-card.reserved {
  border-left: 6px solid #722ed1;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.vehicle-badge {
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vehicle-badge.available {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: white;
}

.vehicle-badge.in_use {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
}

.vehicle-badge.maintenance {
  background: linear-gradient(135deg, #fa8c16, #ffc53d);
  color: white;
}

.vehicle-badge.reserved {
  background: linear-gradient(135deg, #722ed1, #9254de);
  color: white;
}

.vehicle-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 18px;
  border: 2px solid;
  background: white;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.action-btn.edit {
  color: #1890ff;
  border-color: #1890ff;
}

.action-btn.status {
  color: #52c41a;
  border-color: #52c41a;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.action-btn:active {
  transform: translateY(0);
}

.vehicle-plate {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.vehicle-card:hover .vehicle-plate {
  background: linear-gradient(135deg, #e6f7ff, #ffffff);
  border-color: #bae7ff;
}

.vehicle-info {
  margin-bottom: 25px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px dashed #f0f0f0;
  transition: all 0.2s ease;
}

.info-item:hover {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 14px 12px;
  transform: translateX(5px);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-weight: 600;
  font-size: 15px;
}

.vehicle-footer {
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.last-maintenance,
.next-maintenance {
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.vehicle-card:hover .last-maintenance,
.vehicle-card:hover .next-maintenance {
  background: #e6f7ff;
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
  max-width: 600px;
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

.modal-content h3 {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: #f8f9fa;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

/* 状态选项 */
.status-options {
  margin: 20px 0;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.status-option:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.status-option.selected {
  background: linear-gradient(135deg, #e6f7ff, #ffffff);
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
}

.status-icon {
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

.status-option.selected .status-icon {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.status-info {
  flex: 1;
}

.status-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  font-size: 16px;
}

.status-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* 模态框操作按钮 */
.modal-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.cancel-btn,
.confirm-btn {
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
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #666;
  border: 2px solid #e8e8e8;
}

.confirm-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.cancel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #e9ecef, #f8f9fa);
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

.confirm-btn:disabled {
  background: linear-gradient(135deg, #bfbfbf, #8c8c8c);
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .vehicles-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .vehicles-page {
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
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .action-right {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .search-input:focus {
    width: 100%;
  }
  
  .vehicles-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-row {
    flex-direction: column;
    gap: 20px;
  }
  
  .modal-content {
    padding: 24px;
    margin: 0 16px;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .vehicle-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .vehicle-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .last-maintenance,
  .next-maintenance {
    width: 100%;
    text-align: center;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>