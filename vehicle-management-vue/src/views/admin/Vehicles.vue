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
        <button 
          v-if="selectedVehicles.length > 0" 
          @click="showBatchDeleteConfirm" 
          class="delete-btn batch"
        >
          <span>🗑️</span>
          <span>批量删除 ({{ selectedVehicles.length }})</span>
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
            <option value="unavailable">不可用</option>
          </select>
        </div>
        <div class="filter-group">
          <label>车型：</label>
          <select v-model="filterType" class="filter-select">
            <option value="all">全部车型</option>
            <option value="small">小型车</option>
            <option value="business">商务车</option>
            <option value="coach">大客车</option>
            <option value="truck">货车</option>
            <option value="van">面包车</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 批量操作提示 -->
    <div v-if="selectedVehicles.length > 0" class="batch-action-bar">
      <div class="batch-info">
        <span class="selected-count">已选择 {{ selectedVehicles.length }} 辆车辆</span>
        <div class="batch-actions">
          <button @click="clearSelection" class="cancel-selection-btn">取消选择</button>
          <button @click="showBatchDeleteConfirm" class="batch-delete-btn">
            <span>🗑️</span>
            批量删除
          </button>
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
          :class="[vehicle.status, { selected: isSelected(vehicle.vehicle_id) }]"
          @click="toggleSelect(vehicle, $event)"
        >
          <div class="vehicle-header">
            <div class="selection-checkbox" @click.stop="toggleSelect(vehicle, $event)">
              <div class="checkbox" :class="{ checked: isSelected(vehicle.vehicle_id) }">
                <span v-if="isSelected(vehicle.vehicle_id)">✓</span>
              </div>
            </div>
            
            <div class="vehicle-badge" :class="vehicle.status">
              {{ getStatusText(vehicle.status) }}
            </div>
            
            <div class="vehicle-actions">
              <button @click.stop="editVehicle(vehicle)" class="action-btn edit">编辑</button>
              <button @click.stop="changeStatus(vehicle)" class="action-btn status">状态</button>
              <button 
                @click.stop="showDeleteConfirm(vehicle)" 
                class="action-btn delete"
                :disabled="!canDeleteVehicle(vehicle)"
              >
                删除
              </button>
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
              <span class="info-label">燃油类型：</span>
              <span class="info-value">{{ getFuelTypeText(vehicle.fuel_type) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">购买日期：</span>
              <span class="info-value">{{ formatDate(vehicle.purchase_date) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">购买价格：</span>
              <span class="info-value">{{ vehicle.purchase_price ? `¥${vehicle.purchase_price}` : '--' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前司机：</span>
              <span class="info-value">{{ vehicle.current_driver_name || '未分配' }}</span>
            </div>
          </div>

          <div class="vehicle-footer">
            <div class="description" v-if="vehicle.description">
              备注：{{ vehicle.description }}
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
              <option value="truck">货车</option>
              <option value="van">面包车</option>
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
        
        <div class="form-row">
          <div class="form-group">
            <label>购买日期</label>
            <input 
              type="date" 
              v-model="vehicleForm.purchase_date"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>购买价格（元）</label>
            <input 
              type="number" 
              v-model="vehicleForm.purchase_price"
              placeholder="购买价格"
              class="form-input"
              step="0.01"
              min="0"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>当前里程（km）</label>
            <input 
              type="number" 
              v-model="vehicleForm.current_mileage"
              placeholder="当前里程"
              class="form-input"
              step="0.01"
              min="0"
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
              <option value="natural_gas">天然气</option>
            </select>
          </div>
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
            <option value="unavailable">不可用</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>当前司机</label>
          <select v-model="vehicleForm.current_driver_id" class="form-select">
            <option value="">请选择司机</option>
            <option v-for="driver in drivers" :key="driver.user_id" :value="driver.user_id">
              {{ driver.real_name }} ({{ driver.driver_license_number || '无驾照' }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>车辆描述</label>
          <textarea 
            v-model="vehicleForm.description"
            placeholder="请输入车辆描述"
            rows="3"
            class="form-textarea"
          ></textarea>
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

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content delete-modal">
        <div class="delete-icon">⚠️</div>
        <h3>{{ isBatchDelete ? '批量删除确认' : '删除确认' }}</h3>
        
        <div v-if="isBatchDelete" class="delete-content">
          <p>确定要删除选中的 <strong>{{ selectedVehicles.length }}</strong> 辆车辆吗？</p>
          <div class="selected-vehicles-list">
            <div 
              v-for="vehicle in selectedVehicles" 
              :key="vehicle.vehicle_id"
              class="selected-vehicle-item"
            >
              <span class="license-plate">{{ vehicle.license_plate }}</span>
              <span class="vehicle-info">{{ vehicle.brand }} {{ vehicle.model }}</span>
            </div>
          </div>
        </div>
        <div v-else class="delete-content">
          <p>确定要删除车辆 <strong>{{ selectedVehicle?.license_plate }}</strong> 吗？</p>
          <div class="vehicle-detail">
            <p>品牌型号：{{ selectedVehicle?.brand }} {{ selectedVehicle?.model }}</p>
            <p>当前状态：{{ getStatusText(selectedVehicle?.status) }}</p>
          </div>
        </div>
        
        <p class="warning-text">⚠️ 删除后将无法恢复，请谨慎操作！</p>
        
        <div class="delete-actions">
          <button @click="cancelDelete" class="cancel-btn">取消</button>
          <button @click="confirmDelete" class="delete-confirm-btn">
            <span v-if="deleting">删除中...</span>
            <span v-else>确认删除</span>
          </button>
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
      drivers: [],
      loading: false,
      
      // 筛选
      searchKeyword: '',
      filterStatus: 'all',
      filterType: 'all',
      
      // 选择管理
      selectedVehicles: [],
      
      // 统计数据
      stats: {
        availableCount: 0,
        inUseCount: 0,
        maintenanceCount: 0,
        reservedCount: 0,
        unavailableCount: 0
      },
      
      // 车辆模态框
      showVehicleModal: false,
      showStatusModal: false,
      showDeleteModal: false,
      isEditing: false,
      selectedVehicle: null,
      isBatchDelete: false,
      deleting: false,
      
      // 车辆表单
      vehicleForm: {
        license_plate: '',
        vehicle_type: '',
        fleet_id: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        capacity: '',
        purchase_date: '',
        purchase_price: '',
        description: '',
        status: 'available',
        current_mileage: '0',
        fuel_type: '',
        current_driver_id: ''
      },
      
      // 状态变更
      newStatus: '',
      maintenanceReason: '',
      estimatedFinishTime: '',
      
      statusOptions: [
        { value: 'available', label: '可用', icon: '✅', description: '车辆正常，可以安排使用' },
        { value: 'in_use', label: '使用中', icon: '🚗', description: '车辆正在执行任务' },
        { value: 'maintenance', label: '维修中', icon: '🔧', description: '车辆正在维修保养' },
        { value: 'reserved', label: '已预约', icon: '📅', description: '车辆已被预约' },
        { value: 'unavailable', label: '不可用', icon: '❌', description: '车辆暂时无法使用' }
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
    this.loadDrivers();
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
            { fleet_id: 3, fleet_name: '大客车队' },
            { fleet_id: 4, fleet_name: '货车队' },
            { fleet_id: 5, fleet_name: '面包车队' }
          ];
        }
      } catch (error) {
        console.error('加载车队列表失败:', error);
        this.fleets = [
          { fleet_id: 1, fleet_name: '小车队' },
          { fleet_id: 2, fleet_name: '商务车队' },
          { fleet_id: 3, fleet_name: '大客车队' },
          { fleet_id: 4, fleet_name: '货车队' },
          { fleet_id: 5, fleet_name: '面包车队' }
        ];
      }
    },
    
    async loadDrivers() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/admin/drivers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.drivers = result.data || [];
          }
        } else {
          this.drivers = [
            { user_id: 1, real_name: '张三', driver_license_number: 'A12345678' },
            { user_id: 2, real_name: '李四', driver_license_number: 'B87654321' },
            { user_id: 3, real_name: '王五', driver_license_number: 'C12348765' }
          ];
        }
      } catch (error) {
        console.error('加载司机列表失败:', error);
        this.drivers = [
          { user_id: 1, real_name: '张三', driver_license_number: 'A12345678' },
          { user_id: 2, real_name: '李四', driver_license_number: 'B87654321' },
          { user_id: 3, real_name: '王五', driver_license_number: 'C12348765' }
        ];
      }
    },
    
    calculateStats() {
      this.stats = {
        availableCount: this.vehicles.filter(v => v.status === 'available').length,
        inUseCount: this.vehicles.filter(v => v.status === 'in_use').length,
        maintenanceCount: this.vehicles.filter(v => v.status === 'maintenance').length,
        reservedCount: this.vehicles.filter(v => v.status === 'reserved').length,
        unavailableCount: this.vehicles.filter(v => v.status === 'unavailable').length
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
          purchase_date: '2022-03-15',
          purchase_price: 420000.00,
          current_driver_name: '张三',
          description: '公司高管用车'
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
          purchase_date: '2021-06-10',
          purchase_price: 480000.00,
          current_driver_name: '李四',
          description: '商务接待用车'
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
          purchase_date: '2023-02-20',
          purchase_price: 680000.00,
          current_driver_name: '',
          description: '团队出行用车'
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
          purchase_date: '2020-08-05',
          purchase_price: 980000.00,
          current_driver_name: '',
          description: '公司班车'
        },
        {
          vehicle_id: 5,
          license_plate: '京B12345',
          vehicle_type: 'truck',
          brand: '解放',
          model: 'J6P',
          color: '红色',
          year: 2019,
          capacity: 2,
          current_mileage: 185600.5,
          fuel_type: 'diesel',
          status: 'available',
          fleet_name: '货车队',
          purchase_date: '2019-11-30',
          purchase_price: 350000.00,
          current_driver_name: '王五',
          description: '货物运输车辆'
        },
        {
          vehicle_id: 6,
          license_plate: '京C67890',
          vehicle_type: 'van',
          brand: '金杯',
          model: '海狮',
          color: '白色',
          year: 2021,
          capacity: 8,
          current_mileage: 75600.3,
          fuel_type: 'gasoline',
          status: 'reserved',
          fleet_name: '面包车队',
          purchase_date: '2021-04-18',
          purchase_price: 120000.00,
          current_driver_name: '',
          description: '小型货物运输'
        }
      ];
      this.calculateStats();
    },
    
    getVehicleTypeText(type) {
      const typeMap = {
        small: '小型车',
        business: '商务车',
        coach: '大客车',
        truck: '货车',
        van: '面包车'
      };
      return typeMap[type] || type;
    },
    
    getStatusText(status) {
      const statusMap = {
        available: '可用',
        in_use: '使用中',
        maintenance: '维修中',
        reserved: '已预约',
        unavailable: '不可用'
      };
      return statusMap[status] || status;
    },
    
    getFuelTypeText(fuelType) {
      const fuelMap = {
        gasoline: '汽油',
        diesel: '柴油',
        electric: '电动',
        hybrid: '混合动力',
        natural_gas: '天然气'
      };
      return fuelMap[fuelType] || fuelType || '--';
    },
    
    formatDate(date) {
      if (!date) return '--';
      return new Date(date).toLocaleDateString('zh-CN');
    },
    
    // 选择管理方法
    toggleSelect(vehicle, event) {
      event.stopPropagation();
      const vehicleId = vehicle.vehicle_id;
      const index = this.selectedVehicles.findIndex(v => v.vehicle_id === vehicleId);
      
      if (index === -1) {
        this.selectedVehicles.push(vehicle);
      } else {
        this.selectedVehicles.splice(index, 1);
      }
    },
    
    isSelected(vehicleId) {
      return this.selectedVehicles.some(v => v.vehicle_id === vehicleId);
    },
    
    clearSelection() {
      this.selectedVehicles = [];
    },
    
    // 删除相关方法
    canDeleteVehicle(vehicle) {
      // 检查车辆是否可以删除
      // 使用中、已预约的车辆不能删除
      return vehicle.status !== 'in_use' && vehicle.status !== 'reserved';
    },
    
    showDeleteConfirm(vehicle) {
      if (!this.canDeleteVehicle(vehicle)) {
        alert('该车辆正在使用中或已被预约，无法删除');
        return;
      }
      
      this.selectedVehicle = vehicle;
      this.isBatchDelete = false;
      this.showDeleteModal = true;
    },
    
    showBatchDeleteConfirm() {
      // 检查是否有不能删除的车辆
      const cannotDeleteVehicles = this.selectedVehicles.filter(v => !this.canDeleteVehicle(v));
      if (cannotDeleteVehicles.length > 0) {
        const vehicleNames = cannotDeleteVehicles.map(v => v.license_plate).join(', ');
        alert(`以下车辆无法删除：${vehicleNames}\n原因：车辆正在使用中或已被预约`);
        return;
      }
      
      this.isBatchDelete = true;
      this.showDeleteModal = true;
    },
    
    async confirmDelete() {
      this.deleting = true;
      
      try {
        const token = localStorage.getItem('token');
        
        if (this.isBatchDelete) {
          // 批量删除
          const vehicleIds = this.selectedVehicles.map(v => v.vehicle_id);
          
          // 如果有后端批量删除接口
          const response = await fetch('http://localhost:3000/api/vehicles/batch-delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ vehicle_ids: vehicleIds })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              // 从前端列表中移除已删除的车辆
              this.vehicles = this.vehicles.filter(v => !vehicleIds.includes(v.vehicle_id));
              this.calculateStats();
              alert(`成功删除 ${vehicleIds.length} 辆车辆`);
            }
          } else {
            // 如果没有批量删除接口，逐个删除
            for (const vehicleId of vehicleIds) {
              await this.deleteSingleVehicle(vehicleId, token);
            }
            alert(`成功删除 ${vehicleIds.length} 辆车辆`);
          }
        } else {
          // 单个删除
          await this.deleteSingleVehicle(this.selectedVehicle.vehicle_id, token);
          alert('车辆删除成功');
        }
        
        this.showDeleteModal = false;
        this.selectedVehicle = null;
        this.selectedVehicles = [];
        
      } catch (error) {
        console.error('删除车辆失败:', error);
        alert('删除失败：' + error.message);
      } finally {
        this.deleting = false;
      }
    },
    
    async deleteSingleVehicle(vehicleId, token) {
      try {
        const response = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 从前端列表中移除已删除的车辆
            const index = this.vehicles.findIndex(v => v.vehicle_id === vehicleId);
            if (index !== -1) {
              this.vehicles.splice(index, 1);
              this.calculateStats();
            }
          }
        } else {
          throw new Error('删除失败');
        }
      } catch (error) {
        console.error(`删除车辆 ${vehicleId} 失败:`, error);
        throw error;
      }
    },
    
    cancelDelete() {
      this.showDeleteModal = false;
      this.selectedVehicle = null;
      this.isBatchDelete = false;
      this.deleting = false;
    },
    
    // 车辆表单方法
    showAddVehicle() {
      this.isEditing = false;
      this.vehicleForm = {
        license_plate: '',
        vehicle_type: '',
        fleet_id: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        capacity: '',
        purchase_date: '',
        purchase_price: '',
        description: '',
        status: 'available',
        current_mileage: '0',
        fuel_type: '',
        current_driver_id: ''
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
    
    refreshData() {
      this.clearSelection();
      this.loadVehicles();
    },
    
    resetFilters() {
      this.searchKeyword = '';
      this.filterStatus = 'all';
      this.filterType = 'all';
      this.clearSelection();
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
/* 样式保持不变，只是微调了一些地方以适应新的字段 */
.vehicle-info {
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.info-item:hover {
  background-color: #f9f9f9;
}

.info-label {
  color: #666;
  font-weight: 500;
  min-width: 100px;
}

.info-value {
  color: #333;
  font-weight: 600;
  text-align: right;
  flex: 1;
}

.vehicle-footer .description {
  font-size: 13px;
  color: #666;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #1890ff;
  margin-top: 10px;
}

/* 统计卡片微调 */
.stat-card:nth-child(5) {
  grid-column: span 2;
  justify-content: center;
}

@media (max-width: 768px) {
  .stat-card:nth-child(5) {
    grid-column: span 1;
  }
}

/* 其他样式保持不变，以下是原有样式 */

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
.refresh-btn,
.delete-btn {
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

.delete-btn {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
}

.add-btn:hover,
.refresh-btn:hover,
.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.add-btn:active,
.refresh-btn:active,
.delete-btn:active {
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

/* 批量操作提示 */
.batch-action-bar {
  background: linear-gradient(135deg, #fff2e8, #ffffff);
  border: 2px solid #ffd591;
  border-radius: 20px;
  padding: 20px 28px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 24px rgba(255, 141, 16, 0.1);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.batch-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.selected-count {
  font-size: 16px;
  font-weight: 600;
  color: #fa8c16;
  background: rgba(250, 140, 22, 0.1);
  padding: 8px 16px;
  border-radius: 12px;
}

.batch-actions {
  display: flex;
  gap: 16px;
}

.cancel-selection-btn,
.batch-delete-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-selection-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e8e8e8;
}

.batch-delete-btn {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.cancel-selection-btn:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.batch-delete-btn:hover {
  background: linear-gradient(135deg, #ff7875, #ff4d4f);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.4);
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

.stat-icon.reserved { 
  background: linear-gradient(135deg, #f9f0ff, #ffffff); 
  color: #722ed1; 
}

.stat-icon.unavailable { 
  background: linear-gradient(135deg, #fff1f0, #ffffff); 
  color: #ff4d4f; 
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
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
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

.vehicle-card.selected {
  border-color: #1890ff;
  background: linear-gradient(135deg, #f0f9ff, #ffffff);
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.2);
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

.vehicle-card.selected::before {
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

.vehicle-card.unavailable {
  border-left: 6px solid #ff4d4f;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.selection-checkbox {
  margin-right: 12px;
}

.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.checkbox.checked {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.checkbox:hover {
  border-color: #1890ff;
  transform: scale(1.1);
}

.vehicle-badge {
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex: 1;
  margin: 0 12px;
  text-align: center;
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

.vehicle-badge.unavailable {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
}

.vehicle-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: 2px solid;
  background: white;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  white-space: nowrap;
}

.action-btn.edit {
  color: #1890ff;
  border-color: #1890ff;
}

.action-btn.status {
  color: #52c41a;
  border-color: #52c41a;
}

.action-btn.delete {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.action-btn.delete:disabled {
  color: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.action-btn:active:not(:disabled) {
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

.modal-content h3 {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

/* 删除确认模态框 */
.delete-modal {
  max-width: 500px;
  text-align: center;
}

.delete-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.delete-content {
  margin: 24px 0;
  text-align: left;
}

.selected-vehicles-list {
  max-height: 200px;
  overflow-y: auto;
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
}

.selected-vehicle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s ease;
}

.selected-vehicle-item:last-child {
  margin-bottom: 0;
}

.selected-vehicle-item:hover {
  border-color: #1890ff;
  background: #f0f9ff;
}

.license-plate {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.vehicle-info {
  font-size: 14px;
  color: #666;
}

.vehicle-detail {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  border: 2px solid #f0f0f0;
}

.vehicle-detail p {
  margin: 8px 0;
  font-size: 15px;
  color: #333;
}

.warning-text {
  color: #ff4d4f;
  font-weight: 600;
  text-align: center;
  margin: 20px 0;
  font-size: 15px;
  padding: 12px 16px;
  background: #fff2f0;
  border-radius: 12px;
  border: 2px solid #ffccc7;
}

.delete-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.delete-confirm-btn {
  flex: 1;
  padding: 16px;
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
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
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.delete-confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7875, #ff4d4f);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.4);
}

.delete-confirm-btn:disabled {
  background: linear-gradient(135deg, #bfbfbf, #8c8c8c);
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 其他模态框样式 */
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
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
  
  .action-left {
    flex-direction: column;
    width: 100%;
  }
  
  .action-right {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
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
  
  .batch-action-bar {
    flex-direction: column;
    gap: 16px;
  }
  
  .batch-info {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .batch-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .cancel-selection-btn,
  .batch-delete-btn {
    width: 100%;
  }
  
  .vehicle-header {
    flex-wrap: wrap;
  }
  
  .vehicle-actions {
    width: 100%;
    justify-content: space-between;
    margin-top: 12px;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .vehicle-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .vehicle-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .description {
    width: 100%;
    text-align: center;
  }
  
  .modal-actions,
  .delete-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .confirm-btn,
  .delete-confirm-btn {
    width: 100%;
  }
}
</style>