<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  createColumnHelper,
} from '@tanstack/vue-table'
import { inject } from 'vue'
import SignalForTable from './SignalForTable.vue'
import TanStackTestTable from './TanStackTestTable.vue'
import Chart from './Chart.vue'
import MultiLineChart from './HighCharts.vue'
import WarningSignal from './WarningSignal.vue'
import { MyEnum } from '../Enums/Prefix.js'
import Histogram from './Histogram.vue'
import { columns } from '../components/TableVariables/HomePageTable.js'; 


import LightWeightChart from './LightWeightChart.vue';
import CustomSelect from './CustomSelect.vue'

const defaultData = []
const NavigationMap = {
  "AccountName": "/user/"
}

const data = ref(defaultData)
const columnHelper = createColumnHelper()



const client_BackendData = ref({})
const connection_BackendData = ref({})
const index_data = ref({})
const previous_day_close_index_data = ref({
  BANKNIFTYSPOT: 51117.80,
  FINNIFTYSPOT: 23722.15,
  MIDCPNIFTYSPOT: 13007.45,
  NIFTYSPOT: 24936.40,
  SENSEXSPOT: 81559.54
})
const pulse_signal = ref([])
const time = ref([])
const serverData = ref({})
const checkBackendConnection = ref(false)
const checkServerDataConnection = ref(false)
const Latency = ref(0)
const max_latency = ref(0);
const past_time = ref(0)
const live_weights = ref([]);

let socket = null

const give_percentage_change = (a, b) => {
  if (!a || !b) return 0;
  const val = ((a - b) / a) * 100;
  return val;
}

const handleMessage = (message) => {
  client_BackendData.value = message.client_data
  connection_BackendData.value = message.connection_data
  if (message.connection_data)
    previous_day_close_index_data.value = message.connection_data['history_live_index']
  updateData()
}

