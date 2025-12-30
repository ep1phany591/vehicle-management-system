<!-- src/views/NotFound.vue -->
<template>
  <div class="not-found">
    <van-empty description="页面不存在" image="search" />
    <div style="text-align: center; margin-top: 20px;">
      <van-button type="primary" @click="$router.push('/home')">返回首页</van-button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  padding: 50px 20px;
}
</style>