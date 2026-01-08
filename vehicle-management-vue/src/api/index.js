// api.js
import axios from 'axios';
import { showFailToast } from 'vant';

// 创建axios实例
const instance = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 如果是 FormData，不要设置 Content-Type，让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    console.log('📡 响应数据:', response.data);
    return response.data;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          showFailToast('登录已过期，请重新登录');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          showFailToast('权限不足');
          break;
        case 500:
          showFailToast('服务器错误');
          break;
        default:
          showFailToast(error.response.data?.message || '请求失败');
      }
    } else {
      showFailToast('网络连接失败');
    }
    return Promise.reject(error);
  }
);

const api = {
  // 用户认证
  auth: {
    login: (data) => instance.post('/auth/login', data),
    register: (data) => instance.post('/auth/register', data),
  },
  
  // 用户管理
  user: {
    // 个人中心相关
    getProfile: () => instance.get('/users/me'),
    updateProfile: (data) => instance.put('/users/me', data),
    
    // 用户自己修改密码（需要旧密码）
    changePassword: (data) => instance.put('/users/me/password', data),
    
    // 管理员重置用户密码（不需要旧密码）
    resetPassword: (userId, data) => instance.put(`/users/${userId}/password`, data),
    
    updateStats: (id, data) => instance.put(`/users/${id}/stats`, data),
    getUserStats: (id) => instance.get(`/users/${id}/statistics`),

    // 管理员：获取所有用户
    getAll: () => instance.get('/users'), 
    
    // 管理员：更新指定用户 - 支持 FormData（用于头像上传）
    updateUser: (id, data) => instance.put(`/users/${id}`, data),
    
    // 管理员：删除指定用户
    delete: (id) => instance.delete(`/users/${id}`),
    
    // 管理员：添加用户 - 支持 FormData（用于头像上传）
    add: (data) => instance.post('/users', data),
    
    // 获取单个用户信息
    getById: (id) => instance.get(`/users/${id}`),
    
    // 获取管理人员列表（用于车队队长选择）
    getManagers: () => instance.get('/users/managers'),
    
    // 根据角色获取用户
    getByRole: (role) => instance.get(`/users/role/${role}`)
  },

  // ==================== 车队管理 API ====================
  fleet: {
    // 获取所有车队（管理员）
    getAll: (params) => instance.get('/fleets', { params }),
    
    // 获取单个车队详情
    getById: (id) => instance.get(`/fleets/${id}`),
    
    // 创建车队（管理员）
    create: (data) => instance.post('/fleets', data),
    
    // 更新车队信息（管理员）
    update: (id, data) => instance.put(`/fleets/${id}`, data),
    
    // 删除车队（管理员）
    delete: (id) => instance.delete(`/fleets/${id}`),
    
    // 获取车队统计信息
    getStatistics: () => instance.get('/fleets/statistics'),
    
    // 根据类型获取车队
    getByType: (type) => instance.get(`/fleets/type/${type}`),
    
    // 获取有/无队长的车队
    getByManagerStatus: (hasManager) => instance.get(`/fleets/manager-status/${hasManager}`),
    
    // 搜索车队（支持名称、ID、队长等）
    search: (keyword) => instance.get(`/fleets/search/${keyword}`),
    
    // 更新车队车辆数量
    updateVehicleCount: (id, count) => instance.put(`/fleets/${id}/vehicle-count`, { count }),
    
    // 更新车队司机数量
    updateDriverCount: (id, count) => instance.put(`/fleets/${id}/driver-count`, { count }),
    
    // 为车队指派/更换队长
    assignManager: (fleetId, managerId) => instance.put(`/fleets/${fleetId}/assign-manager`, { managerId }),
    
    // 移除车队队长
    removeManager: (fleetId) => instance.put(`/fleets/${fleetId}/remove-manager`),
    
    // 获取队长管理的车队
    getByManager: (managerId) => instance.get(`/fleets/manager/${managerId}`),
    
    // 分页获取车队列表
    getPaginated: (page, limit = 10) => instance.get(`/fleets?page=${page}&limit=${limit}`)
  },
  
  // 车辆管理
  vehicle: {
    getAll: () => instance.get('/vehicles'),
    getAvailable: (params) => instance.get('/vehicles/available', { params }),
    
    // 获取车队的车辆
    getByFleet: (fleetId) => instance.get(`/vehicles/fleet/${fleetId}`),
    
    // 分配车辆到车队
    assignToFleet: (vehicleId, fleetId) => instance.put(`/vehicles/${vehicleId}/assign-fleet`, { fleetId }),
    
    // 从车队移除车辆
    removeFromFleet: (vehicleId) => instance.put(`/vehicles/${vehicleId}/remove-fleet`)
  },
  
  // 申请/审批管理
  application: {
    create: (data) => instance.post('/applications', data),
    getMyApplications: (userId) => instance.get(`/applications/my/${userId}`),
    getAll: (params) => instance.get('/applications', { params }),
    updateStatus: (id, data) => instance.put(`/applications/${id}/status`, data),
  },
  
  // 管理员专项数据接口
  admin: {
    getPendingApplications: () => instance.get('/admin/applications/pending'),
    getStatistics: () => instance.get('/admin/statistics'),
    
    // 管理员获取车队统计面板数据
    getFleetDashboard: () => instance.get('/admin/fleet-dashboard'),
  },
  
  // 车队队长/主管功能
  manager: {
    getPendingMissions: () => instance.get('/manager/missions/pending'),
    assignTask: (data) => instance.post('/manager/task-assign', data),
    
    // 队长获取自己管理的车队
    getMyFleet: () => instance.get('/manager/my-fleet'),
    
    // 队长管理车队司机
    getFleetDrivers: (fleetId) => instance.get(`/manager/fleet/${fleetId}/drivers`),
    addDriverToFleet: (fleetId, driverId) => instance.post(`/manager/fleet/${fleetId}/drivers`, { driverId }),
    removeDriverFromFleet: (fleetId, driverId) => instance.delete(`/manager/fleet/${fleetId}/drivers/${driverId}`),
    
    // 队长管理车队车辆
    getFleetVehicles: (fleetId) => instance.get(`/manager/fleet/${fleetId}/vehicles`)
  },
  
  // 司机专项接口
  driver: {
    getMissions: () => instance.get('/driver/missions'),
    updateMissionStatus: (id, status) => instance.put(`/driver/missions/${id}`, { status }),
    
    // 司机获取所属车队信息
    getMyFleet: () => instance.get('/driver/my-fleet')
  },
  
  // 领导查看接口
  leader: {
    // 领导查看所有车队概况
    getFleetOverview: () => instance.get('/leader/fleet-overview'),
    
    // 领导查看车队统计
    getFleetStatistics: () => instance.get('/leader/fleet-statistics')
  },
  
  // 通用工具接口
  utils: {
    // 获取车队类型选项
    getFleetTypes: () => instance.get('/utils/fleet-types'),
    
    // 获取统计数据
    getDashboardStats: () => instance.get('/utils/dashboard-stats')
  }
};

export default api;