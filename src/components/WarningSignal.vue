<template>
    <div class="dashboard-container">
        <!-- Critical Alerts Section -->
        <div class="alerts-section" v-if="hasErrors">
            <div class="alert-header">
                <span class="alert-icon">⚠️</span>
                <span>Critical Systems Require Attention</span>
            </div>
            <div class="critical-signals">
                <div v-for="(signal, key) in errorSignals" 
                     :key="key"
                     class="critical-signal">
                    <div class="signal-name">{{ key }}: {{ signal }}</div>
                    <div class="status-indicator error">
                        <span class="pulse-ring"></span>
                        <span class="status-dot"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Monitoring Grid -->
        <div class="monitoring-grid">
            <!-- System Status Signals -->
            <div class="signals-panel">
                <h3 class="panel-title">System Status</h3>
                <div class="signals-grid">
                    <div v-for="(signal, key) in filteredSignals" 
                         :key="key" 
                         class="signal-card"
                         :class="{ 'error-state': !checkStatus(signal) }">
                        <div class="signal-content">
                            <div class="signal-name">{{ key }}</div>
                            <div class="status-indicator" :class="checkStatus(signal) ? 'success' : 'error'">
                                <span class="pulse-ring"></span>
                                <span class="status-dot"></span>
                            </div>
                        </div>
                        <div class="status-text" :class="checkStatus(signal) ? 'success-text' : 'error-text'">
                            {{ signal }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Core Health Indicators -->
            <div class="health-panel">
                <h3 class="panel-title">Core Health</h3>
                <div class="health-grid">
                    <!-- User Error Status -->
                    <div class="health-card" :class="{ 'error-state': !userAnd }">
                        <div class="health-content">
                            <div class="health-info">
                                <div class="health-title">User Status</div>
                                <div class="health-status" :class="userAnd ? 'success-text' : 'error-text'">
                                    {{ userAnd ? 'Systems Normal' : 'Error Detected' }}
                                </div>
                            </div>
                            <div class="status-indicator large" :class="userAnd ? 'success' : 'error'">
                                <span class="pulse-ring"></span>
                                <span class="status-dot"></span>
                            </div>
                        </div>
                    </div>

                    <!-- Position Match Status -->
                    <div class="health-card clickable" 
                         :class="{ 'error-state': !positionStatus }"
                         @click="gotomispospage">
                        <div class="health-content">
                            <div class="health-info">
                                <div class="health-title">Position Status</div>
                                <div class="health-status" 
                                     :class="positionStatus ? 'success-text' : 'error-text'">
                                    {{ positionStatus ? 'Aligned' : 'Mismatch' }}
                                </div>
                            </div>
                            <div class="status-indicator large" 
                                 :class="positionStatus ? 'success' : 'error'">
                                <span class="pulse-ring"></span>
                                <span class="status-dot"></span>
                            </div>
                        </div>
                    </div>

                    <!-- Latency Metrics -->
                    <div class="health-card latency">
                        <div class="latency-title">Current Latency</div>
                        <div class="latency-value">{{ latency }} <span class="unit">ms</span></div>
                    </div>

                    <div class="health-card latency">
                        <div class="latency-title">Max Latency</div>
                        <div class="latency-value">{{ max_latency }} <span class="unit">ms</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { watchEffect } from 'vue';

const userAnd = ref(true);
const router = useRouter();

const gotomispospage = () => router.push('/posmismatch');

const toTitleCase = (str) =>
    str
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

// Check status helper function
const checkStatus = (signal) => {
    if (typeof signal === 'boolean') {
        return signal;
    }
    if (typeof signal === 'string') {
        return signal.toLowerCase() === 'active' || 
               signal.toLowerCase() === 'online' || 
               signal.toLowerCase() === 'true';
    }
    if (typeof signal === 'number') {
        return signal > 0;
    }
    return false;
};

// Props definition
const props = defineProps({
    signals: {
        type: Object,
        required: true,
    },
    latency: {
        type: Number,
        required: true,
    },
    max_latency: {
        type: Number,
        required: true,
    },
});

// Computed properties
const filteredSignals = computed(() => {
    return Object.fromEntries(
        Object.entries(props.signals)
            .filter(([key]) =>
                !key.startsWith('pulse_trader_xts') &&
                !key.startsWith('pulse_trader_zerodha') &&
                !key.startsWith('position_mismatch')
            )
            .map(([key, value]) => [toTitleCase(key), value])
    );
});

const errorSignals = computed(() => {
    return Object.fromEntries(
        Object.entries(filteredSignals.value)
            .filter(([_, signal]) => !checkStatus(signal))
    );
});

const userSignals = computed(() => {
    return Object.fromEntries(
        Object.entries(props.signals)
            .filter(([key]) =>
                key.startsWith('pulse_trader_xts') ||
                key.startsWith('pulse_trader_zerodha')
            )
    );
});

const positionStatus = computed(() => {
    const val = props.signals.position_mismatch;
    if (!val) return true;
    
    let tell = true;
    for (const v in val) {
        if (val.hasOwnProperty(v)) {
            tell = tell && Object.keys(val[v]).length === 0;
        }
    }
    return tell;
});

// Watch for changes in user signals
watchEffect(() => {
    const signals = userSignals.value;
    let and = Object.keys(signals).length > 0;
    for (const key in signals) {
        and = and && checkStatus(signals[key]);
    }
    userAnd.value = and;
});

const hasErrors = computed(() => {
    return Object.keys(errorSignals.value).length > 0 || 
           !userAnd.value || 
           !positionStatus.value;
});
</script>

<style scoped>
.dashboard-container {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    border: 1px solid rgba(229, 231, 235, 0.5);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Alerts Section */
.alerts-section {
    background: #FEF2F2;
    border: 1px solid #FEE2E2;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #DC2626;
    font-weight: 600;
    margin-bottom: 1rem;
}

.critical-signals {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.critical-signal {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #FEE2E2;
}

/* Monitoring Grid */
.monitoring-grid {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 1.5rem;
}

/* Panels */
.panel-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
}

/* Signals Grid */
.signals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
}

.signal-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid rgba(229, 231, 235, 0.5);
    transition: all 0.3s ease;
}

