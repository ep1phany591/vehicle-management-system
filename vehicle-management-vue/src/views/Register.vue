<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>创建新账户</h1>
        <p>加入公务用车管理系统</p>
      </div>

      <div class="login-form">

        <!-- 头像上传 -->
        <div class="form-group avatar-upload">
          <label for="avatar">头像（可选）</label>
          <div class="avatar-upload-wrapper">
            <div class="avatar-preview" @click="triggerFileInput">
              <img v-if="avatarPreview" :src="avatarPreview" alt="头像预览" class="avatar-image" />
              <div v-else class="avatar-placeholder">
                <span>点击上传头像</span>
                <small>支持 JPG/PNG，建议尺寸 200×200</small>
              </div>
            </div>
            <input
              type="file"
              id="avatar"
              ref="avatarInput"
              accept="image/jpeg,image/png,image/jpg"
              @change="handleAvatarChange"
              style="display: none;"
            />
            <div class="avatar-actions">
              <button
                type="button"
                class="avatar-btn"
                @click="triggerFileInput"
              >
                选择图片
              </button>
              <button
                type="button"
                class="avatar-btn remove-btn"
                v-if="avatarFile"
                @click="removeAvatar"
              >
                移除
              </button>
            </div>
          </div>
        </div>

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
import axios from 'axios';

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
      avatarFile: null,
      avatarPreview: null,
      captchaUrl: '', 
      isSubmitting: false
    };
  },
  created() {
    axios.defaults.withCredentials = true;
  },
  mounted() {
    this.refreshCaptcha();
  },
  methods: {
    refreshCaptcha() {
      this.captchaUrl = `/api/auth/captcha?t=${Date.now()}`;
      this.form.captcha = '';
    },

    triggerFileInput() {
      this.$refs.avatarInput.click();
    },

    handleAvatarChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 验证文件类型和大小
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        alert('请上传 JPG 或 PNG 格式的图片');
        return;
      }

      if (file.size > maxSize) {
        alert('图片大小不能超过 5MB');
        return;
      }

      this.avatarFile = file;

      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    removeAvatar() {
      this.avatarFile = null;
      this.avatarPreview = null;
      this.$refs.avatarInput.value = '';
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
        // 使用 FormData 来处理文件上传
        const formData = new FormData();
        
        // 添加表单字段
        formData.append('realName', this.form.real_name);
        formData.append('phone', this.form.phone);
        formData.append('password', this.form.password);
        formData.append('department', this.form.department);
        formData.append('position', this.form.position);
        if (this.form.fleet_id) {
          formData.append('fleet_id', this.form.fleet_id);
        }
        formData.append('captcha', this.form.captcha);
        formData.append('role', 'driver');
        
        // 如果有头像，添加文件
        if (this.avatarFile) {
          formData.append('avatar', this.avatarFile);
        }

        // 使用 axios 直接发送 FormData
        const res = await axios.post('/api/auth/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (res.data.success) {
          alert('🎉 注册成功！点击跳转登录。');
          this.$router.push('/login');
        } else {
          alert('【注册失败】\n' + (res.data.message || '验证码错误或信息有误'));
          this.refreshCaptcha();
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

/* 头像上传样式 */
.avatar-upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 2px dashed #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}

.avatar-preview:hover {
  border-color: #1890ff;
  transform: scale(1.02);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  text-align: center;
  color: #999;
  padding: 15px;
}

.avatar-placeholder span {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
}

.avatar-placeholder small {
  font-size: 12px;
  color: #ccc;
}

.avatar-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.avatar-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.avatar-btn:hover {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.remove-btn {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.remove-btn:hover {
  background: #ff7875;
  border-color: #ff7875;
}

/* 表单样式 */
.form-group { margin-bottom: 20px; position: relative; }
.form-group label { 
  display: block; 
  margin-bottom: 8px; 
  font-weight: 600; 
  font-size: 14px; 
  color: #444; 
}

.form-group input { 
  width: 100%; 
  padding: 12px 15px; 
  border: 2px solid #e8e8e8; 
  border-radius: 12px; 
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-group input:focus { 
  border-color: #1890ff; 
  outline: none; 
  box-shadow: 0 0 8px rgba(24,144,255,0.2); 
}

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
  flex-shrink: 0;
}

.captcha-img-box img { width: 100%; height: 100%; object-fit: cover; }
.loading-text { font-size: 12px; color: #999; }

/* 图标样式 */
.name-icon::after { content: '👤'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.phone-icon::after { content: '📱'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.lock-icon::after { content: '🔒'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.fleet-icon::after { content: '🚛'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }
.dept-icon::after { content: '🏢'; position: absolute; right: 15px; top: 38px; opacity: 0.4; pointer-events: none; }

.login-btn {
  width: 100%; 
  padding: 16px; 
  border: none; 
  border-radius: 12px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white; 
  font-weight: 600; 
  cursor: pointer; 
  font-size: 16px;
  margin-top: 10px;
  transition: transform 0.2s;
}

.login-btn:active { transform: scale(0.98); }
.login-btn:disabled { background: #ccc; cursor: not-allowed; }

.register-footer { 
  margin-top: 20px; 
  text-align: center; 
  font-size: 14px; 
}

.register-footer a { 
  color: #1890ff; 
  font-weight: 600; 
  cursor: pointer; 
  text-decoration: underline; 
}
</style>