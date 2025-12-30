<!-- src/views/Apply.vue -->
<template>
  <div class="apply-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <h1>申请用车</h1>
      <button @click="goBack" class="back-btn">返回</button>
    </div>

    <!-- 申请表单 -->
    <div class="apply-form">
      <div class="form-section">
        <h2 class="section-title">用车信息</h2>
        
        <!-- 用车事由 -->
        <div class="form-group">
          <label class="form-label">用车事由 *</label>
          <textarea 
            v-model="formData.reason" 
            class="form-input textarea"
            placeholder="请填写用车事由（如：客户拜访、会议接送、材料运输等）"
            rows="3"
            maxlength="200"
          ></textarea>
          <div class="char-count">{{ formData.reason.length }}/200</div>
        </div>

        <!-- 乘车人数 -->
        <div class="form-group">
          <label class="form-label">乘车人数 *</label>
          <div class="people-selector">
            <button 
              type="button" 
              class="num-btn"
              :class="{ active: formData.people_count === num }"
              v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
              :key="num"
              @click="formData.people_count = num"
            >
              {{ num }}人
            </button>
            <div class="custom-input">
              <input
                type="number"
                v-model="formData.people_count"
                min="1"
                max="50"
                class="form-input"
                placeholder="其他人数"
              />
              <span class="unit">人</span>
            </div>
          </div>
        </div>

        <!-- 车型选择 -->
        <div class="form-group">
          <label class="form-label">车型选择 *</label>
          <div class="vehicle-options">
            <div 
              v-for="vehicle in vehicleTypes" 
              :key="vehicle.value"
              class="vehicle-option"
              :class="{ 
                selected: formData.vehicle_type === vehicle.value,
                recommended: vehicle.recommended
              }"
              @click="formData.vehicle_type = vehicle.value"
            >
              <div class="vehicle-icon">{{ vehicle.icon }}</div>
              <div class="vehicle-info">
                <div class="vehicle-name">{{ vehicle.name }}</div>
                <div class="vehicle-desc">{{ vehicle.description }}</div>
                <div v-if="vehicle.capacity" class="vehicle-capacity">载客: {{ vehicle.capacity }}人</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2 class="section-title">时间安排</h2>
        
        <!-- 开始时间 -->
        <div class="form-group">
          <label class="form-label">开始时间 *</label>
          <div class="time-input-group">
            <input
              type="date"
              v-model="formData.start_date"
              class="form-input"
              :min="today"
            />
            <input
              type="time"
              v-model="formData.start_time"
              class="form-input"
            />
          </div>
        </div>

        <!-- 结束时间 -->
        <div class="form-group">
          <label class="form-label">结束时间 *</label>
          <div class="time-input-group">
            <input
              type="date"
              v-model="formData.end_date"
              class="form-input"
              :min="formData.start_date || today"
            />
            <input
              type="time"
              v-model="formData.end_time"
              class="form-input"
              :disabled="!formData.start_date"
            />
          </div>
          <div v-if="duration" class="duration-info">
            预计用车时长: <span class="duration-value">{{ duration }}</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2 class="section-title">其他信息</h2>
        
        <!-- 目的地 -->
        <div class="form-group">
          <label class="form-label">目的地</label>
          <input
            type="text"
            v-model="formData.destination"
            class="form-input"
            placeholder="请输入目的地"
          />
        </div>

        <!-- 联系人信息 -->
        <div class="form-row">
          <div class="form-group half">
            <label class="form-label">联系人</label>
            <input
              type="text"
              v-model="formData.contact_person"
              class="form-input"
              placeholder="联系人姓名"
            />
          </div>
          <div class="form-group half">
            <label class="form-label">联系电话</label>
            <input
              type="tel"
              v-model="formData.contact_phone"
              class="form-input"
              placeholder="联系电话"
            />
          </div>
        </div>

        <!-- 备注 -->
        <div class="form-group">
          <label class="form-label">备注</label>
          <textarea
            v-model="formData.remarks"
            class="form-input textarea"
            placeholder="其他需要说明的事项（如：需要发票、特殊要求等）"
            rows="2"
          ></textarea>
        </div>
      </div>

      <!-- 表单验证错误 -->
      <div v-if="errors.length" class="error-messages">
        <div v-for="error in errors" :key="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <button 
          @click="validateAndSubmit" 
          class="submit-btn"
          :disabled="submitting"
        >
          <span v-if="submitting">提交中...</span>
          <span v-else>提交申请</span>
        </button>
        <p class="submit-hint">提交后需要管理员审批，请确保信息准确</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Apply',
  data() {
    // 获取当前时间
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    return {
      today,
      tomorrowStr,
      // 表单数据
      formData: {
        reason: '',
        people_count: 1,
        vehicle_type: 'small',
        start_date: today,
        start_time: '09:00',
        end_date: today,
        end_time: '17:00',
        destination: '',
        contact_person: '',
        contact_phone: '',
        remarks: ''
      },
      // 车型选项
      vehicleTypes: [
        {
          value: 'small',
          name: '小型车',
          icon: '🚗',
          description: '轿车/SUV，适合1-4人',
          capacity: 4,
          recommended: true
        },
        {
          value: 'business',
          name: '商务车',
          icon: '🚙',
          description: '7座商务车，适合5-7人',
          capacity: 7
        },
        {
          value: 'coach',
          name: '大客车',
          icon: '🚌',
          description: '大巴车，适合8人以上',
          capacity: 40
        }
      ],
      // 错误信息
      errors: [],
      // 提交状态
      submitting: false
    };
  },
  computed: {
    // 计算用车时长
    duration() {
      if (!this.formData.start_date || !this.formData.start_time || 
          !this.formData.end_date || !this.formData.end_time) {
        return '';
      }

      const start = new Date(`${this.formData.start_date}T${this.formData.start_time}`);
      const end = new Date(`${this.formData.end_date}T${this.formData.end_time}`);
      
      if (end <= start) return '时间无效';

      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        return `${Math.round(diffHours * 60)}分钟`;
      } else if (diffHours < 24) {
        return `${diffHours.toFixed(1)}小时`;
      } else {
        return `${(diffHours / 24).toFixed(1)}天`;
      }
    }
  },
  watch: {
    // 当开始日期改变时，自动设置结束日期
    'formData.start_date': function(newStartDate) {
      if (!this.formData.end_date || this.formData.end_date < newStartDate) {
        this.formData.end_date = newStartDate;
      }
    }
  },
  methods: {
    // 返回上一页
    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push('/home');
      }
    },
    
    // 表单验证
    validateForm() {
      this.errors = [];
      
      // 验证用车事由
      if (!this.formData.reason.trim()) {
        this.errors.push('请填写用车事由');
      } else if (this.formData.reason.trim().length < 5) {
        this.errors.push('用车事由至少需要5个字符');
      }
      
      // 验证乘车人数
      if (!this.formData.people_count || this.formData.people_count < 1) {
        this.errors.push('请填写正确的乘车人数');
      }
      
      // 验证车型
      if (!this.formData.vehicle_type) {
        this.errors.push('请选择车型');
      }
      
      // 验证时间
      const start = new Date(`${this.formData.start_date}T${this.formData.start_time}`);
      const end = new Date(`${this.formData.end_date}T${this.formData.end_time}`);
      
      if (end <= start) {
        this.errors.push('结束时间必须晚于开始时间');
      }
      
      // 验证联系电话
      if (this.formData.contact_phone && !/^1[3-9]\d{9}$/.test(this.formData.contact_phone)) {
        this.errors.push('联系电话格式不正确');
      }
      
      return this.errors.length === 0;
    },
    
    // 提交申请
    async submitApplication() {
      this.submitting = true;
      
      try {
        // 获取用户信息
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // 准备提交数据
        const submitData = {
          reason: this.formData.reason.trim(),
          people_count: parseInt(this.formData.people_count),
          vehicle_type: this.formData.vehicle_type,
          start_time: `${this.formData.start_date} ${this.formData.start_time}:00`,
          end_time: `${this.formData.end_date} ${this.formData.end_time}:00`,
          destination: this.formData.destination.trim(),
          contact_person: this.formData.contact_person.trim(),
          contact_phone: this.formData.contact_phone.trim(),
          remarks: this.formData.remarks.trim()
        };
        
        console.log('提交数据:', submitData);
        
        // 调用后端API
        const response = await fetch('http://localhost:3000/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(submitData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 提交成功
          alert('申请提交成功！请等待管理员审批。');
          this.$router.push('/home');
        } else {
          // 提交失败
          throw new Error(result.message || '提交失败');
        }
      } catch (error) {
        console.error('提交申请失败:', error);
        alert(`提交失败: ${error.message}`);
      } finally {
        this.submitting = false;
      }
    },
    
    // 验证并提交
    validateAndSubmit() {
      if (this.validateForm()) {
        if (confirm('确认提交用车申请吗？')) {
          this.submitApplication();
        }
      }
    },
    
    // 快速填写测试数据
    fillTestData() {
      this.formData = {
        reason: '前往客户公司进行项目演示和技术交流，需要携带演示设备和样品',
        people_count: 3,
        vehicle_type: 'business',
        start_date: this.today,
        start_time: '09:00',
        end_date: this.today,
        end_time: '18:00',
        destination: 'XX科技园A座',
        contact_person: '张经理',
        contact_phone: '13800138000',
        remarks: '需要发票，抬头：XX科技有限公司'
      };
    }
  },
  mounted() {
    console.log('Apply.vue 已加载');
    
    // 开发环境：添加测试按钮
    if (process.env.NODE_ENV === 'development') {
      this.$nextTick(() => {
        const testBtn = document.createElement('button');
        testBtn.textContent = '填充测试数据';
        testBtn.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 8px 16px;
          background: #ff9800;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          z-index: 1000;
        `;
        testBtn.onclick = this.fillTestData;
        document.body.appendChild(testBtn);
      });
    }
  }
};
</script>

<style scoped>
.apply-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 40px;
}

/* 头部 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.back-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #e0e0e0;
}

/* 表单容器 */
.apply-form {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

/* 表单部分 */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

/* 表单组 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-label::after {
  content: '*';
  color: #ff4d4f;
  margin-left: 2px;
}

/* 输入框 */
.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 人数选择器 */
.people-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.num-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.num-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.num-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.custom-input {
  position: relative;
  flex: 1;
  min-width: 120px;
}

.custom-input .form-input {
  padding-right: 40px;
}

.unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

/* 车型选择 */
.vehicle-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.vehicle-option {
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.vehicle-option:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.vehicle-option.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}

.vehicle-option.recommended {
  position: relative;
}

.vehicle-option.recommended::before {
  content: '推荐';
  position: absolute;
  top: -10px;
  right: 10px;
  background: #52c41a;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.vehicle-icon {
  font-size: 32px;
}

.vehicle-info {
  flex: 1;
}

.vehicle-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.vehicle-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.vehicle-capacity {
  font-size: 12px;
  color: #999;
}

/* 时间输入组 */
.time-input-group {
  display: flex;
  gap: 10px;
}

.time-input-group .form-input {
  flex: 1;
}

.duration-info {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.duration-value {
  color: #1890ff;
  font-weight: 600;
}

/* 表单行 */
.form-row {
  display: flex;
  gap: 20px;
}

.form-group.half {
  flex: 1;
}

/* 错误消息 */
.error-messages {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 12px;
  margin: 20px 0;
}

.error-message {
  color: #ff4d4f;
  font-size: 14px;
  margin-bottom: 4px;
}

.error-message:last-child {
  margin-bottom: 0;
}

/* 提交部分 */
.submit-section {
  text-align: center;
  margin-top: 30px;
}

.submit-btn {
  width: 200px;
  padding: 14px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.submit-btn:disabled {
  background: #bfbfbf;
  cursor: not-allowed;
}

.submit-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .apply-form {
    padding: 0 15px;
  }
  
  .form-section {
    padding: 15px;
  }
  
  .vehicle-options {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .time-input-group {
    flex-direction: column;
  }
}
</style>