<template>
  <div class="admin-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="icon-box"><van-icon name="manager" /></div>
          <div>
            <h2>用户管理中心</h2>
            <p>实时监控并管理系统内部成员权限与职位信息</p>
          </div>
        </div>
        <div class="header-right">
          <van-button icon="plus" type="success" class="add-btn" @click="openAddModal">录入新成员</van-button>
        </div>
      </div>
    </div>

    <div class="action-bar-card">
      <van-search
        v-model="searchQuery"
        placeholder="搜索姓名、工号、手机或职位..."
        shape="round"
        background="transparent"
        class="custom-search"
      />
      <van-button icon="replay" plain round type="primary" size="small" class="refresh-btn" @click="fetchUsers">刷新列表</van-button>
    </div>

    <div class="table-container">
      <table class="modern-table">
        <thead>
          <tr>
            <th style="width: 70px;">头像</th>
            <th>成员标识</th>
            <th>基本信息</th>
            <th>联系方式</th>
            <th>所属部门</th>
            <th class="text-center">操作选项</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.user_id" class="table-row">
            <!-- 头像列 -->
            <td class="avatar-cell">
              <div class="avatar-wrapper" @click="previewAvatar(user.avatar, user.real_name)">
                <div class="avatar-img-box">
                  <img 
                    v-if="user.avatar" 
                    :src="getAvatarUrl(user.avatar)" 
                    :alt="user.real_name"
                    class="user-avatar"
                    @error="handleAvatarError"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ getInitials(user.real_name) }}
                  </div>
                </div>
                <div v-if="user.avatar" class="avatar-hint">点击查看</div>
              </div>
            </td>
            
            <td><span class="id-badge">{{ user.user_id }}</span></td>
            <td>
              <div class="user-info">
                <span class="user-name">{{ user.real_name }}</span>
                <span class="user-pos-tag">{{ user.position || '待定职位' }}</span>
              </div>
            </td>
            <td><span class="phone-text">{{ user.phone || '未绑定' }}</span></td>
            <td>
              <div class="dept-box">
                <van-tag type="primary" plain size="medium">{{ user.department || '总部' }}</van-tag>
                <div :class="['role-dot', user.role]"></div>
                <span class="role-text">{{ translateRole(user.role) }}</span>
              </div>
            </td>
            <td class="ops-cell">
              <van-button size="small" plain type="primary" @click="openEditModal(user)">编辑</van-button>
              <van-button size="small" plain type="warning" @click="openPasswordModal(user, true)">重置密码</van-button>
              <van-button size="small" plain type="danger" @click="deleteUser(user.user_id)">移除</van-button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredUsers.length === 0" class="empty-holder">
        <van-icon name="notes-o" size="60" color="#ccc" />
        <p>暂无符合搜索条件的成员</p>
      </div>
    </div>

    <!-- 用户信息编辑/添加模态框 -->
    <van-popup 
      v-model:show="showModal" 
      round 
      :style="{ width: '500px', padding: '0' }"
      :close-on-click-overlay="false"
      class="center-glass-modal"
      teleport="body"
    >
      <div class="modal-wrapper">
        <div class="modal-header">
          <h3>
            <van-icon :name="isEdit ? 'edit' : 'add-o'" />
            {{ isEdit ? '修改成员档案' : '录入新成员' }}
          </h3>
          <van-icon name="cross" class="close-icon" @click="showModal = false" />
        </div>

        <div class="modal-body">
          <van-form @submit="handleSubmit">
            <!-- 头像上传区域 -->
            <div class="form-group-title">个人头像</div>
            <div class="avatar-upload-section">
              <div class="current-avatar-box" @click="triggerAvatarUpload">
                <div v-if="avatarPreviewUrl" class="avatar-preview-img">
                  <img :src="avatarPreviewUrl" alt="头像预览" />
                </div>
                <div v-else class="avatar-upload-placeholder">
                  <van-icon name="photo" size="30" color="#ccc" />
                  <p>点击上传头像</p>
                  <small>支持 JPG/PNG，建议 200×200</small>
                </div>
                <div class="avatar-upload-mask">
                  <van-icon name="edit" size="20" />
                </div>
              </div>
              <input
                type="file"
                ref="avatarInput"
                accept="image/jpeg,image/png,image/jpg"
                @change="handleAvatarChange"
                style="display: none;"
              />
              <div class="avatar-upload-actions">
                <van-button type="primary" size="small" plain @click="triggerAvatarUpload">
                  选择图片
                </van-button>
                <van-button 
                  v-if="avatarFile" 
                  type="danger" 
                  size="small" 
                  plain 
                  @click="removeAvatarFile"
                >
                  移除
                </van-button>
              </div>
            </div>

            <div class="form-group-title">账户核心</div>
            <van-cell-group inset class="no-border">
              <van-field 
                v-if="!isEdit"
                v-model="editingForm.user_id" 
                label="账号 ID" 
                placeholder="建议输入工号" 
                required 
              />
              <van-field v-model="editingForm.real_name" label="真实姓名" placeholder="请输入姓名" required />
              <van-field v-model="editingForm.position" label="职位名称" placeholder="如：总工程师" />
            </van-cell-group>

            <div class="form-group-title">联系与权限</div>
            <van-cell-group inset class="no-border">
              <van-field v-model="editingForm.phone" label="联系手机" placeholder="11位手机号" type="tel" />
              <van-field v-model="editingForm.department" label="所属部门" placeholder="请输入部门名称" />
              <van-field label="访问角色">
                <template #input>
                  <select v-model="editingForm.role" class="glass-select">
                    <option value="employee">普通员工</option>
                    <option value="driver">前台司机</option>
                    <option value="manager">车队主管</option>
                    <option value="admin">系统管理员</option>
                  </select>
                </template>
              </van-field>
            </van-cell-group>

            <div class="modal-footer">
              <van-button round block type="primary" native-type="submit" :loading="isSubmitting" class="submit-btn">
                确认提交
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
      class="center-glass-modal"
      teleport="body"
    >
      <div class="modal-wrapper">
        <div class="modal-header">
          <h3>
            <van-icon name="lock" />
            重置密码
          </h3>
          <van-icon name="cross" class="close-icon" @click="showPasswordModal = false" />
        </div>

        <div class="modal-body">
          <van-form @submit="handlePasswordSubmit">
            <div class="form-group-title">密码信息</div>
            <van-cell-group inset class="no-border">
              <!-- 管理员重置他人密码，不需要旧密码 -->
              <van-field 
                v-if="!isAdminModifying"
                v-model="passwordForm.oldPassword"
                :type="showOldPassword ? 'text' : 'password'"
                label="旧密码"
                placeholder="请输入当前密码"
                :right-icon="showOldPassword ? 'eye-o' : 'closed-eye'"
                @click-right-icon="showOldPassword = !showOldPassword"
                required
              />
              
              <van-field 
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                label="新密码"
                placeholder="请输入新密码（6-20位）"
                :right-icon="showNewPassword ? 'eye-o' : 'closed-eye'"
                @click-right-icon="showNewPassword = !showNewPassword"
                required
                :rules="[
                  { required: true, message: '请输入新密码' },
                  { validator: validatePassword, message: '密码需6-20位，包含字母和数字' }
                ]"
              />
              
              <van-field 
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="确认密码"
                placeholder="请再次输入新密码"
                :right-icon="showConfirmPassword ? 'eye-o' : 'closed-eye'"
                @click-right-icon="showConfirmPassword = !showConfirmPassword"
                required
                :rules="[
                  { validator: validateConfirmPassword, message: '两次输入的密码不一致' }
                ]"
              />
            </van-cell-group>

            <!-- 密码强度提示 -->
            <div class="password-tips" v-if="passwordForm.newPassword">
              <p>🔐 密码强度：{{ getPasswordStrengthText() }}</p>
              <div class="strength-bar">
                <div 
                  class="strength-level" 
                  :class="'level-' + passwordStrength"
                  :style="{ width: (passwordStrength / 5) * 100 + '%' }"
                ></div>
              </div>
            </div>

            <div class="password-tips">
              <p>🔐 密码安全要求：</p>
              <ul>
                <li>长度6-20位字符</li>
                <li>必须包含字母和数字</li>
                <li>建议使用大小写字母组合</li>
                <li>不要使用简单密码如"123456"</li>
              </ul>
            </div>

            <div class="modal-footer">
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
  </div>
