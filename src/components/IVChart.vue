<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { createChart } from 'lightweight-charts';

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  }
});

const chartContainer = ref(null);
let chart = null;
let underlyingPriceSeries = null;
let ivSeries = null;

const initChart = () => {
  if (!chartContainer.value) return;

  // Create the chart
  chart = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 400,
    layout: {
      background: { color: '#ffffff' },
      textColor: '#333',
    },
    grid: {
      vertLines: { color: '#f0f0f0' },
      horzLines: { color: '#f0f0f0' },
    },
    rightPriceScale: {
      visible: true,
      borderColor: '#f0f0f0',
    },
    leftPriceScale: {
      visible: true,
      borderColor: '#f0f0f0',
    },
    timeScale: {
      borderColor: '#f0f0f0',
      timeVisible: true,
      secondsVisible: false,
    },
  });

  // Create the underlying price series (left axis)
  underlyingPriceSeries = chart.addLineSeries({
    color: '#2962FF',
    lineWidth: 2,
    priceScaleId: 'left',
    title: 'Underlying Price',
  });

  // Create the IV series (right axis)
  ivSeries = chart.addLineSeries({
    color: '#FF6B6B',
    lineWidth: 2,
    priceScaleId: 'right',
    title: 'IV Average',
  });

  // Update data
  updateChartData();
};

const updateChartData = () => {
  if (!chart || !props.data.length) return;

  const underlyingData = props.data.map(item => ({
    time: new Date(item.timestamp).getTime() / 1000,
    value: item.underlying
  }));

  const ivData = props.data.map(item => ({
    time: new Date(item.timestamp).getTime() / 1000,
    value: item.ivavg
  }));

  underlyingPriceSeries.setData(underlyingData);
  ivSeries.setData(ivData);

  // Fit content
  chart.timeScale().fitContent();
};

// Handle window resize
const handleResize = () => {
  if (chart && chartContainer.value) {
    chart.applyOptions({
      width: chartContainer.value.clientWidth
    });
  }
};

// Watch for data changes
watch(() => props.data, () => {
  updateChartData();
}, { deep: true });

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (chart) {
    chart.remove();
    chart = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div ref="chartContainer" class="chart-container"></div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
  margin: 20px 0;
}
</style>