<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { createChart } from 'lightweight-charts';
import Histogram from './Histogram.vue';
import IVChart from './IVChart.vue';

const past_time = ref(0);
const WS7L = ref([]);
const WS8L = ref([]);
const signal_delay = ref([]);
const ivchart = ref([]);
const bidaskspread=ref({})
const selectedBidAskIndex = ref(1);
const error=ref()
const optionExpiryDates=ref({})
const selectedOptionKey = ref('NIFTY');
const selectedOptionExpiry = ref('');


// Add new refs for dates and index selection
const selectedIndex = ref('NIFTY');
const selectedIVDate = ref(new Date());

// Add loading states
const isIVChartLoading = ref(false);
const bidaskspreadLoading = ref(false);

const fetchClientDetails = async () => {
    try {
        const response = await fetch('https://api.swancapital.in/lagsData');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        WS7L.value = data.WS7L;
        WS8L.value = data.WS8L;
        signal_delay.value = data.signal_delay;
    } catch (error) {
        console.error('Error fetching client details:', error);
    }
};

// API functions
const fetchData = async (endpoint, stateRef) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('User not authenticated');

    const response = await fetch(`https://api.swancapital.in/${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Error fetching ${endpoint}: ${errorMessage}`);
    }

    const data = await response.json();
    stateRef.value = (data || []);
  } catch (err) {
    error.value = err.message;
    console.error(`Error fetching ${endpoint}:`, err.message);
  }
};


const postData = async (endpoint, payload, stateRef, loadingRef) => {
    loadingRef.value = true;
    try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('User not authenticated');
        const response = await fetch(`https://api.swancapital.in/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Error posting to ${endpoint}: ${errorMessage}`);
        }
        const data = await response.json();
        stateRef.value = data || [];
    } catch (err) {
        console.error(`Error posting to ${endpoint}:`, err.message);
    } finally {
        loadingRef.value = false;
    }
};

const fetchIVUNDERLYINGCHART = () => {
    const date = new Date(selectedIVDate.value);
    postData('ivchart', {
        index: selectedIndex.value,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
    }, ivchart, isIVChartLoading);
};



const fetchBidAskSpreadCHART = () => {

    postData('bidaskspread', 
    {
      index: selectedOptionKey.value,
      expiry: selectedOptionExpiry.value, 
    }
    , bidaskspread, bidaskspreadLoading);
};

const fetchexpiryDates = () => fetchData('optionexpirydetails', optionExpiryDates);

onMounted(() => {
    fetchClientDetails();
    fetchIVUNDERLYINGCHART();
    fetchexpiryDates()
   
});

// Watch for changes in dates or index selection
watch([selectedIVDate, selectedIndex], () => {
    fetchIVUNDERLYINGCHART();
});


</script>