</template>

<script>
import api from '@/api';
import { 
  Popup, Form, Field, CellGroup, Button, Icon, Search, Tag, 
  showImagePreview, showToast, showConfirmDialog 
} from 'vant';

export default {
  name: 'AdminUserManagement',
  components: {
    'van-popup': Popup,
    'van-form': Form,
    'van-field': Field,
    'van-cell-group': CellGroup,
    'van-button': Button,
    'van-icon': Icon,
    'van-search': Search,
    'van-tag': Tag,
    // 删除 van-image-preview 组件的注册
  },
  data() {
    return {
      users: [],
      searchQuery: '',
      showModal: false,
      showPasswordModal: false,
      isEdit: false,
      isSubmitting: false,
      isChangingPassword: false,
      avatarFile: null,
      avatarPreviewUrl: null,
      showOldPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      isAdminModifying: true,
      passwordStrength: 0,
      currentUserId: '',
      editingUserInfo: {},
      editingForm: {
        user_id: '', 
        real_name: '', 
        position: '', 
        phone: '', 
        department: '', 
        role: 'employee', 
        fleet_id: '',
        avatar: ''
      },
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    };
  },
  computed: {
    filteredUsers() {
      if (!Array.isArray(this.users)) return [];
      
      const q = this.searchQuery ? this.searchQuery.toLowerCase().trim() : '';
      if (!q) return this.users;

      return this.users.filter(u => {
        if (!u) return false;
        const name = u.real_name || '';
        const phone = u.phone || '';
        const id = u.user_id || '';
        const pos = u.position || '';
        const dept = u.department || '';
        
        return (name + phone + id + pos + dept).toLowerCase().includes(q);
      });
    }
  },
  watch: {
    'passwordForm.newPassword'(newVal) {
      if (newVal) {
        this.passwordStrength = this.calculatePasswordStrength(newVal);
      } else {
        this.passwordStrength = 0;
      }
    }
  },
  created() { 
    this.fetchUsers(); 
  },
  methods: {
    async fetchUsers() {
      try {
        const res = await api.user.getAll();
        console.log('📡 原始响应:', res); 
        
        if (res && res.success) {
          this.users = Array.isArray(res.users) ? res.users : (Array.isArray(res.data) ? res.data : []);
        } else {
          this.users = Array.isArray(res) ? res : [];
        }
        
        console.log('✅ 最终渲染条数:', this.users.length);
      } catch (error) {
        console.error('获取用户数据失败:', error);
        this.users = []; 
        showToast('获取数据失败');
      }
    },
    
    getAvatarUrl(avatarPath) {
      if (!avatarPath || avatarPath === 'null' || avatarPath === 'undefined') return '';
      if (avatarPath.startsWith('http')) return avatarPath;
      const baseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';
      const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
      return baseUrl + path;
    },
    
    handleAvatarError(event) {
      const img = event.target;
      img.style.display = 'none';
      const parent = img.parentElement;
      if (parent.querySelector('.avatar-placeholder')) return;
      
      const placeholder = document.createElement('div');
      placeholder.className = 'avatar-placeholder';
      placeholder.textContent = this.getInitials(img.alt);
      parent.appendChild(placeholder);
    },
    
    getInitials(name) {
      if (!name || name === 'undefined') return '?';
      return name.charAt(0).toUpperCase();
    },
    
    translateRole(role) {
      const map = { 'admin': '管理员', 'driver': '司机', 'employee': '员工', 'manager': '主管' };
      return map[role] || role;
    },
    
    previewAvatar(avatarUrl, userName) {
      if (!avatarUrl) {
        showToast(`${userName || '该用户'}没有设置头像`);
        return;
      }
      const fullUrl = this.getAvatarUrl(avatarUrl);
      // 使用函数式调用图片预览
      showImagePreview({
        images: [fullUrl],
        closeable: true,
        showIndex: false,
        teleport: 'body',
        className: 'avatar-preview-modal',
      });
    },
    
    openAddModal() {
      this.isEdit = false;
      this.avatarFile = null;
      this.avatarPreviewUrl = null;
      this.editingForm = { 
        user_id: '', real_name: '', position: '', 
        phone: '', department: '', role: 'employee', 
        fleet_id: '', avatar: '' 
      };
      this.showModal = true;
    },
    
    openEditModal(user) {
      this.isEdit = true;
      this.editingForm = { ...user };
      this.avatarFile = null;
      this.avatarPreviewUrl = user.avatar ? this.getAvatarUrl(user.avatar) : null;
      this.showModal = true;
    },
    
    openPasswordModal(user, isAdmin = true) {
      this.currentUserId = user.user_id;
      this.editingUserInfo = { ...user };
      this.isAdminModifying = isAdmin;
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.showOldPassword = false;
      this.showNewPassword = false;
      this.showConfirmPassword = false;
      this.passwordStrength = 0;
      this.showPasswordModal = true;
    },
    
    triggerAvatarUpload() {
      this.$refs.avatarInput.click();
    },
    
    handleAvatarChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        showToast('请上传图片格式文件');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('图片大小不能超过 5MB');
        return;
      }
      
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = (e) => { this.avatarPreviewUrl = e.target.result; };
      reader.readAsDataURL(file);
    },
    
    removeAvatarFile() {
      this.avatarFile = null;
      this.avatarPreviewUrl = null;
      if (this.$refs.avatarInput) {
        this.$refs.avatarInput.value = '';
      }
    },
    
    async handleSubmit() {
      if (!this.editingForm.real_name || (!this.isEdit && !this.editingForm.user_id)) {
        showToast('请完善必填信息');
        return;
      }
      
      this.isSubmitting = true;
      try {
        const formData = new FormData();
        Object.keys(this.editingForm).forEach(key => {
          const val = this.editingForm[key];
          if (val !== null && val !== undefined && val !== '') {
            formData.append(key, val);
          }
        });
        
        if (this.avatarFile) {
          formData.append('avatar_file', this.avatarFile);
        }
        
        const res = this.isEdit 
          ? await api.user.updateUser(this.editingForm.user_id, formData)
          : await api.user.add(formData);
        
        if (res && res.success) {
          showToast({ message: '操作成功', type: 'success' });
          this.showModal = false;
          this.fetchUsers();
        } else {
          showToast(res?.message || '操作失败');
        }
      } catch (err) {
        console.error('提交失败:', err);
        showToast(err.response?.data?.message || '连接服务器失败');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    async handlePasswordSubmit() {
      if (!this.isAdminModifying && !this.passwordForm.oldPassword) {
        showToast('请输入旧密码');
        return;
      }
      
      if (!this.passwordForm.newPassword) {
        showToast('请输入新密码');
        return;
      }
      
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        showToast('两次输入的新密码不一致');
        return;
      }
      
      if (!this.validatePassword(this.passwordForm.newPassword)) {
        showToast('新密码不符合安全要求');
        return;
      }
      
      this.isChangingPassword = true;
      
      try {
        if (this.isAdminModifying) {
          // 管理员重置密码 - 调用 resetPassword
          const res = await api.user.resetPassword(this.currentUserId, {
            newPassword: this.passwordForm.newPassword
          });
          
          if (res && res.success) {
            showToast({ 
              message: '密码重置成功', 
              type: 'success',
              duration: 2000 
            });
            this.showPasswordModal = false;
          } else {
            showToast(res?.message || '密码重置失败');
          }
        } else {
          // 用户自己修改密码 - 调用 changePassword
          const res = await api.user.changePassword({
            oldPassword: this.passwordForm.oldPassword,
            newPassword: this.passwordForm.newPassword
          });
          
          if (res && res.success) {
            showToast({ 
              message: '密码修改成功', 
              type: 'success',
              duration: 2000 
            });
            this.showPasswordModal = false;
            
            showToast({ 
              message: '请使用新密码重新登录', 
              duration: 3000 
            });
          } else {
            showToast(res?.message || '密码修改失败');
          }
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        showToast(error.response?.data?.message || '修改密码失败，请稍后重试');
      } finally {
        this.isChangingPassword = false;
      }
    },
    
    validatePassword(val) {
      if (!val) return false;
      if (val.length < 6 || val.length > 20) return false;
      if (!/[A-Za-z]/.test(val)) return false;
      if (!/\d/.test(val)) return false;
      return true;
    },
    
    validateConfirmPassword(val) {
      return val === this.passwordForm.newPassword;
    },
    
    calculatePasswordStrength(password) {
      if (!password) return 0;
      
      let strength = 0;
      if (password.length >= 6) strength++;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      
      return Math.min(strength, 5);
    },
    
    getPasswordStrengthText() {
      const texts = ['非常弱', '弱', '中等', '较强', '强'];
      return texts[this.passwordStrength - 1] || '无';
    },
    
    async deleteUser(id) {
      showConfirmDialog({
        title: '移除警告',
        message: `确定要永久删除账号 ${id} 吗？`,
        confirmButtonColor: '#ee0a24'
      }).then(async () => {
        try {
          const res = await api.user.delete(id);
          if (res && res.success) {
            showToast('删除成功');
            this.fetchUsers();
          }
        } catch (e) {
          showToast('删除失败');
        }
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.admin-container {
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

.add-btn {
  background: #4caf50;
  border: none;
  border-radius: 8px;
  font-weight: 500;
}

.action-bar-card {
  background: white;
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.custom-search {
  flex: 1;
  max-width: 600px;
}

.refresh-btn {
  margin-left: 15px;
}

.table-container {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table thead {
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
}

.modern-table th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
}

.modern-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.modern-table tbody tr:hover {
  background-color: #f8f9fa;
}

.modern-table td {
  padding: 14px 12px;
  vertical-align: middle;
}

.avatar-cell {
  padding: 8px 12px !important;
}

.avatar-wrapper {
  cursor: pointer;
  text-align: center;
}

.avatar-img-box {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
  border: 2px solid #e0e0e0;
  background: #f5f5f5;
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.avatar-hint {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  opacity: 0.7;
}

.id-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-pos-tag {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.phone-text {
  color: #555;
  font-weight: 500;
}

.dept-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.role-dot.admin {
  background: #f44336;
}

.role-dot.manager {
  background: #ff9800;
}

.role-dot.driver {
  background: #2196f3;
}

.role-dot.employee {
  background: #4caf50;
}

.role-text {
  color: #666;
  font-size: 13px;
}

.ops-cell {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.ops-cell .van-button {
  min-width: 80px;
  margin: 2px 0;
  border-radius: 6px;
}

.empty-holder {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-holder p {
  margin-top: 15px;
  font-size: 16px;
}

.text-center {
  text-align: center;
}

.center-glass-modal {
  overflow: hidden;
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

.form-group-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 20px 0 15px 5px;
  padding-left: 10px;
  border-left: 4px solid #1976d2;
}

.no-border {
  border: none !important;
  box-shadow: none !important;
}

.avatar-upload-section {
  text-align: center;
  margin-bottom: 20px;
}

.current-avatar-box {
  width: 120px;
  height: 120px;
  margin: 0 auto 15px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 2px dashed #ccc;
  background: #f8f9fa;
}

.current-avatar-box:hover {
  border-color: #1976d2;
}

.avatar-preview-img {
  width: 100%;
  height: 100%;
}

.avatar-preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.avatar-upload-placeholder p {
  margin: 8px 0 4px;
  font-size: 14px;
}

.avatar-upload-placeholder small {
  font-size: 11px;
}

.avatar-upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.current-avatar-box:hover .avatar-upload-mask {
  opacity: 1;
}

.avatar-upload-mask .van-icon {
  color: white;
}

.avatar-upload-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.glass-select {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  color: #333;
  outline: none;
  transition: border-color 0.3s;
}

.glass-select:focus {
  border-color: #1976d2;
}

.modal-footer {
  margin-top: 30px;
  padding: 0 10px;
}

.submit-btn {
  background: linear-gradient(90deg, #1976d2 0%, #2196f3 100%);
  border: none;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
}

.password-tips {
  margin: 15px 0;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1989fa;
  font-size: 13px;
  color: #666;
}

.password-tips p {
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #333;
}

.password-tips ul {
  margin: 0;
  padding-left: 18px;
  line-height: 1.6;
}

.password-tips li {
  margin-bottom: 4px;
}

.strength-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin: 8px 0;
  overflow: hidden;
}

.strength-level {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.strength-level.level-1 {
  background: #ff5252;
}

.strength-level.level-2 {
  background: #ff9800;
}

.strength-level.level-3 {
  background: #ffc107;
}

.strength-level.level-4 {
  background: #8bc34a;
}

.strength-level.level-5 {
  background: #4caf50;
}
</style>

<style>
/* 全局样式，用于图片预览 */
.avatar-preview-modal .van-image-preview__cover {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: auto;
}

.avatar-preview-modal .van-image-preview__image {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview-modal .van-image-preview__image img {
  max-width: 80vw;
  max-height: 80vh;
  object-fit: contain;
}
</style>