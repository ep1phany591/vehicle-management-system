<template>
  <div class="vehicle-management">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="user-section">
        <div class="avatar-container">
          <span class="avatar-letter">{{ userInitial }}</span>
        </div>
        <div class="user-info">
          <h2>车辆管理</h2>
          <p class="user-role">车队队长 · {{ fleetInfo?.fleet_name }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="goToDashboard" class="btn btn-secondary">
          <span>🏠</span>
          <span>返回工作台</span>
        </button>
        <button @click="refreshData" class="btn btn-refresh">
          <span>🔄</span>
          <span>刷新</span>
        </button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 车辆统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card" :class="{ 'clickable': true }" @click="filterByStatus('available')">
          <div class="stat-icon available">
            <span>✅</span>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.available }}</div>
            <div class="stat-label">可用车辆</div>
          </div>
        </div>
        
        <div class="stat-card" :class="{ 'clickable': true }" @click="filterByStatus('in_use')">
          <div class="stat-icon in-use">
            <span>🚗</span>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.inUse }}</div>
            <div class="stat-label">使用中</div>
          </div>
        </div>
        
        <div class="stat-card" :class="{ 'clickable': true }" @click="filterByStatus('maintenance')">
          <div class="stat-icon maintenance">
            <span>🔧</span>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.maintenance }}</div>
            <div class="stat-label">维修中</div>
          </div>
        </div>
        
        <div class="stat-card" :class="{ 'clickable': true }" @click="filterByStatus('reserved')">
          <div class="stat-icon reserved">
            <span>📅</span>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.reserved }}</div>
            <div class="stat-label">已预约</div>
          </div>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索车牌号、品牌、型号..." 
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="filter-group">
          <select v-model="selectedStatus" @change="handleFilter" class="filter-select">
            <option value="all">全部状态</option>
            <option value="available">可用</option>
            <option value="in_use">使用中</option>
            <option value="maintenance">维修中</option>
            <option value="reserved">已预约</option>
            <option value="unavailable">停用</option>
          </select>
          
          <select v-model="selectedType" @change="handleFilter" class="filter-select">
            <option value="all">全部车型</option>
            <option value="small">小型车</option>
            <option value="business">商务车</option>
            <option value="coach">大客车</option>
          </select>
        </div>
        
        <button @click="showAddVehicleDialog = true" class="btn btn-primary">
          <span>➕</span>
          <span>添加车辆</span>
        </button>
      </div>

      <!-- 车辆列表 -->
      <div class="vehicles-container">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="filteredVehicles.length === 0" class="empty-state">
          <div class="empty-icon">🚗</div>
          <h4>暂无车辆信息</h4>
          <p v-if="searchQuery">未找到匹配的车辆</p>
          <button @click="resetFilters" class="btn btn-outline">重置筛选条件</button>
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
              <div class="vehicle-plate">{{ vehicle.license_plate }}</div>
              <div class="vehicle-status" :class="vehicle.status">
                {{ getStatusText(vehicle.status) }}
              </div>
            </div>
            
            <div class="vehicle-info">
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">品牌型号</span>
                  <span class="info-value">{{ vehicle.brand }} {{ vehicle.model }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">车型</span>
                  <span class="info-value">{{ getVehicleTypeText(vehicle.vehicle_type) }}</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">当前司机</span>
                  <span class="info-value">{{ vehicle.driver_name || '未分配' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">座位数</span>
                  <span class="info-value">{{ vehicle.capacity || 5 }}座</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">车龄</span>
                  <span class="info-value">{{ vehicle.purchase_date ? calculateAge(vehicle.purchase_date) : '未知' }}</span>
                </div>
                
              </div>
            </div>
            
            <div class="vehicle-actions">
              <button 
                @click.stop="updateVehicleStatus(vehicle, 'available')" 
                v-if="vehicle.status !== 'available'"
                class="btn-action available"
                title="设为可用"
              >
                ✅
              </button>
              <button 
                @click.stop="updateVehicleStatus(vehicle, 'maintenance')" 
                v-if="vehicle.status !== 'maintenance'"
                class="btn-action maintenance"
                title="送修"
              >
                🔧
              </button>
              <button 
                @click.stop="showEditVehicle(vehicle)" 
                class="btn-action edit"
                title="编辑"
              >
                ✏️
              </button>
              <button 
                @click.stop="confirmDeleteVehicle(vehicle)" 
                v-if="canDeleteVehicle(vehicle)"
                class="btn-action delete"
                title="删除"
              >
                🗑️
              </button>
            </div>
            
           
          </div>
        </div>
        
        <!-- 分页 -->
        <div v-if="filteredVehicles.length > 0" class="pagination">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1" 
            class="pagination-btn"
          >
            上一页
          </button>
          
          <div class="page-numbers">
            <span v-for="page in visiblePages" 
                  :key="page"
                  @click="goToPage(page)"
                  :class="{ active: page === currentPage, 'ellipsis': page === '...' }"
                  class="page-number">
              {{ page }}
            </span>
          </div>
          
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages" 
            class="pagination-btn"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑车辆对话框 -->
    <div v-if="showAddVehicleDialog || showEditDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ isEditing ? '编辑车辆信息' : '添加新车辆' }}</h3>
          <button @click="closeDialog" class="close-btn">×</button>
        </div>
        
        <div class="dialog-body">
          <form @submit.prevent="saveVehicle">
            <div class="form-grid">
              <div class="form-group">
                <label>车牌号 *</label>
                <input 
                  v-model="formData.license_plate" 
                  type="text" 
                  required 
                  placeholder="请输入车牌号"
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>车辆类型 *</label>
                <select v-model="formData.vehicle_type" required class="form-select">
                  <option value="small">小型车</option>
                  <option value="business">商务车</option>
                  <option value="coach">大客车</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>品牌 *</label>
                <input 
                  v-model="formData.brand" 
                  type="text" 
                  required 
                  placeholder="车辆品牌"
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>型号 *</label>
                <input 
                  v-model="formData.model" 
                  type="text" 
                  required 
                  placeholder="车辆型号"
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>座位数 *</label>
                <input 
                  v-model="formData.seat_count" 
                  type="number" 
                  min="2" 
                  max="60" 
                  required 
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>颜色</label>
                <input 
                  v-model="formData.color" 
                  type="text" 
                  placeholder="车辆颜色"
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>购置日期</label>
                <input 
                  v-model="formData.purchase_date" 
                  type="date" 
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>购买价格</label>
                <input 
                  v-model="formData.purchase_price" 
                  type="number" 
                  placeholder="元"
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>当前状态</label>
                <select v-model="formData.status" class="form-select">
                  <option value="available">可用</option>
                  <option value="in_use">使用中</option>
                  <option value="maintenance">维修中</option>
                  <option value="reserved">已预约</option>
                  <option value="unavailable">停用</option>
                </select>
              </div>
              
              <div class="form-group full-width">
                <label>车辆描述</label>
                <textarea 
                  v-model="formData.description" 
                  rows="3" 
                  placeholder="车辆特点、配置等信息"
                  class="form-textarea"
                ></textarea>
              </div>
            </div>
            
            <div class="dialog-actions">
              <button type="button" @click="closeDialog" class="btn btn-outline">
                取消
              </button>
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? '保存修改' : '添加车辆' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 车辆详情对话框 -->
    <div v-if="showDetailDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-content detail-dialog" @click.stop>
        <div class="dialog-header">
          <h3>车辆详情</h3>
          <button @click="closeDialog" class="close-btn">×</button>
        </div>
        
        <div class="dialog-body">
          <div v-if="selectedVehicle" class="vehicle-detail">
            <div class="detail-header">
              <div class="detail-plate">{{ selectedVehicle.license_plate }}</div>
              <div class="detail-status" :class="selectedVehicle.status">
                {{ getStatusText(selectedVehicle.status) }}
              </div>
            </div>
            
            <div class="detail-info-grid">
              <div class="detail-item">
                <span class="detail-label">品牌型号</span>
                <span class="detail-value">{{ selectedVehicle.brand }} {{ selectedVehicle.model }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">车辆类型</span>
                <span class="detail-value">{{ getVehicleTypeText(selectedVehicle.vehicle_type) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">座位数</span>
                <span class="detail-value">{{ selectedVehicle.capacity }}座</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">颜色</span>
                <span class="detail-value">{{ selectedVehicle.color || '未设置' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">车龄</span>
                <span class="detail-value">{{ selectedVehicle.purchase_date ? calculateAge(selectedVehicle.purchase_date) : '未知' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">购买价格</span>
                <span class="detail-value">{{ selectedVehicle.purchase_price ? selectedVehicle.purchase_price + '元' : '未知' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">当前司机</span>
                <span class="detail-value">{{ selectedVehicle.driver_name || '未分配' }}</span>
              </div>
              
              
              <div class="detail-item full-width">
                <span class="detail-label">车辆描述</span>
                <span class="detail-value">{{ selectedVehicle.description || '无描述' }}</span>
              </div>
              
              
            </div>
            
            <div class="detail-actions">
              
              <button 
                @click="updateVehicleStatus(selectedVehicle, 'maintenance')" 
                v-if="selectedVehicle.status !== 'maintenance'"
                class="btn btn-warning"
              >
                🔧 送修登记
              </button>
              <button 
                @click="updateVehicleStatus(selectedVehicle, 'unavailable')" 
                v-if="selectedVehicle.status !== 'unavailable'"
                class="btn btn-secondary"
              >
                ⏸️ 停用车辆
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ManagerVehicles',
  data() {
    return {
      user: {},
      fleetInfo: null,
      vehicles: [],
      filteredVehicles: [],
      loading: false,
      searchQuery: '',
      selectedStatus: 'all',
      selectedType: 'all',
      currentPage: 1,
      pageSize: 12,
      totalPages: 1,
      
      showAddVehicleDialog: false,
      showEditDialog: false,
      showDetailDialog: false,
      isEditing: false,
      
      formData: {
        license_plate: '',
        vehicle_type: 'small',
        brand: '',
        model: '',
        capacity: 5, // 改为 capacity
        color: '',
        year: new Date().getFullYear(),
        purchase_date: '',
        purchase_price: '',
        fuel_type: 'gasoline',
        current_mileage: 0,
        status: 'available',
        description: ''
      },
      
      selectedVehicle: null,
      
      stats: {
        available: 0,
        inUse: 0,
        maintenance: 0,
        reserved: 0,
        total: 0
      }
    };
  },
  computed: {
    userInitial() {
      return this.user.real_name ? this.user.real_name.charAt(0).toUpperCase() : 'M';
    },
    
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        } else if (current >= total - 3) {
          pages.push(1);
          pages.push('...');
          for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = current - 1; i <= current + 1; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        }
      }
      
      return pages;
    }
  },
  mounted() {
    this.loadUserInfo();
    this.loadFleetInfo();
    this.loadVehicles();
  },
  methods: {
    // 在 methods 中添加
  canDeleteVehicle(vehicle) {
  // 检查用户权限
  const user = this.user;
  console.log('👤 用户信息:', user);
  console.log('🚗 车辆信息:', {
    status: vehicle.status,
    fleet_id: vehicle.fleet_id,
    license_plate: vehicle.license_plate
  });
  console.log('🏎️ 车队信息:', this.fleetInfo);
  
  // 管理员权限
  if (user.role === 'admin') {
    // 管理员可以删除任何停用状态的车辆
    const canDelete = vehicle.status === 'unavailable' || 
                     vehicle.status === 'inactive' ||
                     vehicle.status === '停用' ||  // 如果状态显示为中文
                     vehicle.status === 'disabled';  // 其他可能的状态
    console.log('👑 管理员删除权限:', canDelete);
    return canDelete;
  }
  
  // 车队队长权限
  if (user.role === 'manager') {
    // 检查车辆是否属于当前车队
    const isSameFleet = vehicle.fleet_id === this.fleetInfo?.fleet_id ||
                       vehicle.fleet_id === user.fleet_id;
    
    // 检查车辆状态是否为停用
    const isUnavailable = vehicle.status === 'unavailable' || 
                         vehicle.status === 'inactive' ||
                         vehicle.status === '停用' ||
                         vehicle.status === 'disabled';
    
    const canDelete = isSameFleet && isUnavailable;
    console.log('👨‍✈️ 队长删除权限:', {
      isSameFleet,
      isUnavailable,
      canDelete,
      vehicleFleetId: vehicle.fleet_id,
      userFleetId: user.fleet_id,
      fleetInfoFleetId: this.fleetInfo?.fleet_id
    });
    return canDelete;
  }
  
  console.log('❌ 无删除权限');
  return false;
},
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
    
    async loadVehicles() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/manager/vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.vehicles = result.data || [];
            this.filterVehicles();
            this.calculateStats();
          }
        }
      } catch (error) {
        console.error('加载车辆列表失败:', error);
        this.loadMockVehicles();
      } finally {
        this.loading = false;
      }
    },
    
    loadMockVehicles() {
      this.vehicles = [
        {
          vehicle_id: 1,
          license_plate: '京A88888',
          vehicle_type: 'small',
          brand: '丰田',
          model: '凯美瑞',
          seat_count: 5,
          color: '黑色',
          current_location: '公司停车场',
          status: 'available',
          driver_name: '王师傅',
          last_maintenance: '2024-01-15',
          next_maintenance: '2024-07-15',
          purchase_date: '2022-05-10',
          purchase_price: '200000',
          description: '公司商务接待用车'
        },
        {
          vehicle_id: 2,
          license_plate: '京A66666',
          vehicle_type: 'small',
          brand: '大众',
          model: '帕萨特',
          seat_count: 5,
          color: '白色',
          current_location: '市区',
          status: 'in_use',
          driver_name: '李师傅',
          last_maintenance: '2024-02-20',
          next_maintenance: '2024-08-20',
          purchase_date: '2021-08-15',
          purchase_price: '180000',
          description: '日常通勤用车'
        },
        {
          vehicle_id: 3,
          license_plate: '京A77777',
          vehicle_type: 'business',
          brand: '奔驰',
          model: 'V260',
          seat_count: 7,
          color: '银色',
          current_location: '公司停车场',
          status: 'available',
          driver_name: '张师傅',
          last_maintenance: '2024-01-30',
          next_maintenance: '2024-07-30',
          purchase_date: '2023-03-20',
          purchase_price: '450000',
          description: '重要客户接待用车'
        },
        {
          vehicle_id: 4,
          license_plate: '京A55555',
          vehicle_type: 'coach',
          brand: '宇通',
          model: 'ZK6128',
          seat_count: 53,
          color: '蓝色',
          current_location: '维修厂',
          status: 'maintenance',
          driver_name: '赵师傅',
          last_maintenance: '2023-12-10',
          next_maintenance: '2024-06-10',
          purchase_date: '2020-11-05',
          purchase_price: '850000',
          description: '员工班车'
        }
      ];
      this.filterVehicles();
      this.calculateStats();
    },
    
    filterVehicles() {
      let filtered = [...this.vehicles];
      
      // 状态筛选
      if (this.selectedStatus !== 'all') {
        filtered = filtered.filter(v => v.status === this.selectedStatus);
      }
      
      // 车型筛选
      if (this.selectedType !== 'all') {
        filtered = filtered.filter(v => v.vehicle_type === this.selectedType);
      }
      
      // 搜索筛选
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(v => 
          v.license_plate.toLowerCase().includes(query) ||
          v.brand.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query) ||
          (v.driver_name && v.driver_name.toLowerCase().includes(query))
        );
      }
      
      // 计算分页
      this.totalPages = Math.ceil(filtered.length / this.pageSize);
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      
      this.filteredVehicles = filtered.slice(start, end);
    },
    
    calculateStats() {
      this.stats = {
        available: this.vehicles.filter(v => v.status === 'available').length,
        inUse: this.vehicles.filter(v => v.status === 'in_use').length,
        maintenance: this.vehicles.filter(v => v.status === 'maintenance').length,
        reserved: this.vehicles.filter(v => v.status === 'reserved').length,
        total: this.vehicles.length
      };
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
    reserved: '已预约',
    unavailable: '停用',  // 数据库中的 unavailable 对应前端的"停用"
  };
  return statusMap[status] || status;
},
    
    calculateAge(purchaseDate) {
      const purchase = new Date(purchaseDate);
      const now = new Date();
      const years = now.getFullYear() - purchase.getFullYear();
      const months = now.getMonth() - purchase.getMonth();
      
      if (years > 0) {
        return `${years}年${months > 0 ? `${months}个月` : ''}`;
      }
      return `${months}个月`;
    },
    
    handleSearch() {
      this.currentPage = 1;
      this.filterVehicles();
    },
    
    handleFilter() {
      this.currentPage = 1;
      this.filterVehicles();
    },
    
    filterByStatus(status) {
      this.selectedStatus = status;
      this.currentPage = 1;
      this.filterVehicles();
    },
    
    resetFilters() {
      this.searchQuery = '';
      this.selectedStatus = 'all';
      this.selectedType = 'all';
      this.currentPage = 1;
      this.filterVehicles();
    },
    
    goToPage(page) {
      if (page === '...') return;
      this.currentPage = page;
      this.filterVehicles();
    },
    
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.filterVehicles();
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.filterVehicles();
      }
    },
    
    viewVehicleDetail(vehicle) {
      this.selectedVehicle = vehicle;
      this.showDetailDialog = true;
    },
    
    showAddVehicle() {
      this.resetForm();
      this.isEditing = false;
      this.showAddVehicleDialog = true;
    },
    
    showEditVehicle(vehicle) {
      this.selectedVehicle = vehicle;
      this.isEditing = true;
      this.formData = { ...vehicle };
      this.showAddVehicleDialog = true;
    },
    
    resetForm() {
      this.formData = {
        license_plate: '',
        vehicle_type: 'small',
        brand: '',
        model: '',
        seat_count: 5,
        color: '',
        purchase_date: '',
        purchase_price: '',
        status: 'available',
        description: ''
      };
    },
    
    async saveVehicle() {
  try {
    console.log('📤 发送的车辆数据:', this.formData);
    
    const token = localStorage.getItem('token');
    const method = this.isEditing ? 'PUT' : 'POST';
    const url = this.isEditing 
      ? `http://localhost:3000/api/vehicles/${this.selectedVehicle.vehicle_id}`
      : 'http://localhost:3000/api/vehicles';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...this.formData,
        fleet_id: this.fleetInfo?.fleet_id
      })
    });
    
    console.log('📥 响应状态:', response.status);
    
    const result = await response.json();
    console.log('📥 响应数据:', result);
    
    if (response.ok && result.success) {
      alert(this.isEditing ? '车辆信息更新成功' : '车辆添加成功');
      this.closeDialog();
      this.loadVehicles();
    } else {
      alert(result.message || '操作失败');
    }
    
  } catch (error) {
    console.error('❌ 前端错误:', error);
    alert('网络错误，请检查控制台');
  }
},
    
   async updateVehicleStatus(vehicle, status) {
  const displayStatus =this.getStatusText(status);
  if (!confirm(`确定要将车辆 ${vehicle.license_plate} 的状态改为"${displayStatus}"吗？`)) {
    return;
  }
  
  try {
    console.log('🔄 更新车辆状态:', { 
      vehicleId: vehicle.vehicle_id, 
      status, 
      currentStatus: vehicle.status 
    });
    
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/vehicles/${vehicle.vehicle_id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    console.log('📥 响应状态:', response.status);
    console.log('📥 响应状态文本:', response.statusText);
    
    const result = await response.json();
    console.log('📥 响应数据:', result);
    
    if (response.ok && result.success) {
      alert('状态更新成功');
      this.loadVehicles();
      this.closeDialog();
    } else {
      alert(result.message || '更新失败');
    }
    
  } catch (error) {
    console.error('❌ 更新车辆状态失败:', error);
    alert('网络错误，请检查控制台');
  }
},
    
    confirmDeleteVehicle(vehicle) {
  const vehicleInfo = `${vehicle.license_plate} (${vehicle.brand} ${vehicle.model})`;
  
  if (confirm(`确定要删除车辆 ${vehicleInfo} 吗？\n\n此操作不可恢复！`)) {
    this.deleteVehicle(vehicle.vehicle_id);
  }
},
    
    async deleteVehicle(vehicleId) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('车辆删除成功');
            this.loadVehicles();
          }
        }
      } catch (error) {
        console.error('删除车辆失败:', error);
        alert('删除失败，请稍后重试');
      }
    },
    
    closeDialog() {
      this.showAddVehicleDialog = false;
      this.showEditDialog = false;
      this.showDetailDialog = false;
      this.selectedVehicle = null;
      this.resetForm();
    },
    
    refreshData() {
      this.loadVehicles();
    },
    
    goToDashboard() {
      this.$router.push('/manager');
    }
  }
};
</script>

