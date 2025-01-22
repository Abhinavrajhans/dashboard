<script setup>
import { onMounted, onUnmounted } from 'vue';
import { ref } from 'vue';
import Histogram from './Histogram.vue';
import IVChart from './IVChart.vue';  // Import the new component

const past_time = ref(0);
const WS7L = ref([]);
const WS8L = ref([]);
const signal_delay = ref([]);
const ivchart = ref([]);  // Changed to array to match component expectations
const ltpchart= ref([]);

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
const postData = async (endpoint, payload, stateRef) => {
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
        stateRef.value = data || [];  // Ensure it's always an array
    } catch (err) {
        console.error(`Error posting to ${endpoint}:`, err.message);
    }
};


const fetchIVUNDERLYINGCHART = () => postData('ivchart', { message: "hello" }, ivchart);
const fetchLTPUNDERLYINGCHART = () => postData('ltpchart', { message: "hello" }, ltpchart);

onMounted(() => {
    fetchClientDetails();
    fetchIVUNDERLYINGCHART();
    fetchLTPUNDERLYINGCHART();
});
</script>

<template>
    <div class="px-8 py-8 pageContainer">
        <button @click="fetchClientDetails" class="refresh-button">
            Refresh Data
        </button>
        
        <!-- Add the IV Chart component -->
        <div class="chartContainer">
            <p class="heading">IV and Underlying Price Chart</p>
            <IVChart :data="ivchart" :series="[
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
      // Add more series as needed
    ]"/>
        </div>
        <div class="chartContainer">
            <p class="heading">LTP and Underlying Price Chart</p>
            <IVChart :data="ltpchart" :series="[
      {
        field: 'ltpsum',
        color: '#FF6B6B',
        title: 'LTP Sum',
        priceScaleId: 'right'
      },
      {
        field: 'underlying',
        color: '#2962FF',
        title: 'Underlying Price',
        priceScaleId: 'left'
      }
      // Add more series as needed
    ]"/>
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
.refresh-button {
    margin-bottom: 20px;
    padding: 10px 15px;
    font-size: 14px;
    width: 200px;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    align-self: flex-end;
}
html {
    font-family: poppins;
    font-size: 14px;
}
</style>