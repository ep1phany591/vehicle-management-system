<template>
  <div class="notification-list">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-empty
        v-if="notifications.length === 0"
        description="暂无通知"
        image="comment-o"
      />
      
      <div v-else class="notifications">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
          @click="viewNotification(notification)"
        >
          <div class="notification-icon">
            <van-icon :name="getNotificationIcon(notification.type)" />
          </div>
          
          <div class="notification-content">
            <div class="notification-header">
              <h4>{{ notification.title }}</h4>
              <span class="notification-time">{{ formatTime(notification.time) }}</span>
            </div>
            
            <p class="notification-body">{{ notification.content }}</p>
          </div>
          
          <div class="notification-actions">
            <van-icon
              v-if="!notification.read"
              name="ellipsis"
              @click.stop="showActions(notification)"
            />
          </div>
        </div>
      </div>
    </van-pull-refresh>
    
    <!-- 操作菜单 -->
    <van-popup
      v-model="showActionPopup"
      position="bottom"
      round
      :style="{ height: '40%' }"
    >
      <div class="action-menu">
        <div
          class="action-item"
          @click="markAsRead(currentNotification)"
        >
          <van-icon name="eye-o" />
          <span>标记为已读</span>
        </div>
        <div
          class="action-item"
          @click="deleteNotification(currentNotification)"
        >
          <van-icon name="delete-o" />
          <span>删除通知</span>
        </div>
        <div
          v-if="currentNotification?.relatedId"
          class="action-item"
          @click="viewRelated(currentNotification)"
        >
          <van-icon name="search" />
          <span>查看详情</span>
        </div>
      </div>
      
      <div class="action-cancel">
        <van-button round block type="default" @click="showActionPopup = false">
          取消
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Toast } from 'vant';

const props = defineProps({
  notifications: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['refresh', 'notification-click']);

const refreshing = ref(false);
const showActionPopup = ref(false);
const currentNotification = ref(null);

const getNotificationIcon = (type) => {
  const iconMap = {
    application: 'todo-list-o',
    system: 'volume-o',
    task: 'bell-o',
    warning: 'warning-o',
    info: 'info-o',
  };
  return iconMap[type] || 'info-o';
};

const formatTime = (time) => {
  const now = new Date();
  const notificationTime = new Date(time);
  const diff = now - notificationTime;
  
  if (diff < 60 * 1000) {
    return '刚刚';
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  } else {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }
};

const onRefresh = () => {
  refreshing.value = true;
  emit('refresh');
  setTimeout(() => {
    refreshing.value = false;
  }, 1000);
};

const viewNotification = (notification) => {
  // 标记为已读
  if (!notification.read) {
    notification.read = true;
  }
  
  emit('notification-click', notification);
  
  // 如果是申请相关的通知，可以跳转到申请详情
  if (notification.relatedId && notification.type === 'application') {
    // 这里可以实现跳转逻辑
    Toast(`跳转到申请详情 #${notification.relatedId}`);
  }
};

const showActions = (notification) => {
  currentNotification.value = notification;
  showActionPopup.value = true;
};

const markAsRead = (notification) => {
  if (notification) {
    notification.read = true;
    Toast.success('已标记为已读');
  }
  showActionPopup.value = false;
};

const deleteNotification = (notification) => {
  if (notification) {
    const index = props.notifications.findIndex(n => n.id === notification.id);
    if (index > -1) {
      props.notifications.splice(index, 1);
      Toast.success('通知已删除');
    }
  }
  showActionPopup.value = false;
};

const viewRelated = (notification) => {
  if (notification?.relatedId) {
    // 根据通知类型跳转到不同的详情页面
    if (notification.type === 'application') {
      Toast(`查看申请详情 #${notification.relatedId}`);
    } else if (notification.type === 'task') {
      Toast(`查看任务详情 #${notification.relatedId}`);
    }
  }
  showActionPopup.value = false;
};
</script>

<style scoped>
.notification-list {
  min-height: calc(100vh - 120px);
  background: #f7f8fa;
}

.notifications {
  padding: 10px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  background: white;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.notification-item.unread {
  background: linear-gradient(90deg, #f0f8ff, white);
  border-left: 4px solid #1989fa;
}

.notification-icon {
  margin-right: 15px;
  margin-top: 2px;
}

.notification-icon .van-icon {
  font-size: 20px;
  color: #1989fa;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-header h4 {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.notification-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  margin-left: 10px;
}

.notification-body {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.notification-actions {
  margin-left: 10px;
}

.notification-actions .van-icon {
  color: #999;
  font-size: 18px;
}

.action-menu {
  padding: 20px;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.action-item:active {
  background: #f5f5f5;
}

.action-item .van-icon {
  margin-right: 10px;
  color: #1989fa;
  font-size: 18px;
}

.action-item span {
  font-size: 16px;
  color: #333;
}

.action-cancel {
  padding: 10px 20px;
  background: #f7f8fa;
}
</style>