<style scoped>
.vehicle-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 复用已有的头部样式 */
.header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.user-section {
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
  transition: transform 0.3s ease;
}

.avatar-container:hover {
  transform: scale(1.05);
}

.user-info h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
  line-height: 1.3;
}

.user-role {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #cbd5e1;
  font-weight: 500;
  background: rgba(100, 116, 139, 0.3);
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
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

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 20px rgba(255, 255, 255, 0.1);
}

.btn-refresh {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-refresh:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.btn-outline {
  background: transparent;
  border: 2px solid #e2e8f0;
  color: #475569;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
}

.btn-warning:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
}

/* 主要内容区域 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #f1f5f9;
  transition: all 0.4s ease;
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.stat-card.available:hover {
  border-color: #10b981;
  box-shadow: 0 16px 40px rgba(16, 185, 129, 0.15);
}

.stat-card.in-use:hover {
  border-color: #3b82f6;
  box-shadow: 0 16px 40px rgba(59, 130, 246, 0.15);
}

.stat-card.maintenance:hover {
  border-color: #f59e0b;
  box-shadow: 0 16px 40px rgba(245, 158, 11, 0.15);
}

.stat-card.reserved:hover {
  border-color: #8b5cf6;
  box-shadow: 0 16px 40px rgba(139, 92, 246, 0.15);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.stat-icon.available {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.stat-icon.in-use {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.stat-icon.maintenance {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.stat-icon.reserved {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.stat-details {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 6px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* 操作栏 */
