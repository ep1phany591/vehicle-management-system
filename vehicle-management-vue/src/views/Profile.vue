<!-- src/views/Profile.vue -->
<template>
  <div class="profile-page">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <button @click="$router.back()" class="back-btn">
          <van-icon name="arrow-left" />
        </button>
        <h1>个人中心</h1>
      </div>
      <div class="header-right">
        <button @click="openEditModal" class="edit-btn">
          <van-icon name="edit" /> 编辑信息
        </button>
      </div>
    </div>
    
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="triggerAvatarUpload">
          <img 
            :src="user.avatar ? getAvatarUrl(user.avatar) : 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'" 
            alt="头像" 
            class="avatar"
          >
          <div class="avatar-overlay">
            <van-icon name="photo" size="20" />
            <span>更换头像</span>
          </div>
        </div>
        <input
          type="file"
          ref="avatarInput"
          accept="image/jpeg,image/png,image/jpg"
          @change="handleAvatarUpload"
          style="display: none;"
        >
      </div>
      
      <div class="user-info">
        <h3>{{ user.real_name || '用户' }}</h3>
        <div class="user-role">
          <span class="role-badge" :class="user.role">{{ getRoleText(user.role) }}</span>
        </div>
        <p class="user-id">ID: {{ user.user_id || '--' }}</p>
      </div>
    </div>
    
    <!-- 个人信息详情 -->
    <div class="info-section">
      <h3 class="section-title">个人信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">
            <van-icon name="phone" />
            <span>手机号</span>
          </div>
          <div class="info-value">{{ user.phone || '未绑定' }}</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <van-icon name="cluster" />
            <span>所属部门</span>
          </div>
          <div class="info-value">{{ user.department || '未设置' }}</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <van-icon name="user-circle" />
            <span>职位</span>
          </div>
          <div class="info-value">{{ user.position || '未设置' }}</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <van-icon name="chart-trending" />
            <span>本月行程</span>
          </div>
          <div class="info-value">{{ user.monthly_trips || 0 }} 次</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <van-icon name="road" />
            <span>总里程</span>
          </div>
          <div class="info-value">{{ user.total_mileage || '0.00' }} 公里</div>
        </div>
        
        <div class="info-item">
          <div class="info-label">
            <van-icon name="clock" />
            <span>注册时间</span>
          </div>
          <div class="info-value">{{ formatDate(user.created_at) }}</div>
        </div>
      </div>
    </div>
    
    <!-- 操作区域 -->
    <div class="action-section">
      <van-button 
        block 
        type="primary" 
        class="update-password-btn"
        @click="openPasswordModal"
      >
        <van-icon name="lock" />
        修改密码
      </van-button>
      
      <van-button 
        block 
        type="danger" 
        class="logout-btn"
        @click="logout"
      >
        <van-icon name="revoke" />
        退出登录
      </van-button>
    </div>
    
    <!-- 编辑信息模态框 -->
    <van-popup 
      v-model:show="showEditModal" 
      round 
      :style="{ width: '500px', padding: '0' }"
      :close-on-click-overlay="false"
      class="edit-modal"
      teleport="body"
    >
      <div class="modal-wrapper">
        <div class="modal-header">
          <h3>
            <van-icon name="edit" />
            编辑个人信息
          </h3>
          <van-icon name="cross" class="close-icon" @click="closeEditModal" />
        </div>
        
        <div class="modal-body">
          <van-form @submit="updateProfile" :disabled="isUpdating">
            <van-cell-group inset class="no-border">
              <van-field 
                v-model="editForm.real_name" 
                label="真实姓名" 
                placeholder="请输入姓名" 
                required 
                :rules="[{ required: true, message: '请输入姓名' }]"
              />
              
              <van-field 
                v-model="editForm.phone" 
                label="手机号" 
                placeholder="请输入手机号" 
                type="tel"
                :rules="[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                ]"
              />
              
              <van-field 
                v-model="editForm.department" 
                label="所属部门" 
                placeholder="请输入部门" 
              />
              
              <!-- 显示当前职位（只读） -->
              <van-field 
                :value="user.position || '未设置'" 
                label="当前职位" 
                readonly
                input-align="right"
              >
                <template #input>
                  <span style="color: #666;">{{ user.position || '未设置' }}</span>
                  <small style="color: #999; margin-left: 8px;">(职位由管理员设定)</small>
                </template>
              </van-field>
              
              <!-- 显示当前角色（只读） -->
              <van-field 
                :value="getRoleText(user.role)" 
                label="用户角色" 
                readonly
                input-align="right"
              >
                <template #input>
                  <span :class="['role-badge', user.role]" style="display: inline-block;">
                    {{ getRoleText(user.role) }}
                  </span>
                  <small style="color: #999; margin-left: 8px;">(角色由管理员设定)</small>
                </template>
              </van-field>
            </van-cell-group>
            
            <div class="modal-footer">
              <van-button 
                round 
                block 
                type="default" 
                @click="closeEditModal"
                class="cancel-btn"
              >
                取消
              </van-button>
              <van-button 
                round 
                block 
                type="primary" 
                native-type="submit" 
                :loading="isUpdating"
                class="submit-btn"
              >
                保存修改
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>
    
    <!-- 修改密码模态框 -->
    <van-popup 
      v-model:show="showPasswordModal" 
      round 
      :style="{ width: '450px', padding: '0' }"
      :close-on-click-overlay="false"
      class="password-modal"
      teleport="body"
    >
      <div class="modal-wrapper">
        <div class="modal-header">
          <h3>
            <van-icon name="lock" />
            修改密码
          </h3>
          <van-icon name="cross" class="close-icon" @click="closePasswordModal" />
        </div>
        
        <div class="modal-body">
          <van-form @submit="updatePassword" :disabled="isChangingPassword">
            <van-cell-group inset class="no-border">
              <van-field 
                v-model="passwordForm.oldPassword" 
                label="原密码" 
                placeholder="请输入原密码" 
                type="password"
                required
                :rules="[{ required: true, message: '请输入原密码' }]"
              />
              
              <van-field 
                v-model="passwordForm.newPassword" 
                label="新密码" 
                placeholder="请输入新密码" 
                type="password"
                required
                :rules="[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度不能少于6位' }
                ]"
              />
              
              <van-field 
                v-model="passwordForm.confirmPassword" 
                label="确认密码" 
                placeholder="请再次输入新密码" 
                type="password"
                required
                :rules="[
                  { required: true, message: '请确认新密码' },
                  { validator: validateConfirmPassword, message: '两次输入的密码不一致' }
                ]"
              />
            </van-cell-group>
            
            <div class="modal-footer">
              <van-button 
                round 
                block 
                type="default" 
                @click="closePasswordModal"
                class="cancel-btn"
              >
                取消
              </van-button>
              <van-button 
                round 
                block 
                type="primary" 
                native-type="submit" 
                :loading="isChangingPassword"
                class="submit-btn"
              >
                确认修改
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>
    
    <!-- 加载中 -->
    <van-overlay :show="isLoading" class="loading-overlay">
      <van-loading type="spinner" color="#1989fa" />
    </van-overlay>
  </div>
