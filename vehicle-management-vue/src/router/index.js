import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'), 
  },
  // 公共路由（所有登录用户可访问）
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/employee/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true },
  },
  
  // 申请相关路由 - 修改为所有角色都可以访问
  {
    path: '/apply',
    name: 'Apply',
    component: () => import('../views/Apply.vue'),
    meta: { requiresAuth: true, roles: ['employee', 'leader', 'admin', 'manager', 'driver'] },
  },
  {
    path: '/applications',
    name: 'Applications',
    component: () => import('../views/Applications.vue'),
    meta: { requiresAuth: true, roles: ['employee', 'leader', 'admin', 'manager', 'driver'] },
  },
  {
    path: '/application/:id',
    name: 'ApplicationDetail',
    component: () => import('../views/ApplicationDetail.vue'),
    meta: { requiresAuth: true, roles: ['employee', 'leader', 'admin', 'manager', 'driver'] },
    props: true
  },
  
  // 管理员路由
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/admin/vehicles',
    name: 'AdminVehicles',
    component: () => import('../views/admin/Vehicles.vue'),
    meta: { requiresAuth: true, roles: ['admin','manager'] }
  },
  {
    path: '/admin/statistics',
    name: 'AdminStatistics',
    component: () => import('../views/admin/Statistics.vue'),
    meta: { requiresAuth: true, roles: ['admin','leader'] }
  },
  {
  path: '/admin/approval',
  name: 'AdminApproval',
  component: () => import('../views/admin/Approval.vue'),
  meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
  path: '/admin/users',
  name: 'AdminUsers',
  component: () => import('../views/admin/users.vue'),
  meta: { requiresAuth: true, roles: ['admin'] }
  },
  // 车队队长路由
  {
    path: '/manager',
    name: 'ManagerDashboard',
    component: () => import('../views/manager/Dashboard.vue'),
    meta: { requiresAuth: true, roles: ['manager'] }
  },
  {
    path: '/manager/missions',
    name: 'ManagerMissions',
    component: () => import('../views/manager/Missions.vue'),
    meta: { requiresAuth: true, roles: ['manager'] }
  },
  {
    path: '/manager/drivers',
    name: 'ManagerDrivers',
    component: () => import('../views/manager/Drivers.vue'),
    meta: { requiresAuth: true, roles: ['manager'] }
  },
  {
  path: '/manager/vehicles',
  name: 'ManagerVehicles',
  component: () => import('../views/manager/Vehicles.vue'),
  meta: { requiresAuth: true, roles: ['manager'] }
  },
  {
  path: '/manager/task-assign',
  name: 'TaskAssign',
  component: () => import('../views/manager/TaskAssign.vue'),
  meta: { requiresAuth: true, roles: ['manager'] }
  },
  // 司机路由
  {
    path: '/driver',
    name: 'DriverDashboard',
    component: () => import('../views/driver/Missions.vue'),
    meta: { requiresAuth: true, roles: ['driver'] }
  },
  {
    path: '/driver/missions',
    name: 'DriverMissions',
    component: () => import('../views/driver/Missions.vue'),
    meta: { requiresAuth: true, roles: ['driver'] }
  },
  
  // 领导路由
  {
    path: '/leader',
    name: 'LeaderDashboard',
    component: () => import('../views/leader/Dashboard.vue'),
    meta: { requiresAuth: true, roles: ['leader'] }
  },
  {
  path: '/admin/missions',
  name: 'AdminMissions',
  component: () => import('../views/leader/Missions.vue'),
  meta: { requiresAuth: true, roles: ['leader'] }
  },
  
  // 调试页面
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 增强的路由守卫
router.beforeEach((to, from, next) => {
  console.log(`🚦 路由守卫: ${from.path} -> ${to.path}`);
  
  // 获取用户信息
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!token || !user) {
      console.log('未登录，重定向到登录页');
      next('/login');
      return;
    }
    
    // 检查角色权限
    if (to.meta.roles && !to.meta.roles.includes(user.role)) {
      console.log(`角色权限不足: ${user.role} 无法访问 ${to.path}`);
      
      // 根据角色重定向到对应首页
      let redirectPath = '/home';
      switch (user.role) {
        case 'admin':
          redirectPath = '/admin';
          break;
        case 'manager':
          redirectPath = '/manager';
          break;
        case 'driver':
          redirectPath = '/driver';
          break;
        case 'leader':
          redirectPath = '/leader';
          break;
        case 'employee':
          redirectPath = '/home';
          break;
      }
      
      alert(`权限不足！您作为${getRoleText(user.role)}无法访问此页面。`);
      next(redirectPath);
      return;
    }
  }
  
  // 如果已登录但访问登录页，跳转到对应首页
  if (to.path === '/login' && token && user) {
    let redirectPath = '/home';
    switch (user.role) {
      case 'admin':
        redirectPath = '/admin';
        break;
      case 'manager':
        redirectPath = '/manager';
        break;
      case 'driver':
        redirectPath = '/driver';
        break;
      case 'leader':
        redirectPath = '/leader';
        break;
    }
    next(redirectPath);
    return;
  }
  
  next();
});

// 获取角色文本
function getRoleText(role) {
  const roleMap = {
    admin: '管理员',
    leader: '领导',
    manager: '车队队长',
    driver: '司机',
    employee: '员工'
  };
  return roleMap[role] || role;
}

export default router;