<!-- src/views/Login.vue -->
<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>公务用车管理系统</h1>
        <p>请登录您的账户</p>
      </div>
      
      <div class="login-form">
        <div class="form-group">
          <label for="phone">手机号</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="phone" 
            placeholder="请输入手机号"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="请输入密码"
          />
        </div>
        
        <button class="login-btn" @click="handleLogin">
          登录
        </button>
        
        <div class="login-info">
          <p>测试账号: 13800138000 / admin123</p>
        </div>
        <div class="login-footer-actions" style="margin-top: 15px; text-align: center;">
  <p style="font-size: 14px; color: #666;">
    还没有账号？ 
    <a @click="$router.push('/Register')" style="color: #1890ff; cursor: pointer; font-weight: 600;">立即注册</a>
  </p>
</div>
      </div>
    </div>
  </div>
  
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      phone:'13800138000',
      password:'admin123'
    };
  },
  methods: {
    async handleLogin() {
      console.log('登录数据:', {
        phone: this.phone,
        password: this.password
      });
      
      try {
        // 调用后端登录接口
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: this.phone,
            password: this.password
          })
        });
        
        const data = await response.json();
        console.log('登录响应:', data);
        
         // 在 handleLogin 方法中修改跳转逻辑
if (data.success) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // 根据用户角色跳转到不同页面
  let redirectTo = '/home';
  switch (data.user.role) {
    case 'admin':
      redirectTo = '/admin';
      break;
    case 'manager':
      redirectTo = '/manager';
      break;
    case 'driver':
      redirectTo = '/driver';
      break;
    case 'leader':
      redirectTo = '/leader';
      break;
    case 'employee':
      redirectTo = '/home';
      break;
  }
  
  this.$router.push(redirectTo);
}else {
          alert('登录失败: ' + (data.message || '未知错误'));
        }
      } catch (error) {
        console.error('登录请求失败:', error);
        alert('网络错误，请稍后重试');
      }
    }
  },
  mounted() {
  // 检查是否已经登录
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Login.vue mounted - Token:', token);
  console.log('Login.vue mounted - User:', user);
  
  // 只有在有token且有user信息时才跳转
  if (token && user) {
    try {
      const userData = JSON.parse(user);
      console.log('检测到已保存的用户，自动验证token');
      
      // 验证token是否有效
      this.verifyToken(token).then(isValid => {
        if (isValid) {
          // token有效，根据用户角色跳转
          console.log('Token有效，自动跳转到首页');
          let redirectTo = '/home';
          switch (userData.role) {
            case 'admin': redirectTo = '/admin'; break;
            case 'manager': redirectTo = '/manager'; break;
            case 'driver': redirectTo = '/driver'; break;
            case 'leader': redirectTo = '/leader'; break;
            case 'employee': redirectTo= 'employee'; break;
          }
          
          setTimeout(() => {
            this.$router.push(redirectTo);
          }, 100);
        } else {
          // token 无效，清除缓存，跳转到登录页面
          console.log('Token无效，跳转到登录页');
          localStorage.clear();
          this.$router.push('/login');
        }
      }).catch(error => {
        console.error('验证token时发生错误:', error);
        localStorage.clear();
        this.$router.push('/login');
      });
      
    } catch (error) {
      console.error('解析用户信息失败:', error);
      localStorage.clear();
      this.$router.push('/login');
    }
  }
}
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding: 20px;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 80%;
  height: 80%;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%);
  border-radius: 50%;
  z-index: 0;
}

.login-page::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -30%;
  width: 60%;
  height: 60%;
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%);
  border-radius: 50%;
  z-index: 0;
}

.login-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 48px 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.3);
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

.login-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.login-header::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  border-radius: 2px;
}

.login-header h1 {
  color: #333;
  margin-bottom: 12px;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.login-header p {
  color: #666;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.login-form {
  animation: fadeIn 0.8s ease-out 0.2s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group {
  margin-bottom: 28px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  color: #333;
  font-weight: 600;
  font-size: 15px;
  padding-left: 4px;
}

.form-group input {
  width: 100%;
  padding: 18px 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border: 2px solid #e8e8e8;
  border-radius: 16px;
  font-size: 16px;
  transition: all 0.4s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  color: #333;
  position: relative;
}

.form-group input::placeholder {
  color: #aaa;
  font-weight: 400;
}

.form-group input:focus {
  outline: none;
  border-color: #1890ff;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  box-shadow: 
    0 4px 16px rgba(24, 144, 255, 0.2),
    0 0 0 3px rgba(24, 144, 255, 0.1);
  transform: translateY(-1px);
}

.form-group input:hover {
  border-color: #d9d9d9;
}

/* 手机号输入框特殊样式 */
.form-group:first-child::after {
  content: '📱';
  position: absolute;
  right: 20px;
  top: 50px;
  font-size: 20px;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.form-group:first-child input:focus::after {
  opacity: 0;
}

/* 密码输入框特殊样式 */
.form-group:last-child::after {
  content: '🔒';
  position: absolute;
  right: 20px;
  top: 50px;
  font-size: 20px;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.form-group:last-child input:focus::after {
  opacity: 0;
}

.login-btn {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
  position: relative;
  overflow: hidden;
  margin-top: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-family: inherit;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.login-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(24, 144, 255, 0.4);
}

.login-btn:hover::before {
  opacity: 1;
}

.login-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.login-btn span {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.login-btn:hover::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}

.login-info {
  margin-top: 32px;
  text-align: center;
  font-size: 14px;
  color: #666;
  border-top: 2px solid #f0f0f0;
  padding-top: 24px;
  position: relative;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 12px;
  padding: 20px;
  margin-top: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.login-info::before {
  content: '💡';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 0 10px;
  font-size: 20px;
}

.login-info p {
  margin: 0;
  font-weight: 500;
  line-height: 1.6;
  color: #555;
}

/* 输入框错误状态 */
.form-group.error input {
  border-color: #ff4d4f;
  background: linear-gradient(135deg, #fff2f0, #ffffff);
}

.form-group.error input:focus {
  box-shadow: 
    0 4px 16px rgba(255, 77, 79, 0.2),
    0 0 0 3px rgba(255, 77, 79, 0.1);
}

/* 加载状态 */
.login-btn.loading {
  pointer-events: none;
  opacity: 0.8;
}

.login-btn.loading::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  margin: -12px 0 0 -12px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 2;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 36px 28px;
    margin: 0 16px;
  }
  
  .login-header h1 {
    font-size: 28px;
  }
  
  .login-header p {
    font-size: 15px;
  }
  
  .form-group input {
    padding: 16px 18px;
  }
  
  .login-btn {
    padding: 18px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 16px;
    align-items: flex-start;
    padding-top: 60px;
  }
  
  .login-container {
    padding: 32px 24px;
  }
  
  .login-header h1 {
    font-size: 24px;
  }
  
  .form-group label {
    font-size: 14px;
  }
  
  .form-group input {
    padding: 14px 16px;
    font-size: 15px;
  }
  
  .login-info {
    font-size: 13px;
    padding: 16px;
  }
}
</style>