.signal-card.error-state {
    background: #FEF2F2;
    border-color: #FEE2E2;
}

.signal-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

/* Health Grid */
.health-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.health-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid rgba(229, 231, 235, 0.5);
}

.health-card.error-state {
    background: #FEF2F2;
    border-color: #FEE2E2;
}

.health-card.clickable {
    cursor: pointer;
    transition: all 0.3s ease;
}

.health-card.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Status Indicators */
.status-indicator {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-indicator.large {
    width: 48px;
    height: 48px;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    position: relative;
    z-index: 1;
}

.status-indicator.large .status-dot {
    width: 16px;
    height: 16px;
}

/* Pulse Animation */
.pulse-ring {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.status-indicator.large .pulse-ring {
    width: 40px;
    height: 40px;
}

/* Success/Error States */
.success .status-dot {
    background: #22c55e;
}

.success .pulse-ring {
    background: rgba(34, 197, 94, 0.1);
}

.error .status-dot {
    background: #ef4444;
}

.error .pulse-ring {
    background: rgba(239, 68, 68, 0.1);
}

.success-text {
    color: #22c55e;
}

.error-text {
    color: #ef4444;
}

/* Latency Cards */
.health-card.latency {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.latency-title {
    font-size: 0.875rem;
    color: #64748b;
}

.latency-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
}

.unit {
    font-size: 1rem;
    color: #64748b;
}

/* Animation */
@keyframes pulse {
    0% {
        transform: scale(0.95);
        opacity: 0.5;
    }
    50% {
        transform: scale(1.05);
        opacity: 0.3;
    }
    100% {
        transform: scale(0.95);
        opacity: 0.5;
    }
}

/* Responsive Design */
@media (max-width: 1024px) {
    .monitoring-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .health-grid {
        grid-template-columns: 1fr;
    }
}
</style>