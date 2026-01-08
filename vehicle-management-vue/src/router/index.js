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
  
  // ==================== 公共路由（所有登录用户可访问）====================
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/employee/Home.vue'),
    meta: { 
      requiresAuth: true,
      title: '首页'
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { 
      requiresAuth: true,
      title: '个人中心'
    },
  },
  
  // 申请相关路由 - 所有角色都可以访问
  {
    path: '/apply',
    name: 'Apply',
    component: () => import('../views/Apply.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['employee', 'leader', 'admin', 'manager', 'driver'],
      title: '用车申请'
    },
  },
  {
    path: '/applications',
    name: 'Applications',
    component: () => import('../views/Applications.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['employee', 'leader', 'admin', 'manager', 'driver'],
      title: '我的申请'
    },
  },
  {
    path: '/application/:id',
    name: 'ApplicationDetail',
    component: () => import('../views/ApplicationDetail.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['employee', 'leader', 'admin', 'manager', 'driver'],
      title: '申请详情'
    },
    props: true
  },
  
  // ==================== 管理员路由 ====================
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['admin'],
      title: '管理员仪表板'
    }
  },
  // === 新增：管理员车队管理 ===
  {
    path: '/admin/fleets',
    name: 'AdminFleets',
    component: () => import('../views/admin/fleet.vue'), // 新增页面
    meta: { 
      requiresAuth: true, 
      roles: ['admin'],
      title: '车队管理'
    }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../views/admin/users.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['admin'],
      title: '用户管理'
    }
  },
  {
    path: '/admin/vehicles',
    name: 'AdminVehicles',
    component: () => import('../views/admin/Vehicles.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['admin'],
      title: '车辆管理'
    }
  },
  {
    path: '/admin/statistics',
    name: 'AdminStatistics',
    component: () => import('../views/admin/Statistics.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['admin', 'leader'],
      title: '数据统计'
    }
  },
  {
    path: '/admin/approval',
    name: 'AdminApproval',
    component: () => import('../views/admin/Approval.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['admin'],
      title: '申请审批'
    }
  },
  {
    path: '/admin/missions',
    name: 'AdminMissions',
    component: () => import('../views/admin/Missions.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['admin'],
      title: '任务管理'
    }
  },
  
  // ==================== 车队队长路由 ====================
  {
    path: '/manager',
    name: 'ManagerDashboard',
    component: () => import('../views/manager/Dashboard.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['manager'],
      title: '队长仪表板'
    }
  },
  {
    path: '/manager/missions',
    name: 'ManagerMissions',
    component: () => import('../views/manager/Missions.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['manager'],
      title: '任务管理'
    }
  },
  {
    path: '/manager/drivers',
    name: 'ManagerDrivers',
    component: () => import('../views/manager/Drivers.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['manager'],
      title: '司机管理'
    }
  },
  {
    path: '/manager/vehicles',
    name: 'ManagerVehicles',
    component: () => import('../views/manager/Vehicles.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['manager'],
      title: '车辆管理'
    }
  },
  {
    path: '/manager/task-assign',
    name: 'TaskAssign',
    component: () => import('../views/manager/TaskAssign.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['manager'],
      title: '任务分配'
    }
  },
  
  // ==================== 司机路由 ====================
  {
    path: '/driver',
    name: 'DriverDashboard',
    component: () => import('../views/driver/Dashboard.vue'), // 建议创建独立的仪表板
    meta: { 
      requiresAuth: true, 
      roles: ['driver'],
      title: '司机仪表板'
    }
  },
  {
    path: '/driver/missions',
    name: 'DriverMissions',
    component: () => import('../views/driver/Missions.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['driver'],
      title: '我的任务'
    }
  },
  
  // ==================== 领导路由 ====================
  {
    path: '/leader',
    name: 'LeaderDashboard',
    component: () => import('../views/leader/Dashboard.vue'),
    meta: { 
      requiresAuth: true, 
      roles: ['leader'],
      title: '领导仪表板'
    }
  },
 
  
  // ==================== 404页面 ====================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { 
      title: '页面未找到'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 路由切换时滚动到顶部
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 };
  },
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
      // 清除无效的用户信息
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 车队管理系统`;
  } else {
    document.title = '车队管理系统';
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!token || !user) {
      console.log('未登录，重定向到登录页');
      // 保存重定向路径，登录后可以跳转回来
      if (to.path !== '/login') {
        localStorage.setItem('redirectPath', to.fullPath);
      }
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
      
      // 使用更友好的提示方式（可以考虑替换为Toast）
      console.warn(`权限不足！您作为${getRoleText(user.role)}无法访问此页面。`);
      next(redirectPath);
      return;
    }
  }
  
  // 如果已登录但访问登录页，跳转到对应首页
  if (to.path === '/login' && token && user) {
    let redirectPath = '/home';
    
    // 检查是否有之前保存的重定向路径
    const savedPath = localStorage.getItem('redirectPath');
    if (savedPath) {
      localStorage.removeItem('redirectPath');
      redirectPath = savedPath;
    } else {
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

// 添加路由完成后的钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等
  console.log(`✅ 成功导航到: ${to.path}`);
});

export default router;