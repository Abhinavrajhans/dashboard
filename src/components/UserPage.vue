<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import BarChart from './Barchart.vue';
import { useRouter } from 'vue-router';
import Histogram from './Histogram.vue';
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  createColumnHelper,
} from '@tanstack/vue-table'
import { MyEnum } from '../Enums/Prefix.js';
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router';
import TanStackTestTable from './TanStackTestTable.vue'
import Chart from './Chart.vue';
import NavBar from './NavBar.vue';
import MultiLineChart from './HighCharts.vue'
import LightWeightChart from './LightWeightChart.vue';
const route = useRoute();
const user_data = ref('')
const name = ref('');
const broker = ref('')
const columnHelper = createColumnHelper()
const histogram = ref([])
const histogram_order_fill_lag = ref([])
const uids = ref([])
const basket = ref([])
import { live_trade_book_columns_zerodha,live_trade_book_columns_xts,live_order_book_columns_zerodha
  ,fund_summary_columns,live_order_book_columns_xts,signal_position,columns,combined_df_columns_zerodha,
  combined_df_columns_xts,rms_df_columns,combined_order_zerodha,combined_order_xts,combined_trades_zerodha,
  curr_strategy_mtm,curr_basket_mtm,combined_trades_xts,zerodha_order_book_columns,holding_book_columns
 } from '../components/TableVariables/UserPageTable.js'; 



const strategyData = ref({})
const strategy_chart_data = ref({})
const basketData = ref({})
const basket_chart_data = ref({})
const selectedUids = ref([]);
const selectedSignalPositions = ref([])
const selectedBasketItems = ref([]);

const filteredBasketOptions = computed(() => basket.value.filter(o => !selectedBasketItems.value.includes(o)));

const filteredUids = computed(() => {
  if (selectedBasketItems.value.length === 0) {
    return uids.value;
  }
  return uids.value.filter(uid => selectedBasketItems.value.includes(uid.split('_')[0]));
});

const filteredOptions = computed(() => filteredUids.value.filter(o => !selectedUids.value.includes(o)));



// Updated computed property for filtered book data
const filteredSignalBookData = computed(() => {
  if (selectedUids.value.length === 0 && selectedBasketItems.value.length === 0) {
    return book.value;
  }
  return book.value.filter(item => {
    const basketMatch = selectedBasketItems.value.length === 0 || selectedBasketItems.value.includes(item.uid.split('_')[0]);
    const uidMatch = selectedUids.value.length === 0 || selectedUids.value.includes(item.uid);
    return basketMatch && uidMatch;
  });
});





