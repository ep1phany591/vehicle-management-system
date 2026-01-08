<template>
  <div class="fleet-management">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="icon-box"><van-icon name="shop-o" /></div>
          <div>
            <h2>车队管理中心</h2>
            <p>管理车队信息、分配车辆与司机资源</p>
          </div>
        </div>
        <div class="header-right">
          <van-button icon="plus" type="success" @click="openAddModal">
            创建新车队
          </van-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <van-row gutter="16">
        <van-col span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e3f2fd;">
              <van-icon name="shop-o" color="#1976d2" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.totalFleets }}</div>
              <div class="stat-label">车队总数</div>
            </div>
          </div>
        </van-col>
        <van-col span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e8f5e9;">
              <van-icon name="car-o" color="#2e7d32" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.totalVehicles }}</div>
              <div class="stat-label">车辆总数</div>
            </div>
          </div>
        </van-col>
        <van-col span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #fff3e0;">
              <van-icon name="friends-o" color="#f57c00" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.totalDrivers }}</div>
              <div class="stat-label">司机总数</div>
            </div>
          </div>
        </van-col>
        <van-col span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #fce4ec;">
              <van-icon name="manager-o" color="#c2185b" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.fleetsWithoutManager }}</div>
              <div class="stat-label">待指派队长</div>
            </div>
          </div>
        </van-col>
      </van-row>
    </div>

    <!-- 筛选和搜索栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <van-search
          v-model="searchQuery"
          placeholder="搜索车队名称、ID或队长..."
          shape="round"
          @search="handleSearch"
          class="search-input"
        />
        
        <van-dropdown-menu>
          <van-dropdown-item v-model="filterType" :options="fleetTypeOptions" @change="handleFilterChange" />
          <van-dropdown-item v-model="filterManager" :options="managerFilterOptions" @change="handleFilterChange" />
        </van-dropdown-menu>
      </div>
      
      <div class="filter-right">
        <van-button icon="replay" type="primary" plain @click="refreshFleets">
          刷新
        </van-button>
      </div>
    </div>

    <!-- 车队列表表格 -->
    <div class="table-container">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多车队了"
        @load="onLoad"
        :immediate-check="false"
      >
        <div class="fleet-list">
          <div 
            v-for="fleet in displayedFleets" 
            :key="fleet.fleet_id" 
            class="fleet-card"
            @click="viewFleetDetail(fleet)"
          >
            <div class="fleet-card-header">
              <div class="fleet-title">
                <h3>{{ fleet.fleet_name }}</h3>
                <van-tag :type="getFleetTypeTag(fleet.fleet_type)">
                  {{ getFleetTypeText(fleet.fleet_type) }}
                </van-tag>
              </div>
              <div class="fleet-actions">
                <van-button 
                  size="small" 
                  type="primary" 
                  plain 
                  @click.stop="openEditModal(fleet)"
                >
                  编辑
                </van-button>
                <van-button 
                  size="small" 
                  type="danger" 
                  plain 
                  @click.stop="deleteFleet(fleet.fleet_id)"
                >
                  删除
                </van-button>
              </div>
            </div>
            
            <div class="fleet-card-body">
              <div class="fleet-info">
                <div class="info-item">
                  <van-icon name="label-o" />
                  <span>车队ID: {{ fleet.fleet_id }}</span>
                </div>
                <div class="info-item" v-if="fleet.manager_id">
                  <van-icon name="manager-o" />
                  <span>队长: {{ fleet.manager_name || fleet.manager_id }}</span>
                </div>
                <div class="info-item" v-else>
                  <van-icon name="warning-o" color="#ff9800" />
                  <span style="color: #ff9800;">未指派队长</span>
                </div>
                <div class="info-item" v-if="fleet.description">
                  <van-icon name="description" />
                  <span class="description-text">{{ fleet.description }}</span>
                </div>
              </div>
              
              <div class="fleet-stats">
                <div class="stat-item">
                  <div class="stat-icon-small"><van-icon name="car-o" /></div>
                  <div class="stat-text">
                    <div class="stat-number">{{ fleet.vehicle_count || 0 }}</div>
                    <div class="stat-label">车辆</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon-small"><van-icon name="friends-o" /></div>
                  <div class="stat-text">
                    <div class="stat-number">{{ fleet.driver_count || 0 }}</div>
                    <div class="stat-label">司机</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon-small"><van-icon name="clock-o" /></div>
                  <div class="stat-text">
                    <div class="stat-date">{{ formatDate(fleet.created_at) }}</div>
                    <div class="stat-label">创建时间</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-list>
      
      <div v-if="displayedFleets.length === 0 && !loading" class="empty-state">
        <van-icon name="shop-o" size="60" color="#ccc" />
        <p>暂无车队数据</p>
        <van-button type="primary" @click="openAddModal">创建第一个车队</van-button>
      </div>
    </div>

    <!-- 添加/编辑车队模态框 -->
    <van-popup
      v-model:show="showModal"
      round
      :style="{ width: '500px', padding: '0' }"
      :close-on-click-overlay="false"
      position="center"
    >
      <div class="modal-wrapper">
        <div class="modal-header">
          <h3>
            <van-icon :name="isEdit ? 'edit' : 'add-o'" />
            {{ isEdit ? '编辑车队信息' : '创建新车队' }}
          </h3>
          <van-icon name="cross" class="close-icon" @click="showModal = false" />
        </div>
        
        <div class="modal-body">
          <van-form @submit="handleSubmit">
            <van-cell-group inset>
              <van-field
                v-model="formData.fleet_id"
                label="车队ID"
                placeholder="请输入车队唯一标识"
                :rules="[{ required: true, message: '请输入车队ID' }]"
                :disabled="isEdit"
              />
              
              <van-field
                v-model="formData.fleet_name"
                label="车队名称"
                placeholder="请输入车队名称"
                :rules="[{ required: true, message: '请输入车队名称' }]"
              />
              
              <van-field
                v-model="formData.fleet_type"
                label="车队类型"
                :rules="[{ required: true, message: '请选择车队类型' }]"
              >
                <template #input>
                  <van-radio-group v-model="formData.fleet_type" direction="horizontal">
                    <van-radio name="small">小车队</van-radio>
                    <van-radio name="business">商务车队</van-radio>
                    <van-radio name="coach">大客车队</van-radio>
                  </van-radio-group>
                </template>
              </van-field>
              
              <van-field
                v-model="formData.manager_id"
                label="队长ID"
                placeholder="请输入队长用户ID"
                @click="openManagerSelect"
                readonly
              >
                <template #right-icon>
                  <van-icon name="search" @click="openManagerSelect" />
                </template>
              </van-field>
              
              <van-field
                v-model="formData.description"
                label="车队描述"
                placeholder="请输入车队描述信息"
                type="textarea"
                autosize
                rows="3"
              />
            </van-cell-group>
            
            <div style="margin: 16px;">
              <van-button round block type="primary" native-type="submit" :loading="isSubmitting">
                {{ isEdit ? '更新车队信息' : '创建车队' }}
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>

    <!-- 队长选择模态框 -->
    <van-popup
      v-model:show="showManagerSelect"
      round
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="manager-select-modal">
        <div class="modal-header">
          <h3>选择队长</h3>
          <van-icon name="cross" @click="showManagerSelect = false" />
        </div>
        
        <van-search
          v-model="managerSearch"
          placeholder="搜索队长"
          @search="searchManagers"
        />
        
        <van-list
          v-model:loading="managerLoading"
          :finished="managerFinished"
          finished-text="没有更多了"
          @load="onManagerLoad"
        >
          <van-cell
            v-for="manager in filteredManagers"
            :key="manager.user_id"
            :title="manager.real_name"
            :label="`ID: ${manager.user_id} - ${manager.department || '未分配部门'}`"
            @click="selectManager(manager)"
          >
            <template #right-icon>
              <van-icon name="success" v-if="formData.manager_id === manager.user_id" color="#07c160" />
            </template>
          </van-cell>
        </van-list>
      </div>
    </van-popup>

    <!-- 车队详情模态框 -->
    <van-popup
      v-model:show="showDetailModal"
      round
      :style="{ width: '550px', padding: '0' }"
      position="center"
    >
      <div class="detail-modal" v-if="selectedFleet">
        <div class="modal-header">
          <h3>车队详情 - {{ selectedFleet.fleet_name }}</h3>
          <van-icon name="cross" @click="showDetailModal = false" />
        </div>
        
        <div class="detail-content">
          <div class="detail-section">
            <h4>基本信息</h4>
            <van-cell-group>
              <van-cell title="车队ID" :value="selectedFleet.fleet_id" />
              <van-cell title="车队类型" :value="getFleetTypeText(selectedFleet.fleet_type)" />
              <van-cell title="创建时间" :value="formatDate(selectedFleet.created_at)" />
            </van-cell-group>
          </div>
          
          <div class="detail-section" v-if="selectedFleet.manager_id">
            <h4>队长信息</h4>
            <van-cell
              :title="selectedFleet.manager_name || selectedFleet.manager_id"
              :label="`ID: ${selectedFleet.manager_id}`"
            >
              <template #right-icon>
                <van-button size="small" type="primary" plain @click="contactManager(selectedFleet.manager_id)">
                  联系
                </van-button>
              </template>
            </van-cell>
          </div>
          
          <div class="detail-section" v-if="selectedFleet.description">
            <h4>车队描述</h4>
            <div class="description-box">
              {{ selectedFleet.description }}
            </div>
          </div>
          
          <div class="detail-section">
            <h4>资源统计</h4>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-number">{{ selectedFleet.vehicle_count || 0 }}</div>
                <div class="stat-label">车辆数量</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">{{ selectedFleet.driver_count || 0 }}</div>
                <div class="stat-label">司机数量</div>
              </div>
            </div>
          </div>
          
          <div class="action-buttons">
            <van-button type="primary" block @click="openEditModal(selectedFleet)">
              编辑车队信息
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { 
  Button, 
  Icon, 
  Search, 
  Row, 
  Col, 
  Tag, 
  List, 
  Popup, 
  Form, 
  Field, 
  CellGroup, 
  Cell, 
  RadioGroup, 
  Radio,
  DropdownMenu, 
  DropdownItem,
  showToast, 
  showConfirmDialog 
} from 'vant';
import api from '@/api';

