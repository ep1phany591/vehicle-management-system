<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2>📊 数据统计与导出</h2>
      <div class="header-actions">
        <button @click="exportDetailOnly" class="export-btn detail" :disabled="loading">
          📥 导出出车明细表
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="card">
        <div class="card-header">
          <h3>车队出车汇总</h3>
          <button @click="exportFleetStats" class="mini-export-btn">导出汇总</button>
        </div>
        <table>
          <thead>
            <tr><th>车队</th><th>出车次数</th><th>总里程 (km)</th></tr>
          </thead>
          <tbody>
            <tr v-for="fleet in fleetStats" :key="fleet.fleet_id">
              <td>{{ fleet.fleet_name }}</td>
              <td>{{ fleet.trip_count }}</td>
              <td>{{ fleet.total_mileage }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>司机出车汇总</h3>
          <button @click="exportDriverStats" class="mini-export-btn">导出汇总</button>
        </div>
        <table>
          <thead>
            <tr><th>司机</th><th>所属车队</th><th>出车次数</th><th>总里程 (km)</th></tr>
          </thead>
          <tbody>
            <tr v-for="driver in driverStats" :key="driver.driver_id">
              <td>{{ driver.driver_name }}</td>
              <td>{{ driver.fleet_name || '—' }}</td>
              <td>{{ driver.trip_count }}</td>
              <td>{{ driver.total_mileage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

const fleetStats = ref([])
const driverStats = ref([])
const loading = ref(false)

const loadStatistics = async () => {
  try {
    const res = await axios.get('/api/statistics/trips')
    if (res.data?.success) {
      fleetStats.value = res.data.data.fleets || []
      driverStats.value = res.data.data.drivers || []
    }
  } catch (err) {
    console.error('统计加载失败', err)
  }
}

// 通用导出函数
const saveExcel = (data, fileName, sheetName) => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${fileName}_${new Date().toLocaleDateString()}.xlsx`)
}

/** 1. 仅导出明细表 */
const exportDetailOnly = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const resDetail = await axios.get('/api/applications?limit=5000', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const rawData = resDetail.data.data || []
    const detailData = rawData.map(item => ({
      '单据编号': item.application_id,
      '司机': item.driver_name,
      '车牌号': item.license_plate,
      '用车事由': item.reason,
      '出发地': item.start_location,
      '目的地': item.destination,
      '开始时间': item.actual_start_time || item.start_time,
      '状态': translateStatus(item.status)
    }))
    saveExcel(detailData, '司机出车明细表', '明细')
  } catch (error) {
    alert('导出明细失败')
  } finally {
    loading.value = false
  }
}

/** 2. 仅导出车队汇总 */
const exportFleetStats = () => {
  const data = fleetStats.value.map(item => ({
    '车队名称': item.fleet_name,
    '出车总次数': item.trip_count,
    '总里程(km)': item.total_mileage
  }))
  saveExcel(data, '车队出车汇总表', '车队统计')
}

/** 3. 仅导出司机汇总 */
const exportDriverStats = () => {
  const data = driverStats.value.map(item => ({
    '司机姓名': item.driver_name,
    '所属车队': item.fleet_name || '—',
    '累计出车次数': item.trip_count,
    '累计里程(km)': item.total_mileage
  }))
  saveExcel(data, '司机出车汇总表', '司机统计')
}

const translateStatus = (status) => {
  const map = {
    'pending': '待审批', 'approved': '已通过', 'assigned': '已派车',
    'in_progress': '执行中', 'completed': '已完成', 'rejected': '已拒绝'
  }
  return map[status] || status
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.statistics-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

/* 导出按钮样式 */
.export-btn { 
  background: #1890ff; color: white; border: none; padding: 10px 20px; 
  border-radius: 6px; cursor: pointer; font-weight: bold;
}

.mini-export-btn {
  background: #52c41a; color: white; border: none; padding: 5px 12px;
  border-radius: 4px; cursor: pointer; font-size: 12px;
}

.mini-export-btn:hover { background: #73d13d; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
th { background: #fafafa; color: #666; }
</style>