let eventSource = null
const client_BackendData = ref([])
const connection_BackendData = ref([])
const date = ref()
const data = ref([])
const basket_latency = ref([])
const basket_max_latency = ref([])
const strategy_latency = ref([])
const strategy_max_latency = ref([])
const past_time_strategy = ref(0)
const past_time_basket = ref(0)
const client_latency = ref(0)
const client_details_Latency = ref(0)
const past_time_client = ref(0)
const past_time_clientDetails = ref(0)
const max_client_details_latency = ref(0)
const max_client_latency = ref(0)
const mix_real_ideal_mtm_table = ref({})
const signal_position_tables = ref({})
const book = ref([])
const position_sum = ref(0)
const handleColumnClick = ({ item, index }) => {
  showOnPage.value = item;
}
const handleMessage = (message) => {
  try {
    if (message.client_data === undefined) return;
    client_BackendData.value = message.client_data
    let result = client_BackendData.value.find(client => client.name === name.value);
    signal_position_tables.value = result.signalPosition
    broker.value = result.broker;
    if (result) {
      user_data.value = result;
      data.value = [{
        AccountName: result.name || '',
        IdealMTM: result.ideal_MTM !== undefined ? result.ideal_MTM : 0,
        Day_PL: result.MTM !== undefined ? result.MTM : 0,
        PNL_PER_UM: result['PNL Utilized %'] !== undefined ? Number(result['PNL Utilized %']) : 0,
        PNL_PER_M: result['PNL Overall %'] !== undefined ? Number(result['PNL Overall %']) : 0,
        Peak_Margin: result['Peak Margin'] !== undefined ? result['Peak Margin'] : 0,
        Slippage: result.Slippage !== undefined ? result.Slippage : 0,
        Margin: result['Total Margin'] !== undefined ? result['Total Margin'] : 0, //item.Total Margin',
        CompleteOrderCount: result.CompleteOrderCount !== undefined ? Number(result.CompleteOrderCount) : 0,
        openOrderCount: result.openOrderCount !== undefined ? Number(result.openOrderCount) : 0,
        RejectedOrderCount: result.Rejected_orders !== undefined ? Number(result.Rejected_orders) : 0,
        PendingOrderCount: result.Pending_orders !== undefined ? Number(result.Pending_orders) : 0,
        OpenQuantity: result.OpenQuantity !== undefined ? Number(result.OpenQuantity) : 0,
        NetQuantity: result.NetQuantity !== undefined ? Number(result.NetQuantity) : 0,
        Ideal_Margin: result.Live_Client_Margin !== undefined ? Number(result.Live_Client_Margin) : 0,
        VAR: result.Live_Client_Var !== undefined ? Number(result.Live_Client_Var) : 0,
        Cash: result.cashAvailable !== undefined ? Number(result.cashAvailable) : 0,
        AvailableMargin: result.availableMargin !== undefined ? Number(result.availableMargin) : 0,
        Slippage1: result.Slippage1!==undefined? result.Slippage1:0,
        Slippage2: result.Slippage2!==undefined? result.Slippage2:0,
        Used_Margin: result.marginUtilized !== undefined ? result.marginUtilized : 0,
        VAR_PERCENTAGE: result.Live_Client_Var !== undefined && (result['Total Margin'] > 0) ? ((Number(result.Live_Client_Var) / result['Total Margin']) * 100).toPrecision(4) : 0,
      }];
      mix_real_ideal_mtm_table.value = { "real": result['MTMTable'], "ideal": result['ideal_MTMTable'] }
      position_sum.value = result.MTM !== undefined ? result.MTM : 0

    } else {
      console.error('No client data found for the specified name:', name.value);
    }
  } catch (error) {
    console.error('Error parsing event data or updating data:', error);
  }
}
const router = useRouter();
const LagPageHandler = () => {
  let str = '/user/lag/' + name.value;
  router.push(str);

}
const connectToSSE = () => {
  const token = localStorage.getItem('access_token'); // Retrieve the access token
  if (!token) {
    alert('User not authenticated');
    return;
  }


  const socket = new WebSocket('wss://api.swancapital.in/ws');

  socket.onmessage = (event) => {
    if (event.data === 'ping') {
      socket.send('pong')
    } else {
      const message = JSON.parse(event.data)
      let ar2 = message["time"];
      if (past_time_client.value === 0) past_time_client.value = ar2;
      if (past_time_client.value != 0) {
        let date1 = new Date(past_time_client.value.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
        let date2 = new Date(ar2.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
        let diffInMs = date2 - date1;
        let diffInSeconds = diffInMs / 1000;
        client_latency.value = diffInSeconds;
        max_client_latency.value = Math.max(max_client_latency.value, client_latency.value)
        past_time_client.value = ar2;
      }
      handleMessage(message)
    }
  }
  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.reason)
  }
  socket.onopen = () => {
    console.log('WebSocket connection opened')
    const authMessage = JSON.stringify({ token });
    socket.send(authMessage);
  }
  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
};