export default {
  name: 'FleetManagement',
  components: {
    'van-button': Button,
    'van-icon': Icon,
    'van-search': Search,
    'van-row': Row,
    'van-col': Col,
    'van-tag': Tag,
    'van-list': List,
    'van-popup': Popup,
    'van-form': Form,
    'van-field': Field,
    'van-cell-group': CellGroup,
    'van-cell': Cell,
    'van-radio-group': RadioGroup,
    'van-radio': Radio,
    'van-dropdown-menu': DropdownMenu,
    'van-dropdown-item': DropdownItem,
  },
  setup() {
    // 数据状态
    const fleets = ref([]);
    const loading = ref(false);
    const finished = ref(false);
    const showModal = ref(false);
    const showDetailModal = ref(false);
    const showManagerSelect = ref(false);
    const isEdit = ref(false);
    const isSubmitting = ref(false);
    const searchQuery = ref('');
    const filterType = ref('all');
    const filterManager = ref('all');
    const managerSearch = ref('');
    const managerLoading = ref(false);
    const managerFinished = ref(false);
    
    // 选中车队和队长数据
    const selectedFleet = ref(null);
    const managers = ref([]);
    const filteredManagers = ref([]);
    
    // 表单数据
    const formData = reactive({
      fleet_id: '',
      fleet_name: '',
      fleet_type: 'small',
      manager_id: '',
      description: '',
    });
    
    // 统计数据
    const statistics = reactive({
      totalFleets: 0,
      totalVehicles: 0,
      totalDrivers: 0,
      fleetsWithoutManager: 0,
    });
    
    // 选项配置
    const fleetTypeOptions = [
      { text: '所有类型', value: 'all' },
      { text: '小车队', value: 'small' },
      { text: '商务车队', value: 'business' },
      { text: '大客车队', value: 'coach' },
    ];
    
    const managerFilterOptions = [
      { text: '所有队长', value: 'all' },
      { text: '已指派', value: 'assigned' },
      { text: '未指派', value: 'unassigned' },
    ];
    
    // 计算属性：筛选后的车队列表
    const displayedFleets = computed(() => {
      let filtered = fleets.value;
      
      // 搜索筛选
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(fleet => 
          fleet.fleet_name.toLowerCase().includes(query) ||
          fleet.fleet_id.toLowerCase().includes(query) ||
          (fleet.manager_name && fleet.manager_name.toLowerCase().includes(query)) ||
          (fleet.manager_id && fleet.manager_id.toLowerCase().includes(query))
        );
      }
      
      // 类型筛选
      if (filterType.value !== 'all') {
        filtered = filtered.filter(fleet => fleet.fleet_type === filterType.value);
      }
      
      // 队长筛选
      if (filterManager.value === 'assigned') {
        filtered = filtered.filter(fleet => fleet.manager_id);
      } else if (filterManager.value === 'unassigned') {
        filtered = filtered.filter(fleet => !fleet.manager_id);
      }
      
      return filtered;
    });
    
    // 方法定义
    const refreshFleets = async () => {
      loading.value = true;
      try {
        const res = await api.fleet.getAll();
        if (res && res.success) {
          fleets.value = res.data || [];
          calculateStatistics();
          showToast('刷新成功');
        } else {
          showToast(res?.message || '获取车队列表失败');
        }
      } catch (error) {
        console.error('获取车队列表失败:', error);
        showToast('获取数据失败');
      } finally {
        loading.value = false;
        finished.value = true;
      }
    };
    
    const calculateStatistics = () => {
      const fleetList = fleets.value;
      statistics.totalFleets = fleetList.length;
      statistics.totalVehicles = fleetList.reduce((sum, fleet) => sum + (fleet.vehicle_count || 0), 0);
      statistics.totalDrivers = fleetList.reduce((sum, fleet) => sum + (fleet.driver_count || 0), 0);
      statistics.fleetsWithoutManager = fleetList.filter(fleet => !fleet.manager_id).length;
    };
    
    const getFleetTypeText = (type) => {
      const map = {
        'small': '小车队',
        'business': '商务车队',
        'coach': '大客车队',
      };
      return map[type] || type;
    };
    
    const getFleetTypeTag = (type) => {
      const map = {
        'small': 'primary',
        'business': 'success',
        'coach': 'warning',
      };
      return map[type] || 'default';
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };
    
    const openAddModal = () => {
      isEdit.value = false;
      resetFormData();
      showModal.value = true;
    };
    
    const openEditModal = (fleet) => {
      isEdit.value = true;
      Object.assign(formData, {
        fleet_id: fleet.fleet_id,
        fleet_name: fleet.fleet_name,
        fleet_type: fleet.fleet_type,
        manager_id: fleet.manager_id || '',
        description: fleet.description || '',
      });
      showModal.value = true;
      showDetailModal.value = false;
    };
    
    const resetFormData = () => {
      Object.assign(formData, {
        fleet_id: '',
        fleet_name: '',
        fleet_type: 'small',
        manager_id: '',
        description: '',
      });
    };
    
    const handleSubmit = async () => {
      isSubmitting.value = true;
      try {
        const res = isEdit.value 
          ? await api.fleet.update(formData.fleet_id, formData)
          : await api.fleet.create(formData);
        
        if (res && res.success) {
          showToast({
            message: isEdit.value ? '更新成功' : '创建成功',
            type: 'success',
          });
          showModal.value = false;
          refreshFleets();
        } else {
          showToast(res?.message || '操作失败');
        }
      } catch (error) {
        console.error('提交失败:', error);
        showToast(error.response?.data?.message || '操作失败');
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const deleteFleet = (fleetId) => {
      showConfirmDialog({
        title: '删除确认',
        message: `确定要删除车队 ${fleetId} 吗？此操作不可恢复。`,
        confirmButtonColor: '#ee0a24',
      }).then(async () => {
        try {
          const res = await api.fleet.delete(fleetId);
          if (res && res.success) {
            showToast('删除成功');
            refreshFleets();
          }
        } catch (error) {
          showToast('删除失败');
        }
      }).catch(() => {});
    };
    
    const viewFleetDetail = (fleet) => {
      selectedFleet.value = fleet;
      showDetailModal.value = true;
    };
    
    const openManagerSelect = async () => {
      showManagerSelect.value = true;
      // 加载管理人员列表
      try {
        const res = await api.user.getAll();
        if (res && res.success) {
          // 筛选出管理人员（这里假设role为manager的是管理人员）
          const allUsers = res.data || res.users || [];
          managers.value = allUsers.filter(user => 
            user.role === 'manager' || user.role === 'admin'
          );
          filteredManagers.value = managers.value;
        }
      } catch (error) {
        console.error('获取管理人员列表失败:', error);
      }
    };
    
    const selectManager = (manager) => {
      formData.manager_id = manager.user_id;
      showManagerSelect.value = false;
      showToast(`已选择: ${manager.real_name}`);
    };
    
    const searchManagers = () => {
      if (!managerSearch.value) {
        filteredManagers.value = managers.value;
        return;
      }
      const query = managerSearch.value.toLowerCase();
      filteredManagers.value = managers.value.filter(manager => 
        manager.real_name.toLowerCase().includes(query) ||
        manager.user_id.toLowerCase().includes(query)
      );
    };
    
    const contactManager = (managerId) => {
      // 这里可以实现联系队长的功能
      showToast(`联系队长 ${managerId}`);
    };
    
    const handleSearch = () => {
      // 搜索逻辑已在计算属性中处理
    };
    
    const handleFilterChange = () => {
      // 筛选逻辑已在计算属性中处理
    };
    
    const onLoad = () => {
      // 列表加载更多
      refreshFleets();
    };
    
    const onManagerLoad = () => {
      // 管理人员列表加载更多
      managerFinished.value = true;
    };
    
    // 生命周期钩子
    onMounted(() => {
      refreshFleets();
    });
    
    return {
      // 状态
      fleets,
      loading,
      finished,
      showModal,
      showDetailModal,
      showManagerSelect,
      isEdit,
      isSubmitting,
      searchQuery,
      filterType,
      filterManager,
      managerSearch,
      managerLoading,
      managerFinished,
      selectedFleet,
      filteredManagers,
      formData,
      statistics,
      
      // 选项
      fleetTypeOptions,
      managerFilterOptions,
      
      // 计算属性
      displayedFleets,
      
      // 方法
      refreshFleets,
      getFleetTypeText,
      getFleetTypeTag,
      formatDate,
      openAddModal,
      openEditModal,
      handleSubmit,
      deleteFleet,
      viewFleetDetail,
      openManagerSelect,
      selectManager,
      searchManagers,
      contactManager,
      handleSearch,
      handleFilterChange,
      onLoad,
      onManagerLoad,
    };
  },
};
</script>

<style scoped>
.fleet-management {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(90deg, #1976d2 0%, #2196f3 100%);
  border-radius: 12px;
  padding: 25px 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.icon-box {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box .van-icon {
  font-size: 28px;
  color: white;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 5px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 45px;
  height: 45px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon .van-icon {
  font-size: 22px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.filter-bar {
  background: white;
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.search-input {
  flex: 1;
  max-width: 300px;
}

.filter-right {
  display: flex;
  gap: 10px;
}

.table-container {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.fleet-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fleet-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.fleet-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #1976d2;
}

.fleet-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.fleet-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fleet-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.fleet-actions {
  display: flex;
  gap: 8px;
}

.fleet-card-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.fleet-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.info-item .van-icon {
  color: #666;
  font-size: 16px;
}

.description-text {
  color: #666;
  font-size: 13px;
  line-height: 1.4;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.fleet-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-icon-small {
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon-small .van-icon {
  font-size: 18px;
  color: #1976d2;
}

.stat-text {
  text-align: center;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-date {
  font-size: 14px;
  color: #666;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 15px 0 20px;
  font-size: 16px;
}

.modal-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: linear-gradient(90deg, #1976d2 0%, #2196f3 100%);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-icon {
  font-size: 18px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-icon:hover {
  opacity: 1;
}

.modal-body {
  padding: 25px;
  max-height: 70vh;
  overflow-y: auto;
}

.manager-select-modal {
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.manager-select-modal .modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  color: #333;
}

.detail-modal {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.detail-content {
  padding: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.description-box {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  line-height: 1.6;
  color: #555;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.stat-box .stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1976d2;
}

.stat-box .stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 5px;
}

.action-buttons {
  margin-top: 20px;
}

.van-radio-group {
  display: flex;
  gap: 20px;
}
</style>