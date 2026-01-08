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

    <!-- 头像预览模态框 -->
    <van-image-preview
      v-model:show="showAvatarPreview"
      :images="avatarPreviewImages"
      :closeable="true"
      :show-index="false"
      teleport="body"
      class="avatar-preview-modal"
    >
      <template #image="{ src }">
        <img :src="src" class="preview-avatar-img" />
      </template>
    </van-image-preview>

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
  </div>
</template>

<script>
import api from '@/api';
import { 
  Popup, Form, Field, CellGroup, Button, Icon, Search, Tag, 
  ImagePreview, showToast, showConfirmDialog 
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
    'van-image-preview': ImagePreview.Component // 修复报错的关键点
  },
  data() {
    return {
      users: [], // 始终保持为数组
      searchQuery: '',
      showModal: false,
      isEdit: false,
      isSubmitting: false,
      showAvatarPreview: false,
      avatarPreviewImages: [],
      avatarFile: null,
      avatarPreviewUrl: null,
      editingForm: {
        user_id: '', 
        real_name: '', 
        position: '', 
        phone: '', 
        department: '', 
        role: 'employee', 
        fleet_id: '',
        avatar: ''
      }
    };
  },
  computed: {
    filteredUsers() {
      // --- 关键修复：增加 this.users 的安全检查 ---
      if (!Array.isArray(this.users)) return [];
      
      const q = this.searchQuery ? this.searchQuery.toLowerCase().trim() : '';
      if (!q) return this.users;

      return this.users.filter(u => {
        if (!u) return false;
        // 使用安全拼接，防止 real_name 等字段为 null 时导致 includes 报错
        const name = u.real_name || '';
        const phone = u.phone || '';
        const id = u.user_id || '';
        const pos = u.position || '';
        
        return (name + phone + id + pos).toLowerCase().includes(q);
      });
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
      if (!avatarPath || avatarPath === 'null') return '';
      if (avatarPath.startsWith('http')) return avatarPath;
      const baseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';
      // 确保路径拼接逻辑正确（是否有斜杠）
      const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
      return baseUrl + path;
    },
    
    handleAvatarError(event) {
      const img = event.target;
      img.style.display = 'none';
      const parent = img.parentElement;
      // 避免重复添加占位符
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
    
    previewAvatar(avatarUrl) {
      if (!avatarUrl) {
        showToast('该用户没有设置头像');
        return;
      }
      const fullUrl = this.getAvatarUrl(avatarUrl);
      this.avatarPreviewImages = [fullUrl];
      this.showAvatarPreview = true;
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
        showToast(err.response?.data?.message || '连接服务器失败');
      } finally {
        this.isSubmitting = false;
      }
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
/* 核心容器 */
.admin-container { 
  padding: 30px; 
  background: #f0f4f8; 
  min-height: 100vh;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 顶部页眉 */
.page-header {
  background: linear-gradient(135deg, #1890ff 0%, #0052d9 100%);
  padding: 40px;
  border-radius: 20px;
  color: white;
  margin-bottom: 30px;
  box-shadow: 0 10px 25px rgba(24, 144, 255, 0.25);
}
.header-content { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 20px; }
.icon-box { background: rgba(255,255,255,0.25); padding: 15px; border-radius: 15px; font-size: 32px; }
.header-left h2 { margin: 0; font-size: 28px; letter-spacing: 1px; }
.header-left p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
.add-btn { height: 50px; font-size: 18px; padding: 0 30px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: bold; }

/* 交互条 */
.action-bar-card {
  background: white;
  padding: 15px 25px;
  border-radius: 16px;
  margin-bottom: 25px;
  display: flex;
  gap: 20px;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
.custom-search { flex: 1; padding: 0; }
:deep(.van-search__content) { background: #f5f7fa; }
:deep(.van-field__control) { font-size: 17px; }

/* 表格美化 */
.table-container {
  background: white;
  border-radius: 20px;
  padding: 15px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.06);
}
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { 
  padding: 20px; 
  text-align: left; 
  color: #444; 
  font-size: 16px;
  font-weight: 700;
  border-bottom: 2px solid #f0f2f5; 
}
.table-row:hover { background-color: #f8fbff; }
.table-row td { 
  padding: 15px 20px; 
  border-bottom: 1px solid #f2f4f7; 
  vertical-align: middle; 
  font-size: 16px; 
}

/* 头像列样式 */
.avatar-cell {
  width: 70px;
  padding: 10px 5px !important;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.avatar-img-box {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.avatar-wrapper:hover .avatar-img-box {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.avatar-hint {
  margin-top: 5px;
  font-size: 11px;
  color: #666;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-hint {
  opacity: 1;
}

/* 其他单元格样式 */
.id-badge { 
  background: #f0f2f5; 
  color: #475569; 
  padding: 6px 12px; 
  border-radius: 8px; 
  font-family: 'Courier New', monospace; 
  font-size: 14px; 
  font-weight: bold; 
}

.user-name { 
  display: block; 
  font-weight: 700; 
  color: #1a1a1a; 
  font-size: 16px; 
  margin-bottom: 6px; 
}

.user-pos-tag { 
  font-size: 13px; 
  color: #1890ff; 
  background: #e6f7ff; 
  padding: 3px 10px; 
  border-radius: 6px; 
  font-weight: 500; 
}

.phone-text { color: #334155; font-size: 15px; font-weight: 500; }

.dept-box { display: flex; align-items: center; gap: 10px; }
.role-dot { width: 10px; height: 10px; border-radius: 50%; }
.role-text { font-size: 15px; color: #334155; font-weight: 500; }

/* 模态框样式 */
.center-glass-modal { overflow: visible !important; }
.modal-header { 
  padding: 25px 30px; 
  background: #fff; 
  border-bottom: 1px solid #f0f2f5; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}
.modal-header h3 { 
  margin: 0; 
  font-size: 22px; 
  color: #1a1a1a; 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}
.close-icon { 
  font-size: 24px; 
  color: #94a3b8; 
  cursor: pointer; 
  transition: color 0.2s; 
}
.close-icon:hover { color: #ef4444; }

.modal-body { padding: 20px 10px 35px; }

/* 头像上传区域 */
.avatar-upload-section {
  padding: 0 30px 20px;
  text-align: center;
}

.current-avatar-box {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 15px;
  border-radius: 50%;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.current-avatar-box:hover {
  border-color: #1890ff;
  background: #f0f7ff;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
}

.avatar-upload-placeholder p {
  margin: 8px 0 4px;
  font-size: 14px;
}

.avatar-upload-placeholder small {
  font-size: 12px;
  color: #cbd5e1;
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
  color: white;
}

.current-avatar-box:hover .avatar-upload-mask {
  opacity: 1;
}

.avatar-upload-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.form-group-title { 
  font-size: 14px; 
  color: #1890ff; 
  font-weight: 800; 
  padding: 10px 35px; 
  text-transform: uppercase; 
  letter-spacing: 1px; 
  background: #f0f7ff; 
  margin-bottom: 15px; 
}

/* 表单字段样式 */
:deep(.van-field__label) { 
  font-size: 16px; 
  font-weight: 600; 
  color: #475569; 
  width: 6em; 
}
:deep(.van-field__value) { font-size: 16px; }

.glass-select { 
  width: 100%; 
  border: 1px solid #e2e8f0; 
  border-radius: 10px; 
  padding: 12px; 
  background: #f8fafc; 
  outline: none; 
  font-size: 16px;
  color: #1e293b;
}

.modal-footer { padding: 30px 40px 0; }
.submit-btn { 
  height: 55px; 
  font-size: 19px; 
  font-weight: 800; 
  letter-spacing: 2px; 
}

.empty-holder { 
  padding: 80px 0; 
  text-align: center; 
  color: #94a3b8; 
}
.empty-holder p { 
  font-size: 18px; 
  margin-top: 15px; 
}

/* 头像预览模态框样式 */
.preview-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 角色点颜色 */
.role-dot.admin { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
.role-dot.manager { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
.role-dot.driver { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
.role-dot.employee { background: #3b82f6; box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); }

/* 操作按钮样式 */
.ops-cell {
  text-align: center;
  white-space: nowrap;
}

.ops-cell .van-button {
  margin: 0 4px;
  font-size: 13px;
  padding: 4px 12px;
}
</style>