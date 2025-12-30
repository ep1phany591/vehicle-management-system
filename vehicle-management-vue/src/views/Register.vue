<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>创建新账户</h1>
        <p>加入公务用车管理系统</p>
      </div>

      <div class="login-form">

        <div class="form-group name-icon">
          <label for="real_name">真实姓名</label>
          <input
            type="text"
            id="real_name"
            v-model="form.real_name"
            placeholder="请输入您的真实姓名"
          />
        </div>

        <div class="form-group phone-icon">
          <label for="phone">手机号</label>
          <input
            type="tel"
            id="phone"
            v-model="form.phone"
            placeholder="请输入11位手机号"
          />
        </div>

        <div class="form-group lock-icon">
          <label for="password">设置密码</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            placeholder="不少于6位密码"
          />
        </div>

        <div class="form-group captcha-group">
          <label for="captcha">验证码</label>
          <div class="captcha-wrapper">
            <input
              type="text"
              id="captcha"
              v-model="form.captcha"
              placeholder="请输入验证码"
              maxlength="6"
              @keyup.enter="handleRegister"
            />
            <div
              class="captcha-img-box"
              @click="refreshCaptcha"
              title="点击更换验证码"
            >
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" />
              <span v-else class="loading-text">加载中...</span>
            </div>
          </div>
        </div>

        <div class="form-group dept-icon">
          <label for="department">所属部门</label>
          <input
            type="text"
            id="department"
            v-model="form.department"
            placeholder="请输入您所在的部门"
          />
        </div>

        <div class="form-group fleet-icon">
          <label for="fleet_id">所属车队编号</label>
          <input
            type="number"
            id="fleet_id"
            v-model="form.fleet_id"
            placeholder="请输入车队 ID（数字）"
          />
        </div>

        <button
          class="login-btn"
          :disabled="isSubmitting"
          @click="handleRegister"
        >
          <span v-if="!isSubmitting">立即注册</span>
          <span v-else>注册处理中...</span>
        </button>

        <div class="register-footer">
          <p>
            已有账号？
            <a @click="$router.push('/login')">返回登录</a>
          </p>
        </div>

      </div>
    </div>
  </div>
</template>


<script>
import api from '@/api'; 
import axios from 'axios'; // 确保引入 axios 进行全局配置

export default {
  name: 'Register',
  data() {
    return {
      form: {
        real_name: '',
        phone: '',
        password: '',
        department: '',
        position: '员工',
        fleet_id: '',
        captcha: '' 
      },
      captchaUrl: '', 
      isSubmitting: false
    };
  },
  created() {
    /**
     * 
     * 必须设置为 true，否则浏览器在请求验证码和提交表单时不会发送同一个 Session Cookie
     */
    axios.defaults.withCredentials = true;
  },
  mounted() {
    this.refreshCaptcha();
  },
  methods: {
    refreshCaptcha() {
      /**
       * 
       * 1. 优先使用环境变量中的 API 地址，如果没有则使用后端默认的 3000 端口（开发环境）
       * 2. t=${Date.now()} 是必须的，防止浏览器因缓存而不刷新图片
       */
    this.captchaUrl = `/api/auth/captcha?t=${Date.now()}`;
  this.form.captcha = '';
    },

    async handleRegister() {
      const {real_name, phone, password, captcha } = this.form;
      
      // 1. 增强校验
      if ( !real_name || !phone || !password || !captcha) {
        alert('【提示】请完整填写所有内容，包括验证码。');
        return;
      }

      if (phone.length !== 11) {
        alert('【错误】请输入 11 位有效的手机号码。');
        return;
      }

      this.isSubmitting = true;

      try {
        // 2. 调用注册接口 (注意字段对应)
        const res = await api.auth.register({
          realName: this.form.real_name, 
          phone: this.form.phone,
          password: this.form.password,
          department: this.form.department,
          position: this.form.position,
          fleet_id: this.form.fleet_id || null,
          captcha: this.form.captcha, // 传给后端比对
          role: 'employee'
        });
        
        if (res.success) {
          alert('🎉 注册成功！点击跳转登录。');
          this.$router.push('/login');
        } else {
          // 针对后端返回的验证码错误进行处理
          alert('【注册失败】\n' + (res.message || '验证码错误或信息有误'));
          this.refreshCaptcha(); // 失败后必须强制刷新验证码
        }

      } catch (error) {
        let errorMsg = '连接服务器失败，请确认后端 3000 端口已开启。';
        if (error.response && error.response.data) {
          errorMsg = error.response.data.message || errorMsg;
        }
        alert('⚠️ 注册异常\n' + errorMsg);
        this.refreshCaptcha();
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
/* 保持原有样式，仅优化细节 */
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  padding: 40px 20px;
}

.login-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.login-header { text-align: center; margin-bottom: 30px; }
.login-header h1 {
  background: linear-gradient(135deg, #1890ff, #52c41a);
  -webkit-background-clip: text; 
  background-clip: text; 
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  font-size: 28px;
}

.form-group { margin-bottom: 20px; position: relative; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #444; }
.form-group input { 
  width: 100%; 
  padding: 12px 15px; 
  border: 2px solid #e8e8e8; 
  border-radius: 12px; 
  transition: all 0.3s;
  box-sizing: border-box;
}
.form-group input:focus { border-color: #1890ff; outline: none; box-shadow: 0 0 8px rgba(24,144,255,0.2); }

/* 验证码布局：左侧输入框，右侧图片 */
.captcha-wrapper {
  display: flex;
  gap: 12px;
}
.captcha-wrapper input { flex: 1; }
.captcha-img-box {
  width: 130px;
  height: 45px;
  background: #eee;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border: 1px solid #ddd;
  flex-shrink: 0; /* 防止图片被压缩 */
}
.captcha-img-box img { width: 100%; height: 100%; object-fit: cover; }
.loading-text { font-size: 12px; color: #999; }

/* 伪元素图标 */
.user-icon::after { content: '🆔'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.name-icon::after { content: '👤'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.phone-icon::after { content: '📱'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.lock-icon::after { content: '🔒'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.fleet-icon::after { content: '🚛'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.dept-icon::after { content: '🏢'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }

.login-btn {
  width: 100%; padding: 16px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white; font-weight: 600; cursor: pointer; font-size: 16px;
  margin-top: 10px;
  transition: transform 0.2s;
}
.login-btn:active { transform: scale(0.98); }
.login-btn:disabled { background: #ccc; cursor: not-allowed; }

.register-footer { margin-top: 20px; text-align: center; font-size: 14px; }
.register-footer a { color: #1890ff; font-weight: 600; cursor: pointer; text-decoration: underline; }
</style>