const updateData = () => {


  if (connection_BackendData.value != undefined) {
    index_data.value = connection_BackendData.value.live_index
    let pulse_data = connection_BackendData.value.pulse
    const backendTime = new Date(connection_BackendData.value.time); // Parse the time
    const day = backendTime.getDate().toString().padStart(2, "0");
    const month = (backendTime.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-indexed
    const year = backendTime.getFullYear();
    const hours = backendTime.getHours().toString().padStart(2, "0");
    const minutes = backendTime.getMinutes().toString().padStart(2, "0");
    const seconds = backendTime.getSeconds().toString().padStart(2, "0");

    // Format the date and time as DD-MM-YYYY HH:mm:ss
    time.value = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    if (connection_BackendData.value.pulse) {
      pulse_signal.value = pulse_data
      pulse_signal.value.backendConnection = checkBackendConnection
      pulse_signal.value.position_mismatch = connection_BackendData.value.position_mismatch
    }

  }

  let clients_data = client_BackendData.value
  if (clients_data && clients_data.length > 0) {
    data.value = clients_data.map(item => ({


      AccountName: item.name || '',
      IdealMTM: item.ideal_MTM !== undefined ? item.ideal_MTM : 0,
      Day_PL: item.MTM !== undefined ? item.MTM : 0,
      Slippage1:item.Slippage1!==undefined?item.Slippage1:0,
      Slippage2:item.Slippage2!==undefined?item.Slippage2:0,
      PNL_PER_UM: item['PNL Utilized %'] !== undefined ? Number(item['PNL Utilized %']) : 0,
      PNL_PER_M: item['PNL Overall %'] !== undefined ? Number(item['PNL Overall %']) : 0,
      Peak_Margin: item['Peak Margin'] !== undefined ? item['Peak Margin'] : 0,
      Slippage: item.Slippage !== undefined ? item.Slippage : 0,
      CompleteOrderCount: item.CompleteOrderCount !== undefined ? Number(item.CompleteOrderCount) : 0,
      openOrderCount: item.openOrderCount !== undefined ? Number(item.openOrderCount) : 0,
      RejectedOrderCount: item.Rejected_orders !== undefined ? Number(item.Rejected_orders) : 0,
      PendingOrderCount: item.Pending_orders !== undefined ? Number(item.Pending_orders) : 0,
      OpenQuantity: item.OpenQuantity !== undefined ? Number(item.OpenQuantity) : 0,
      NetQuantity: item.NetQuantity !== undefined ? Number(item.NetQuantity) : 0,
      Ideal_Margin: item.Live_Client_Margin !== undefined ? Number(item.Live_Client_Margin) : 0,
      VAR: item.Live_Client_Var !== undefined ? item.Live_Client_Var : 0,
      Margin: item['Total Margin'] !== undefined ? item['Total Margin'] : 0, //item.Total Margin',
      Cash: item.cashAvailable !== undefined ? Number(item.cashAvailable) : 0,
      AvailableMargin: item.availableMargin !== undefined ? Number(item.availableMargin) : 0,
      Used_Margin: item.marginUtilized !== undefined ? item.marginUtilized : 0,
      VAR_PERCENTAGE: item.Live_Client_Var !== undefined && ( item['Total Margin'] > 0) ? ((Number(item.Live_Client_Var) / Number( item['Total Margin'])) * 100).toPrecision(4) : 0,
      API_NET_PNL: item['API NET PNL'] !== undefined ? item['API NET PNL'] : 0,
      API_DAY_PNL: item['API DAY PNL'] !== undefined ? item['API DAY PNL'] : 0,

    }))
  }



}


const connectServerDataWebSocket = () => {
  const token = localStorage.getItem('access_token'); // Retrieve the access token
  if (!token) {
      alert('User not authenticated');
      return;
  }
    
  const socket = new WebSocket('wss://api.swancapital.in/serverData');

  socket.onopen = () => {
     // Send the token as the first message for authentication
    const authMessage = JSON.stringify({ token });
    socket.send(authMessage);
    console.log('ServerData WebSocket connection opened')
    checkServerDataConnection.value = true;
  }

  socket.onmessage = (event) => {
    if (event.data === 'ping') {
      socket.send('pong')
    } else {

      const message = JSON.parse(event.data);
      serverData.value = message
    }
  }

  socket.onclose = (event) => {
    console.log('ServerData WebSocket connection closed:', event.reason)
    checkServerDataConnection.value = false
  }


  socket.onerror = (error) => {
    console.error('ServerData WebSocket error:', error)
    checkServerDataConnection.value = false
  }
}

const connectWebSocket = () => {
  const token = localStorage.getItem('access_token'); // Retrieve the access token
  if (!token) {
    alert('User not authenticated');
    return;
  }

  const socket = new WebSocket('wss://api.swancapital.in/ws');

  socket.onopen = () => {
    console.log('WebSocket connection opened');
    
    // Send the token as the first message for authentication
    const authMessage = JSON.stringify({ token });
    socket.send(authMessage);
    checkBackendConnection.value = true
  };


  socket.onmessage = (event) => {
    if (event.data === 'ping') {
      socket.send('pong')
    } else {

      const message = JSON.parse(event.data);
      if (message['live_weights']) {
        live_weights.value = message['live_weights'];
      }
      let ar2 = message.time;
      if (past_time.value === 0) past_time.value = ar2;
      let date1 = new Date(past_time.value.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
      let date2 = new Date(ar2.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
      let diffInMs = date2 - date1;
      let diffInSeconds = diffInMs / 1000;
      Latency.value = diffInSeconds;
      max_latency.value = Math.max(max_latency.value, Latency.value)
      past_time.value = ar2;
      handleMessage(message)

    }
  }
  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.reason)
    checkBackendConnection.value = false
  }
  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
    checkBackendConnection.value = false
  }
}

const triggerToast = inject('triggerToast')

const showSuccessToast = () => {
  triggerToast('Operation successful!', 'success')
}

const formatIndexName = (name) => {
  return name.replace('SPOT', '').toUpperCase()
}
const formatNumber = (value) => {
  const val = value.toFixed(2)
  return val ? val.toLocaleString() : '0'
}
const getDifference = (key) => {
  return (index_data.value[key].toFixed(2) - previous_day_close_index_data.value[key]).toFixed(2);
}
const getPercentage = (key) => {
  const change = give_percentage_change(index_data.value[key], previous_day_close_index_data.value[key]);
  return change.toFixed(2);
}
const formatPercentage = (value) => {
  return `${value}%`
}
const getPercentageClass = (key) => {
  const percentage = getPercentage(key)
  return percentage > 0 ? 'positive' : percentage < 0 ? 'negative' : 'neutral'
}

onMounted(() => {
  connectWebSocket()
  connectServerDataWebSocket()
})

onUnmounted(() => {
  if (socket) {
    socket.close()
  }
})
</script>



