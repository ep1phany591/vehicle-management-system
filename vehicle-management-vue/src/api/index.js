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
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => response.data,
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
  
  // 用户管理 (关键更新部分)
  user: {
    // 个人查询/更新
    getProfile: () => instance.get('/users/me'),
    updateProfile: (data) => instance.put('/users/me', data),

    // 管理员：获取所有用户
    getAll: () => instance.get('/users'), 
    
    // 管理员：更新指定用户 (注意：这里使用 id 拼接路径)
    // data 包含: { real_name, phone, role, department, position, fleet_id }
    updateUser: (id, data) => instance.put(`/users/${id}`, data),
    
    // 管理员：删除指定用户
    delete: (id) => instance.delete(`/users/${id}`),
    add: (data) => axios.post('/api/users', data),
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
    getAll: (params) => instance.get('/applications', { params }), // 带搜索的分页查询
    updateStatus: (id, data) => instance.put(`/applications/${id}/status`, data), // 审批
  },
  
  // 管理员专项数据接口
  admin: {
    getPendingApplications: () => instance.get('/admin/applications/pending'),
    getStatistics: () => instance.get('/admin/statistics'), // 假设你将来有统计页
  },
  
  // 车队队长/主管功能
  manager: {
    getPendingMissions: () => instance.get('/manager/missions/pending'),
    assignTask: (data) => instance.post('/manager/task-assign', data), // 任务指派
  },
  
  // 司机专项接口
  driver: {
    getMissions: () => instance.get('/driver/missions'),
    updateMissionStatus: (id, status) => instance.put(`/driver/missions/${id}`, { status }),
  },
};

export default api;