.action-bar {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 14px 20px 14px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #f8fafc;
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
  font-size: 16px;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 14px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  color: #475569;
  min-width: 140px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 车辆容器 */
.vehicles-container {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f1f5f9;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  border: 2px dashed #e2e8f0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

.empty-state h4 {
  font-size: 20px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 12px 0;
}

.empty-state p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 24px 0;
}

/* 车辆网格 */
.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.vehicle-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.vehicle-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.vehicle-card.available {
  border-left: 6px solid #10b981;
}

.vehicle-card.in_use {
  border-left: 6px solid #3b82f6;
}

.vehicle-card.maintenance {
  border-left: 6px solid #f59e0b;
}

.vehicle-card.reserved {
  border-left: 6px solid #8b5cf6;
}

.vehicle-card.inactive {
  border-left: 6px solid #6b7280;
  opacity: 0.8;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #f8fafc;
  border-bottom: 2px solid #f1f5f9;
}

.vehicle-plate {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  font-family: monospace;
}

.vehicle-status {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.vehicle-status.available {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.vehicle-status.in_use {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
}

.vehicle-status.maintenance {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.vehicle-status.reserved {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.vehicle-status.inactive {
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  color: white;
}

.vehicle-info {
  padding: 24px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.vehicle-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 2px solid #f1f5f9;
}

.btn-action {
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  color: #64748b;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-action.available:hover {
  background: #10b981;
  color: white;
}

.btn-action.maintenance:hover {
  background: #f59e0b;
  color: white;
}

.btn-action.edit:hover {
  background: #3b82f6;
  color: white;
}

.btn-action.delete:hover {
  background: #ef4444;
  color: white;
}

.vehicle-footer {
  padding: 16px 24px;
  background: #f1f5f9;
  border-top: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
}

.last-maintenance,
.next-maintenance {
  display: flex;
  align-items: center;
  gap: 6px;
}

.last-maintenance::before {
  content: '🛠️';
}

.next-maintenance::before {
  content: '📅';
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding-top: 32px;
  border-top: 2px solid #f1f5f9;
}

.pagination-btn {
  padding: 12px 24px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.pagination-btn:hover:not(:disabled) {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number:hover:not(.ellipsis) {
  background: #f1f5f9;
  color: #3b82f6;
}

.page-number.active {
  background: #3b82f6;
  color: white;
}

.page-number.ellipsis {
  cursor: default;
}

/* 对话框 */
.dialog-overlay {
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
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
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

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-bottom: 2px solid #f1f5f9;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  z-index: 1;
}

.dialog-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #ef4444;
  color: white;
}

.dialog-body {
  padding: 32px;
}

/* 表单样式 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f1f5f9;
}

/* 详情对话框 */
.detail-dialog {
  max-width: 600px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.detail-plate {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  font-family: monospace;
}

.detail-status {
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  line-height: 1.5;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .vehicles-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 1024px) {
  .header {
    padding: 20px;
  }
  
  .main-content {
    padding: 24px;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .search-box {
    min-width: 100%;
  }
  
  .filter-group {
    width: 100%;
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .user-section {
    flex-direction: column;
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .vehicles-grid {
    grid-template-columns: 1fr;
  }
  
  .info-row {
    grid-template-columns: 1fr;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-info-grid {
    grid-template-columns: 1fr;
  }
  
  .dialog-content {
    margin: 20px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .detail-actions {
    flex-direction: column;
  }
}
</style>