<template>
  <div class="homepage-container">
    <!-- Index Data Cards -->
    <div v-if="index_data" class="index-cards-container">
      <div v-for="(value, key) in index_data" :key="key" 
           class="index-card">
        <div class="index-header">{{ formatIndexName(key) }}</div>
        <div class="index-content">
          <span :class="['index-value', getPercentageClass(key)]">
            {{ formatNumber(value) }}
          </span>
          <div class="index-change">
            <img v-if="getPercentageClass(key) === 'positive'" 
                 class="trend-icon" 
                 src="../assets/arrow-up-long-solid.svg" 
                 alt="Up">
            <img v-else 
                 class="trend-icon" 
                 src="../assets/arrow-down-long-solid.svg" 
                 alt="Down">
            <span :class="['percentage', getPercentageClass(key)]">
              {{ getDifference(key) }}
              <span class="percentage-bracket">
                ({{ formatPercentage(getPercentage(key)) }})
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- System Metrics Dashboard -->
    <div class="metrics-dashboard">
      <div class="metrics-container">
        <div class="metrics-group">
          <div class="metric-item">
            <span class="metric-label">Time</span>
            <span class="metric-value">{{ time }}</span>
          </div>
          <div v-if="serverData['CPU']" class="metric-item">
            <span class="metric-label">CPU</span>
            <span class="metric-value">{{ serverData['CPU'][serverData['CPU'].length - 1].value }}%</span>
          </div>
          <div v-if="serverData['RAM']" class="metric-item">
            <span class="metric-label">RAM</span>
            <span class="metric-value">{{ serverData['RAM'][serverData['RAM'].length - 1].value }}%</span>
          </div>
        </div>

        <div v-if="serverData['Redis']" class="metrics-group">
          <div class="metric-item">
            <span class="metric-label">Redis Used</span>
            <span class="metric-value">{{ serverData['Redis'][serverData['Redis'].length - 1].used_memory_gb.toFixed(2) }} GB</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Redis Peak</span>
            <span class="metric-value">{{ serverData['Redis'][serverData['Redis'].length - 1].used_memory_peak_gb.toFixed(2) }} GB</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">System Memory</span>
            <span class="metric-value">{{ serverData['Redis'][serverData['Redis'].length - 1].total_system_memory_gb.toFixed(2) }} GB</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Redis Usage</span>
            <span class="metric-value">{{ serverData['Redis'][serverData['Redis'].length - 1].memory_percent.toFixed(2) }}%</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Redis Allocated</span>
            <span class="metric-value">{{ serverData['Redis'][serverData['Redis'].length - 1].available_memory_gb.toFixed(2) }} GB</span>
          </div>
        </div>
      </div>

      <WarningSignal 
        :signals="pulse_signal" 
        :latency="Latency" 
        :max_latency="max_latency" 
        class="warning-signal" 
      />
    </div>

    <!-- Main Content Area -->
    <div class="main-content">
      <div class="table-section">
        <TanStackTestTable 
          title="Accounts" 
          :data="data" 
          :columns="columns"
          :hasColor="['IdealMTM', 'Day_PL', 'Slippage', 'PNL_PER_UM', 'PNL_PER_M', 'Slippage1', 'Slippage2', 'API DAY PNL', 'API NET PNL']" 
          :navigateTo="NavigationMap"
          :showPagination="true" 
          :hasRowcolor="{ 'columnName': 'AccountName', 'arrayValues': [] }" 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.homepage-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 1.5rem;
}

/* Index Cards Styling */
.index-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.index-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}

.index-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.index-header {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.index-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.index-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.index-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trend-icon {
  width: 12px;
  height: auto;
}

/* Metrics Dashboard Styling */
.metrics-dashboard {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metrics-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.metrics-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;
}

.metric-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.metric-value {
  font-size: 1rem;
  color: #0f172a;
  font-weight: 600;
}

/* Main Content Styling */
.main-content {
  margin-top: 1.5rem;
}

.table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

/* Status Colors */
.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.neutral {
  color: #6b7280;
}

.percentage-bracket {
  color: inherit;
  opacity: 0.8;
  margin-left: 0.25rem;
}

/* Warning Signal Styling */
.warning-signal {
  margin-top: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .homepage-container {
    padding: 1rem;
  }

  .metrics-group {
    width: 100%;
  }

  .metric-item {
    min-width: 120px;
  }
}
</style>