const connectStrategyWebSocket = () => {
  const token = localStorage.getItem('access_token'); // Retrieve the access token
  if (!token) {
      alert('User not authenticated');
      return;
  }
    
  const clientStrategySocket = new WebSocket('wss://api.swancapital.in/chart/strategy');

  clientStrategySocket.onopen = function (e) {
     // Send the token as the first message for authentication
    // const authMessage = JSON.stringify({ token });
    // clientStrategySocket.send(authMessage);
    console.log("Strategy connection established");
    // Send the initial set of client data
    sendClientDetails();
  };

  clientStrategySocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    let ar2 = data["time"];
    if (past_time_strategy.value === 0) past_time_strategy.value = ar2;
    if (past_time_strategy.value != 0) {
      let date1 = new Date(past_time_strategy.value.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
      let date2 = new Date(ar2.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
      let diffInMs = date2 - date1;
      let diffInSeconds = diffInMs / 1000;
      strategy_latency.value = diffInSeconds;
      strategy_max_latency.value = Math.max(strategy_max_latency.value, strategy_latency.value)
      past_time_strategy.value = ar2;
    }
    strategyData.value = data
    if (data.live) {
      strategy_chart_data.value = data.live;
    }

    else {
      const gg = strategy_chart_data.value
      for (const i in data.last) {
        if (gg[i].length != 0) {
          const last_data = gg[i][gg[i].length - 1].time;
          if (last_data != data.last[i].time) {
            gg[i].push(data.last[i])
          }
        }
      }
      strategy_chart_data.value = gg;
    }

  };
  clientStrategySocket.onerror = function (error) {
    console.log(`WebSocket error: ${error.message}`);
  };
  clientStrategySocket.onclose = function (event) {
    console.log('Client Detail WebSocket connection closed:', event.reason);
  };
  function sendClientDetails() {
    if (clientStrategySocket && clientStrategySocket.readyState === WebSocket.OPEN) {
      let client_data = {
        "name": name.value,
        "basket": ['ALL']
      };
      clientStrategySocket.send(JSON.stringify(client_data));
    } else {
      console.log("WebSocket is not open. Unable to send message.");
    }
  }
  return clientStrategySocket;
};


const connectBasketWebSocket = () => {
  const token = localStorage.getItem('access_token'); // Retrieve the access token
  if (!token) {
      alert('User not authenticated');
      return;
  }
    
  const clientBasketSocket = new WebSocket('wss://api.swancapital.in/chart/basket');
  clientBasketSocket.onopen = function (e) {
     // Send the token as the first message for authentication
    // const authMessage = JSON.stringify({ token });
    // clientBasketSocket.send(authMessage);
    console.log("Basket connection established");
    // Send the initial set of client data
    sendClientDetails();
  };

  clientBasketSocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    let ar2 = data["time"];
    if (past_time_basket.value === 0) past_time_basket.value = ar2;
    if (past_time_basket.value != 0) {
      let date1 = new Date(past_time_basket.value.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
      let date2 = new Date(ar2.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
      let diffInMs = date2 - date1;
      let diffInSeconds = diffInMs / 1000;
      basket_latency.value = diffInSeconds;
      basket_max_latency.value = Math.max(basket_max_latency.value, basket_latency.value)
      past_time_basket.value = ar2;
    }
    basketData.value = data
    if (data.live) {
      basket_chart_data.value = data.live;
    }

    else {
      const gg = basket_chart_data.value
      for (const i in data.last) {
        if (gg[i].length != 0) {
          const last_data = gg[i][gg[i].length - 1].time;
          if (last_data != data.last[i].time) {
            gg[i].push(data.last[i])
          }
        }
      }
      basket_chart_data.value = gg;
    }

  };
  clientBasketSocket.onerror = function (error) {
    console.log(`WebSocket error: ${error.message}`);
  };
  clientBasketSocket.onclose = function (event) {
    console.log('Client Detail WebSocket connection closed:', event.reason);
  };
  function sendClientDetails() {
    if (clientBasketSocket && clientBasketSocket.readyState === WebSocket.OPEN) {
      let client_data = {
        "name": name.value,
        "basket": ['ALL']
      };
      clientBasketSocket.send(JSON.stringify(client_data));
    } else {
      console.log("WebSocket is not open. Unable to send message.");
    }
  }

  return clientBasketSocket;
};








const connectClientDetailsWebSocket = () => {
  const token = localStorage.getItem('access_token'); // Retrieve the access token
  if (!token) {
      alert('User not authenticated');
      return;
  }
    
  const clientDetailSocket = new WebSocket('wss://api.swancapital.in/clientdetails');
  clientDetailSocket.onopen = function (e) {
     // Send the token as the first message for authentication
    const authMessage = JSON.stringify({ token });
    clientDetailSocket.send(authMessage);
    console.log("Client details connection established");
    // Send the initial set of client data
    sendClientDetails();
  };
  // clientDetailSocket.onmessage = function (event) {
  //   const data = JSON.parse(event.data);
  //   console.log("Received data:", data);
  //   let Book_data = Object.values(data.table_data || {});
  //   book.value = Book_data;
  //   // Handle the received data here
  // };
  clientDetailSocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    let ar2 = data["time"];
    if (past_time_clientDetails.value === 0) past_time_clientDetails.value = ar2;
    if (past_time_clientDetails.value != 0) {
      let date1 = new Date(past_time_clientDetails.value.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
      let date2 = new Date(ar2.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
      let diffInMs = date2 - date1;
      let diffInSeconds = diffInMs / 1000;
      client_details_Latency.value = diffInSeconds;
      max_client_details_latency.value = Math.max(max_client_details_latency.value, client_details_Latency.value)
      past_time_clientDetails.value = ar2;
    }
    if (data.table_data) {
      book.value = Object.values(data.table_data);
      if (showOnPage.value === 'Combined DF') {
        histogram.value = book.value.map(item => item.signal_lag);
        histogram_order_fill_lag.value = book.value.map(item => item.order_fill_lag)
        uids.value = [...new Set(book.value.map(item => item.uid))];
        basket.value = [...new Set(book.value.map(item => item.uid.split('_')[0]))];
      }

    } else {
      book.value = [];
    }
  };
  clientDetailSocket.onerror = function (error) {
    console.log(`WebSocket error: ${error.message}`);
  };
  clientDetailSocket.onclose = function (event) {
    console.log('Client Detail WebSocket connection closed:', event.reason);
  };
  function sendClientDetails() {
    if (clientDetailSocket && clientDetailSocket.readyState === WebSocket.OPEN) {
      let client_data = {
        "name": name.value,
        "type": showOnPage.value
      };
      clientDetailSocket.send(JSON.stringify({ client_data: client_data }));
    } else {
      console.log("WebSocket is not open. Unable to send message.");
    }
  }
  // Call sendClientDetails whenever name or type changes
  watch([name, showOnPage], () => {
    sendClientDetails();
    // Reset book when changing views
    book.value = [];
  });
  return clientDetailSocket;
};



// New refs for selected items
const selectedStrategies = ref([]);
const filteredData = computed(() => {
  if (strategyData.value['curr'] === undefined) return []
  if (selectedStrategies.value.length === 0) return strategyData.value['curr'];
  return strategyData.value['curr'].filter(item => selectedStrategies.value.includes(item.UID));

})
// Computed properties for filtered options
const filteredStrategyOptions = computed(() => {
  if (strategyData.value['curr'] === undefined) return [];

  // Get all UIDs from strategyData['curr']
  const allUIDs = strategyData.value['curr'].map(item => item.UID);

  // Filter out UIDs that are present in selectedStrategies
  const filteredUIDs = allUIDs.filter(uid => !selectedStrategies.value.includes(uid));

  return filteredUIDs;
});


const showOnPage = ref('Positions')
onMounted(() => {
  connectToSSE();
  name.value = route.params.username;
  connectClientDetailsWebSocket();
  connectBasketWebSocket();
  connectStrategyWebSocket();
})
onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
})
// Watch for changes in selectedBasketItems
watch(selectedBasketItems, (newSelectedBasketItems) => {
  console.log('Selected Basket items changed:', newSelectedBasketItems);
  // Reset UID selection when basket selection changes
  selectedUids.value = [];
});
</script>
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Container -->
    <div class="px-6 py-8 lg:px-8">
      <!-- Header Section -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">User Dashboard</h1>
        <button 
          @click="LagPageHandler"
          class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
        >
          <span>Lags</span>
        </button>
      </div>

      <!-- Account Details Section -->
      <div class="bg-white rounded-lg shadow-sm mb-8 p-6">
        <h2 class="text-lg font-medium mb-4">Account Details</h2>
        <TanStackTestTable 
          title="Account Details" 
          :data="data" 
          :columns="columns"
          :hasColor="['IdealMTM', 'Day_PL', 'Slippage', 'PNL_PER_UM', 'PNL_PER_M', 'Slippage1', 'Slippage2']"
          :navigateTo="[]"
          :showPagination="false"
          :hasRowcolor="{ 'columnName': 'AccountName', 'arrayValues': [] }"
        />
      </div>

      <!-- MTM Chart Section -->
      <div v-if="user_data['MTMTable']" class="bg-white rounded-lg shadow-sm mb-8 p-6">
        <h2 class="text-lg font-medium mb-4">MTM AND IDEAL MTM</h2>
        <LightWeightChart :Chartdata="mix_real_ideal_mtm_table" />
      </div>

      <!-- Latency Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600">Client Latency</p>
          <p class="text-lg font-semibold text-gray-900">{{ client_latency }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600">Max Client</p>
          <p class="text-lg font-semibold text-gray-900">{{ max_client_latency }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600">Client Detail Latency</p>
          <p class="text-lg font-semibold text-gray-900">{{ client_details_Latency }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600">Max Client Detail</p>
          <p class="text-lg font-semibold text-gray-900">{{ max_client_details_latency }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600">Basket Detail Latency</p>
          <p class="text-lg font-semibold text-gray-900">{{ basket_latency }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600">Max Basket Latency</p>
          <p class="text-lg font-semibold text-gray-900">{{ basket_max_latency }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600">Strategy Detail Latency</p>
          <p class="text-lg font-semibold text-gray-900">{{ strategy_latency }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="text-sm text-gray-600">Max Strategy Latency</p>
          <p class="text-lg font-semibold text-gray-900">{{ strategy_max_latency }}</p>
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="mb-8">
        <NavBar
          :navColumns="['Positions', 'Order', 'Combined DF', 'Combined Orders', 'Combined Trades', 'Fund Summary', 'Zerodha Order Book', 'Holdings']"
          @column-clicked="handleColumnClick"
          :colorColumns="[]"
          class="bg-white rounded-lg shadow-sm p-2"
        />
      </div>

      <!-- Filters Section for Combined DF -->
      <div v-if="book && showOnPage === 'Combined DF' && filteredSignalBookData.length" class="bg-white rounded-lg shadow-sm mb-8 p-6">
        <div class="flex flex-col gap-4">
          <a-select
            v-model:value="selectedBasketItems"
            mode="multiple"
            placeholder="Select Basket Items"
            class="w-full"
            :options="filteredBasketOptions.map(item => ({ value: item }))"
          />
          <a-select
            v-model:value="selectedUids"
            mode="multiple"
            placeholder="Select UIDs"
            class="w-full"
            :options="filteredOptions.map(item => ({ value: item }))"
          />
        </div>
      </div>

      <!-- Positions Section -->
      <div v-if="book && showOnPage === 'Positions'" class="bg-white rounded-lg shadow-sm mb-8 p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium">Live MTM</h2>
          <span :class="position_sum > 0 ? 'text-green-500' : 'text-red-500'" class="text-xl font-semibold">
            {{ position_sum }}
          </span>
        </div>
        <TanStackTestTable
          title="Position"
          :data="book"
          :columns="rms_df_columns"
          :hasColor="['pnl']"
          :navigateTo="[]"
          :showPagination="true"
        />
      </div>

      <!-- Order Book Section -->
      <div v-if="book && showOnPage === 'Order'" class="bg-white rounded-lg shadow-sm mb-8 p-6">
        <h2 class="text-lg font-medium mb-4">Order Book</h2>
        <TanStackTestTable
          title="Complete Order Book"
          :data="book"
          :columns="broker === 'xts' ? live_order_book_columns_xts : live_order_book_columns_zerodha"
          :hasColor="[]"
          :navigateTo="[]"
          :showPagination="true"
        />
      </div>

      <!-- Signal Positions Section -->
      <div v-if="signal_position_tables" class="bg-white rounded-lg shadow-sm mb-8 p-6">
        <h2 class="text-lg font-medium mb-4">Signal Positions</h2>
        <div class="mb-4">
          <a-select
            v-model:value="selectedSignalPositions"
            mode="multiple"
            placeholder="Select Baskets"
            class="w-full"
            :options="Object.keys(signal_position_tables).map(item => ({ value: item }))"
          />
        </div>
        <div v-for="(basket, index) in signal_position_tables" :key="index">
          <div v-if="selectedSignalPositions.includes(index)" class="mt-4">
            <TanStackTestTable
              :title="index"
              :data="basket"
              :columns="signal_position"
              :hasColor="['IdealQuantity']"
              :navigateTo="[]"
              :showPagination="true"
            />
          </div>
        </div>
      </div>

      <!-- Chart Sections -->
      <div class="space-y-8">
        <div v-if="Object.keys(basket_chart_data).length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-medium mb-4">BASKET WISE IDEAL MTM</h2>
          <LightWeightChart :Chartdata="basket_chart_data" />
        </div>

        <div v-if="Object.keys(strategy_chart_data).length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-medium mb-4">STRATEGY WISE IDEAL MTM</h2>
          <LightWeightChart :Chartdata="strategy_chart_data" />
        </div>
      </div>

      <!-- Strategy Selection Section -->
      <div class="bg-white rounded-lg shadow-sm mb-8 p-6">
        <div class="mb-4">
          <a-select
            v-model:value="selectedStrategies"
            mode="multiple"
            placeholder="Select Strategies"
            class="w-full"
            :options="filteredStrategyOptions.map(item => ({ value: item }))"
          />
        </div>
        <div v-if="Object.keys(strategyData).length > 0">
          <TanStackTestTable
            title="Current Strategy Ideal MTM"
            :data="filteredData"
            :columns="curr_strategy_mtm"
            :hasColor="['MTM']"
            :navigateTo="[]"
            :showPagination="true"
          />
        </div>
      </div>

      <!-- Histograms Section -->
      <div v-if="showOnPage === 'Combined DF'" class="space-y-8">
        <div v-if="histogram_order_fill_lag.length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-medium mb-4">Histogram Of Order Fill Lag Combined DF</h2>
          <Histogram :dataArray="histogram_order_fill_lag" />
        </div>

        <div v-if="histogram.length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-medium mb-4">Histogram Of Signal Lag Combined DF</h2>
          <Histogram :dataArray="histogram" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pageContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.latencyvalue {
  font-weight: bold;
}

.navContainer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.signalPosContainer {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  margin-bottom: 50px;
}

.red {
  color: red;
}

.chartContainer {
  width: 100%;
  margin-top: 50px;
}

.multiselectContainer {
  width: 100%;
  margin-top: 50px;
}

p {
  margin: 0;
  padding: 0;
}

.selectContainer {
  display: flex;
  flex-direction: column;
  gap: 20px;

  margin-top: 50px;
}

.histogram-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
}


.green {
  color: rgb(80, 185, 80);
}

.LatencyTable {
  display: flex;
  width: 100;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 20px;
  flex-direction: column;
}

.table-heading {
  font-size: 22px;
  font-weight: 600;
  margin-left: 30px;
}

.heading-container {
  align-self: flex-end;
}

.LagButton {
  border: 1px solid white;

  padding: 10px 20px;
  border-radius: 5px;
  background: rgb(231, 108, 108);
  color: white;
  cursor: pointer;
}

.profitContainer {
  border: 1px solid black;
  height: auto;
  padding: 20px;
  width: fit-content;
  border-radius: 10px;
  display: flex;
  font-size: 30px;
  align-items: flex-start;
  flex-direction: column;
}

.priceContainer {
  display: flex;
  align-items: baseline;
  gap: 20px;
}

html {
  /* font-family: poppins; */
  font-size: 14px;
}

.labeltag {
  font-size: 20px;
}

.headingContainer {
  font-size: 30px;
  font-weight: bold;
}
</style>