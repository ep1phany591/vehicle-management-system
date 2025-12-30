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
            <th>成员标识</th>
            <th>基本信息</th>
            <th>联系方式</th>
            <th>所属部门</th>
            <th class="text-center">操作选项</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.user_id" class="table-row">
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
import { Popup, Form, Field, CellGroup, Button, Icon, Search, Tag, showToast, showConfirmDialog } from 'vant';

export default {
  components: {
    [Popup.name]: Popup, [Form.name]: Form, [Field.name]: Field,
    [CellGroup.name]: CellGroup, [Button.name]: Button, [Icon.name]: Icon,
    [Search.name]: Search, [Tag.name]: Tag
  },
  data() {
    return {
      users: [],
      searchQuery: '',
      showModal: false,
      isEdit: false,
      isSubmitting: false,
      editingForm: {
        user_id: '', real_name: '', position: '', 
        phone: '', department: '', role: 'employee', fleet_id: ''
      }
    };
  },
  computed: {
    filteredUsers() {
      const q = this.searchQuery.toLowerCase();
      return this.users.filter(u => 
        (u.real_name + u.phone + u.user_id + (u.position || '')).toLowerCase().includes(q)
      );
    }
  },
  created() { this.fetchUsers(); },
  methods: {
    async fetchUsers() {
      const res = await api.user.getAll();
      this.users = res.success ? res.data : (Array.isArray(res) ? res : []);
    },
    translateRole(role) {
      const map = { 'admin': '管理员', 'driver': '司机', 'employee': '员工', 'manager': '主管' };
      return map[role] || role;
    },
    openAddModal() {
      this.isEdit = false;
      this.editingForm = { user_id: '', real_name: '', position: '', phone: '', department: '', role: 'employee' };
      this.showModal = true;
    },
    openEditModal(user) {
      this.isEdit = true;
      this.editingForm = { ...user };
      this.showModal = true;
    },
    async handleSubmit() {
      this.isSubmitting = true;
      try {
        let res = this.isEdit 
          ? await api.user.updateUser(this.editingForm.user_id, this.editingForm)
          : await api.user.add(this.editingForm);

        if (res) {
          showToast({ message: '操作成功', icon: 'passed' });
          this.showModal = false;
          this.fetchUsers();
        }
      } catch (err) {
        showToast('服务器连接失败');
      } finally { this.isSubmitting = false; }
    },
    async deleteUser(id) {
      showConfirmDialog({
        title: '移除警告',
        message: `确定要永久删除账号 ${id} 吗？`,
        confirmButtonColor: '#ee0a24'
      }).then(async () => {
        const res = await api.user.delete(id);
        if(res.success) this.fetchUsers();
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
  font-size: 16px; /* 提升基础字号 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 顶部页眉 */
.page-header {
  background: linear-gradient(135deg, #1890ff 0%, #0052d9 100%);
  padding: 40px; /* 增大内边距 */
  border-radius: 20px;
  color: white;
  margin-bottom: 30px;
  box-shadow: 0 10px 25px rgba(24, 144, 255, 0.25);
}
.header-content { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 20px; }
.icon-box { background: rgba(255,255,255,0.25); padding: 15px; border-radius: 15px; font-size: 32px; }
.header-left h2 { margin: 0; font-size: 28px; letter-spacing: 1px; } /* 放大标题 */
.header-left p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; } /* 放大描述 */
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
:deep(.van-field__control) { font-size: 17px; } /* 放大搜索输入文字 */

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
  font-size: 16px; /* 放大表头 */
  font-weight: 700;
  border-bottom: 2px solid #f0f2f5; 
}
.table-row:hover { background-color: #f8fbff; }
.table-row td { padding: 22px 20px; border-bottom: 1px solid #f2f4f7; vertical-align: middle; font-size: 16px; }

.id-badge { background: #f0f2f5; color: #475569; padding: 6px 12px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 15px; font-weight: bold; }
.user-name { display: block; font-weight: 700; color: #1a1a1a; font-size: 18px; margin-bottom: 6px; } /* 姓名放大 */
.user-pos-tag { font-size: 14px; color: #1890ff; background: #e6f7ff; padding: 3px 10px; border-radius: 6px; font-weight: 500; }
.phone-text { color: #334155; font-size: 16px; font-weight: 500; }

.dept-box { display: flex; align-items: center; gap: 10px; }
.role-dot { width: 10px; height: 10px; border-radius: 50%; }
.role-text { font-size: 16px; color: #334155; font-weight: 500; }

/* 模态框调优 */
.center-glass-modal { overflow: visible !important; }
.modal-header { padding: 25px 30px; background: #fff; border-bottom: 1px solid #f0f2f5; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 22px; color: #1a1a1a; display: flex; align-items: center; gap: 12px; }
.close-icon { font-size: 24px; color: #94a3b8; cursor: pointer; transition: color 0.2s; }
.close-icon:hover { color: #ef4444; }

.modal-body { padding: 20px 10px 35px; }
.form-group-title { font-size: 14px; color: #1890ff; font-weight: 800; padding: 10px 35px; text-transform: uppercase; letter-spacing: 1px; background: #f0f7ff; margin-bottom: 15px; }

/* 放大 Vant 输入框文字 */
:deep(.van-field__label) { font-size: 17px; font-weight: 600; color: #475569; width: 6em; }
:deep(.van-field__value) { font-size: 17px; }

.glass-select { 
  width: 100%; 
  border: 1px solid #e2e8f0; 
  border-radius: 10px; 
  padding: 12px; 
  background: #f8fafc; 
  outline: none; 
  font-size: 17px;
  color: #1e293b;
}

.modal-footer { padding: 30px 40px 0; }
.submit-btn { height: 55px; font-size: 19px; font-weight: 800; letter-spacing: 2px; }

.empty-holder { padding: 80px 0; text-align: center; color: #94a3b8; }
.empty-holder p { font-size: 18px; margin-top: 15px; }

/* 角色点颜色 */
.role-dot.admin { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
.role-dot.manager { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
.role-dot.driver { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
.role-dot.employee { background: #3b82f6; box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); }
</style>