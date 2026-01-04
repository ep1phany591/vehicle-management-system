import axios from 'axios';
import { showFailToast } from 'vant';

// 创建axios实例
const instance = axios.create({
  baseURL: 'http://localhost:3000/api',
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
  
  // 用户管理 (重要更新)
  user: {
    // 个人查询/更新
    getProfile: () => instance.get('/users/me'),
    updateProfile: (data) => instance.put('/users/me', data),

    // 管理员：获取所有用户
    getAll: () => instance.get('/users'), 
    
    // 管理员：更新指定用户 - 支持 FormData（用于头像上传）
    updateUser: (id, data) => instance.put(`/users/${id}`, data),
    
    // 管理员：删除指定用户
    delete: (id) => instance.delete(`/users/${id}`),
    
    // 管理员：添加用户 - 支持 FormData（用于头像上传）
    add: (data) => instance.post('/users', data),
    
    // 获取单个用户信息（可选）
    getById: (id) => instance.get(`/users/${id}`)
  },

  // 车辆管理
  vehicle: {
    getAll: () => instance.get('/vehicles'),
    getAvailable: (params) => instance.get('/vehicles/available', { params }),
    // 如果后续需要管理员增加/删除车辆，可以在此扩展
    // add: (data) => instance.post('/vehicles', data),
    // delete: (id) => instance.delete(`/vehicles/${id}`),
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
  },
  
  // 车队队长/主管功能
  manager: {
    getPendingMissions: () => instance.get('/manager/missions/pending'),
    assignTask: (data) => instance.post('/manager/task-assign', data),
  },
  
  // 司机专项接口
  driver: {
    getMissions: () => instance.get('/driver/missions'),
    updateMissionStatus: (id, status) => instance.put(`/driver/missions/${id}`, { status }),
  },
};

export default api;