</template>

<script>
import { 
  Popup, Form, Field, CellGroup, Button, Icon, Loading, Overlay, 
  showToast, showConfirmDialog, showSuccessToast, showFailToast 
} from 'vant';
import api from '@/api';

export default {
  name: 'Profile',
  components: {
    [Popup.name]: Popup, 
    [Form.name]: Form, 
    [Field.name]: Field,
    [CellGroup.name]: CellGroup, 
    [Button.name]: Button, 
    [Icon.name]: Icon,
    [Loading.name]: Loading,
    [Overlay.name]: Overlay
  },
  data() {
    return {
      user: {},
      showEditModal: false,
      showPasswordModal: false,
      isLoading: false,
      isUpdating: false,
      isChangingPassword: false,
      editForm: {
        real_name: '',
        phone: '',
        department: ''
      },
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    };
  },
  mounted() {
    this.loadUserInfo();
  },
  methods: {
    async loadUserInfo() {
      try {
        this.isLoading = true;
        
        // 尝试从API获取最新用户信息
        try {
          const res = await api.user.getProfile();
          if (res && res.success) {
            this.user = res.data;
            localStorage.setItem('user', JSON.stringify(res.data));
            this.populateEditForm();
          } else {
            // 如果API调用失败，从localStorage加载
            const userData = localStorage.getItem('user');
            if (userData) {
              this.user = JSON.parse(userData);
              this.populateEditForm();
            }
          }
        } catch (apiError) {
          console.log('API获取用户信息失败，使用本地数据:', apiError);
          const userData = localStorage.getItem('user');
          if (userData) {
            this.user = JSON.parse(userData);
            this.populateEditForm();
          }
        }
        
      } catch (error) {
        console.error('加载用户信息失败:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    populateEditForm() {
      this.editForm = {
        real_name: this.user.real_name || '',
        phone: this.user.phone || '',
        department: this.user.department || ''
        // 注意：移除了position，普通用户不能修改职位
      };
    },
    
    getAvatarUrl(avatarPath) {
      if (!avatarPath) return '';
      // 如果已经是完整URL，直接返回
      if (avatarPath.startsWith('http')) return avatarPath;
      // 否则拼接基础URL
      const baseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';
      return baseUrl + avatarPath;
    },
    
    getRoleText(role) {
      const roleMap = {
        admin: '管理员',
        leader: '领导',
        manager: '车队队长',
        driver: '司机',
        employee: '员工',
        user: '用户'
      };
      return roleMap[role] || role;
    },
    
    formatDate(dateString) {
      if (!dateString) return '--';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },
    
    // 打开编辑模态框
    openEditModal() {
      this.showEditModal = true;
    },
    
    closeEditModal() {
      this.showEditModal = false;
      this.populateEditForm();
    },
    
    // 打开修改密码模态框
    openPasswordModal() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.showPasswordModal = true;
    },
    
    closePasswordModal() {
      this.showPasswordModal = false;
    },
    
    // 验证确认密码
    validateConfirmPassword(val) {
      return val === this.passwordForm.newPassword;
    },
    
    // 触发头像上传
    triggerAvatarUpload() {
      this.$refs.avatarInput.click();
    },
    
    // 处理头像上传
    async handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 验证文件类型和大小
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        showToast('请上传 JPG 或 PNG 格式的图片');
        return;
      }
      
      if (file.size > maxSize) {
        showToast('图片大小不能超过 5MB');
        return;
      }
      
      try {
        this.isLoading = true;
        const formData = new FormData();
        formData.append('avatar_file', file);
        
        // 调用API更新头像 - 使用个人中心的updateProfile接口
        const res = await api.user.updateProfile(formData);
        
        if (res && res.success) {
          // 更新本地用户信息
          this.user.avatar = res.avatar || this.user.avatar;
          if (res.data) {
            Object.keys(res.data).forEach(key => {
              if (res.data[key] !== undefined) {
                this.user[key] = res.data[key];
              }
            });
          }
          localStorage.setItem('user', JSON.stringify(this.user));
          
          showSuccessToast('头像更新成功');
        } else {
          showFailToast(res?.message || '头像更新失败');
        }
      } catch (error) {
        console.error('头像上传失败:', error);
        showFailToast(error.response?.data?.message || '头像上传失败');
      } finally {
        this.isLoading = false;
        this.$refs.avatarInput.value = '';
      }
    },
    
    // 更新个人信息
    async updateProfile() {
      try {
        this.isUpdating = true;
        
        // 构建FormData - 只包含允许修改的字段
        const formData = new FormData();
        formData.append('real_name', this.editForm.real_name);
        formData.append('phone', this.editForm.phone);
        if (this.editForm.department) {
          formData.append('department', this.editForm.department);
        }
        
        // 调用API更新用户信息 - 使用个人中心的updateProfile接口
        const res = await api.user.updateProfile(formData);
        
        if (res && res.success) {
          // 更新本地用户信息
          this.user.real_name = this.editForm.real_name;
          this.user.phone = this.editForm.phone;
          this.user.department = this.editForm.department;
          
          // 更新头像信息
          if (res.avatar) {
            this.user.avatar = res.avatar;
          }
          
          // 如果有完整数据返回，更新所有字段
          if (res.data) {
            Object.keys(res.data).forEach(key => {
              if (res.data[key] !== undefined) {
                this.user[key] = res.data[key];
              }
            });
          }
          
          // 保存到localStorage
          localStorage.setItem('user', JSON.stringify(this.user));
          
          showSuccessToast('个人信息更新成功');
          this.showEditModal = false;
        } else {
          showFailToast(res?.message || '更新失败');
        }
      } catch (error) {
        console.error('更新个人信息失败:', error);
        showFailToast(error.response?.data?.message || '更新失败，请稍后重试');
      } finally {
        this.isUpdating = false;
      }
    },
    
    // 修改密码
    async updatePassword() {
      try {
        this.isChangingPassword = true;
        
        // 验证新密码和确认密码是否一致
        if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
          showFailToast('两次输入的密码不一致');
          return;
        }
        
        // 验证新密码长度
        if (this.passwordForm.newPassword.length < 6) {
          showFailToast('新密码长度不能少于6位');
          return;
        }
        
        // 验证新旧密码不能相同
        if (this.passwordForm.oldPassword === this.passwordForm.newPassword) {
          showFailToast('新密码不能与原密码相同');
          return;
        }
        
        // 调用修改密码的API
        const res = await api.user.changePassword({
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword
        });
        
        if (res && res.success) {
          showSuccessToast('密码修改成功');
          this.showPasswordModal = false;
          this.passwordForm = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
          
          // 提示重新登录
          showConfirmDialog({
            title: '密码已修改',
            message: '密码修改成功，建议重新登录',
            confirmButtonText: '重新登录',
            cancelButtonText: '稍后'
          }).then(() => {
            this.logout();
          }).catch(() => {});
        } else {
          showFailToast(res?.message || '密码修改失败');
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        showFailToast(error.response?.data?.message || '修改密码失败');
      } finally {
        this.isChangingPassword = false;
      }
    },
    
    // 退出登录
    logout() {
      showConfirmDialog({
        title: '确认退出',
        message: '确定要退出登录吗？',
        confirmButtonColor: '#ee0a24'
      }).then(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.$router.push('/login');
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
/* 整体样式 */
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #1890ff;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background-color: #f0f2f5;
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.edit-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.edit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 用户卡片样式 */
.user-card {
  background: white;
  margin: 20px;
  padding: 30px 20px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #52c41a, #faad14, #f5222d);
}

.avatar-section {
  margin-bottom: 20px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  width: 100px;
  height: 100px;
  margin: 0 auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.user-info {
  margin-top: 15px;
}

.user-info h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
}

.user-role {
  margin-bottom: 8px;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  color: white;
}

.role-badge.manager {
  background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
  color: white;
}

.role-badge.driver {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
}

.role-badge.leader {
  background: linear-gradient(135deg, #722ed1 0%, #391085 100%);
  color: white;
}

.role-badge.employee {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.user-id {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
  font-family: 'Courier New', monospace;
}

/* 信息区域样式 */
.info-section {
  background: white;
  margin: 20px;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  transition: all 0.3s;
}

.info-item:hover {
  background: #f0f2f5;
  transform: translateY(-2px);
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #595959;
  font-size: 14px;
}

.info-label .van-icon {
  color: #1890ff;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  word-break: break-word;
}

/* 操作区域样式 */
.action-section {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.update-password-btn,
.logout-btn {
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.update-password-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
}

.update-password-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3);
}

.logout-btn {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  border: none;
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 77, 79, 0.3);
}

/* 模态框样式 */
.edit-modal,
.password-modal {
  overflow: visible !important;
}

.modal-wrapper {
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  padding: 24px 30px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-icon {
  font-size: 22px;
  color: white;
  cursor: pointer;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #f0f0f0;
}

.modal-body {
  padding: 30px 20px;
}

:deep(.van-field__label) {
  font-size: 15px;
  font-weight: 500;
  color: #595959;
}

:deep(.van-field__value) {
  font-size: 15px;
}

:deep(.van-field__control) {
  font-size: 15px;
}

:deep(.van-field--readonly .van-field__control) {
  color: #666;
}

.modal-footer {
  padding: 20px 0 0;
  display: flex;
  gap: 15px;
}

.cancel-btn,
.submit-btn {
  height: 46px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
}

.cancel-btn {
  background: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.submit-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
}

/* 加载中样式 */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay :deep(.van-loading) {
  transform: scale(1.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .header h1 {
    font-size: 18px;
  }
  
  .edit-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .avatar-wrapper {
    width: 80px;
    height: 80px;
  }
  
  .user-info h3 {
    font-size: 20px;
  }
}
</style>