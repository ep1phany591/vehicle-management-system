<template>
  <div class="notifications-page">
    <van-nav-bar
      title="消息通知"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="delete-o" size="18" @click="clearAll" />
      </template>
    </van-nav-bar>
    
    <!-- 通知类型筛选 -->
    <div class="filter-tabs">
      <van-tabs v-model="activeTab" sticky>
        <van-tab title="全部">
          <notification-list :notifications="allNotifications" />
        </van-tab>
        <van-tab title="未读">
          <notification-list :notifications="unreadNotifications" />
        </van-tab>
        <van-tab title="申请相关">
          <notification-list :notifications="applicationNotifications" />
        </van-tab>
        <van-tab title="系统通知">
          <notification-list :notifications="systemNotifications" />
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Toast, Dialog } from 'vant';
import NotificationList from '../components/NotificationList.vue';

const activeTab = ref(0);

// 模拟通知数据
const notifications = ref([
  {
    id: 1,
    type: 'application',
    title: '申请已批准',
    content: '您的用车申请（#20230001）已获得批准，请等待车辆安排',
    time: new Date(Date.now() - 30 * 60000),
    read: false,
    relatedId: '20230001',
  },
  {
    id: 2,
    type: 'system',
    title: '系统维护通知',
    content: '系统将于今晚24:00-02:00进行维护升级，请合理安排您的申请',
    time: new Date(Date.now() - 2 * 60 * 60000),
    read: true,
  },
  {
    id: 3,
    type: 'application',
    title: '车辆已分配',
    content: '您的用车申请（#20230001）已分配车辆：京A12345，司机：王师傅',
    time: new Date(Date.now() - 3 * 60 * 60000),
    read: false,
    relatedId: '20230001',
  },
  {
    id: 4,
    type: 'task',
    title: '新任务提醒',
    content: '您有新的出车任务，请及时查看',
    time: new Date(Date.now() - 5 * 60 * 60000),
    read: false,
    relatedId: 'task001',
  },
  {
    id: 5,
    type: 'system',
    title: '规则更新',
    content: '用车申请规则已更新，请查看最新规定',
    time: new Date(Date.now() - 24 * 60 * 60000),
    read: true,
  },
]);

const allNotifications = computed(() => notifications.value);
const unreadNotifications = computed(() => notifications.value.filter(n => !n.read));
const applicationNotifications = computed(() => notifications.value.filter(n => n.type === 'application'));
const systemNotifications = computed(() => notifications.value.filter(n => n.type === 'system'));

onMounted(() => {
  // 可以在这里加载真实的通知数据
});

const clearAll = () => {
  Dialog.confirm({
    title: '清空通知',
    message: '确定要清空所有通知吗？',
  }).then(() => {
    notifications.value = [];
    Toast.success('通知已清空');
  });
};
</script>

<style scoped>
.notifications-page {
  background: #f7f8fa;
  min-height: 100vh;
}

.filter-tabs {
  margin-top: 10px;
}
</style>