<template>
    <div class="px-8 py-8 pageContainer">
        <div class="controls-container">
            <button @click="fetchClientDetails" class="refresh-button">
                Refresh Data
            </button>
            
            <div class="selection-controls">
                <select 
                    v-model="selectedIndex"
                    class="index-select"
                >
                    <option value="NIFTY">NIFTY</option>
                    <option value="SENSEX">SENSEX</option>
                    <option value="FINNIFTY">FINNIFTY</option>
                </select>
            </div>
        </div>
        
        <div class="chartContainer">
            <div class="chart-header">
                <p class="heading">IV and Underlying Price Chart</p>
                <div class="chart-controls">
                    <input 
                        type="date"
                        v-model="selectedIVDate"
                        class="date-select"
                        :disabled="isIVChartLoading"
                    />
                    <div v-if="isIVChartLoading" class="loader"></div>
                </div>
            </div>
            <IVChart 
                :data="ivchart" 
                :series="[
                    {
                        field: 'ivavg',
                        color: '#FF6B6B',
                        title: 'IV Average',
                        priceScaleId: 'right'
                    },
                    {
                        field: 'underlying',
                        color: '#2962FF',
                        title: 'Underlying Price',
                        priceScaleId: 'left'
                    }
                ]"
            />
        </div>

        <div class="chartContainer">
            <div class="chart-header">
                <p class="heading">LTP and Underlying Price Chart</p>
            </div>
            <IVChart 
                :data="ivchart" 
                :series="[
                    {
                        field: 'ltpsum',
                        color: '#FF6B6B',
                        title: 'LTP Sum',
                        priceScaleId: 'right'
                    }
                ]"
            />
        </div>


        <div class="chartContainer">
            <div class="chart-header">
                <p class="heading">Bid Ask Spread Chart</p>
                
                <div class="bidask-controls">
                    <!-- Index select -->
                    <select v-model="selectedOptionKey" class="index-select">
                        <option value="NIFTY">NIFTY</option>
                        <option value="SENSEX">SENSEX</option>
                    </select>
                    


                    <!-- Expiry select -->
                    <select v-model="selectedOptionExpiry" class="expiry-select">
                    <option
                        v-for="date in optionExpiryDates[selectedOptionKey]"
                        :key="date"
                        :value="date"
                    >
                        {{ date }}
                    </option>
                    </select>

                    <!-- Slice select -->
                    <select v-model.number="selectedBidAskIndex" class="bidask-select">
                        <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
                    </select>

                    <!-- NEW: submit button -->
                    <button
                        @click="fetchBidAskSpreadCHART"
                        class="submit-button"
                        :disabled="bidaskspreadLoading"
                    >
                    {{ bidaskspreadLoading ? 'Loading…' : 'Submit' }}
                    </button>
                </div>
            </div>
            <!-- only show once Details & the selected index exist -->
            <div
                v-if="bidaskspread.Details && bidaskspread.Details[selectedBidAskIndex]"
                class="details full-width"
                >
                <div class="detail-item">
                    <span class="label">CE Symbol:</span>
                    <span>{{ bidaskspread.Details[selectedBidAskIndex].Symbol_CE }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">PE Symbol:</span>
                    <span>{{ bidaskspread.Details[selectedBidAskIndex].Symbol_PE }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Above CE >1%:</span>
                    <span>
                    {{ bidaskspread.Details[selectedBidAskIndex].above_ce }}
                    ({{ ((bidaskspread.Details[selectedBidAskIndex].above_ce / 375) * 100).toFixed(2) }}%)
                    </span>
                </div>
                <div class="detail-item">
                    <span class="label">Above PE >1%:</span>
                    <span>
                    {{ bidaskspread.Details[selectedBidAskIndex].above_pe }}
                    ({{ ((bidaskspread.Details[selectedBidAskIndex].above_pe / 375) * 100).toFixed(2) }}%)
                    </span>
                </div>
            </div>

            <IVChart
                :data="bidaskspread[selectedBidAskIndex]"
                :series="[
                    { field: 'bidaskspreadCE', color: '#FF6B6B', title: 'CE', priceScaleId: 'right' },
                    { field: 'bidaskspreadPE', color: '#2962FF', title: 'PE', priceScaleId: 'right' }
                ]"
            />
        </div>



        <div v-if="WS7L.length > 0" class="histogram-container">
            <p class="heading">WebSocket 7 Lag</p>
            <Histogram :dataArray="WS7L" />
        </div>
        <div v-if="WS8L.length > 0" class="histogram-container">
            <p class="heading">WebSocket 8 Lag</p>
            <Histogram :dataArray="WS8L" />
        </div>
        <div v-if="signal_delay.length > 0" class="histogram-container">
            <p class="heading">Signal Delay</p>
            <Histogram :dataArray="signal_delay" />
        </div>
    </div>
</template>

<style scoped>

.bidask-controls { display: flex; gap: 10px; align-items: center; }
.expiry-select, .index-select, .date-select, .bidask-select { padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }

/* --- DETAILS ROW --- */
.details {
  grid-column: span 2;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}
.detail-item {
  background: #f9f9f9;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}
.detail-item .label {
  font-weight: 600;
  margin-right: 4px;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}
.submit-button {
  padding: 6px 12px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.chart-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.loader {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.histogram-container {
    display: flex;
    flex-direction: column;
    margin-bottom: 30px;
}
.chartContainer {
    width: 100%;
    margin-bottom: 50px;
}
.heading {
    font-size: 20px;
    font-weight: bold;
}
.pageContainer {
    height: 100%;
    display: flex;
    flex-direction: column;
}
.controls-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.selection-controls {
    display: flex;
    gap: 10px;
}
.index-select, .date-select {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 14px;
}
.refresh-button {
    padding: 10px 15px;
    font-size: 14px;
    width: 200px;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
}
html {
    font-family: poppins;
    font-size: 14px;
}
</style>