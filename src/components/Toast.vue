<!-- Toast.vue -->
<template>
    <Transition name="toast-slide">
        <div v-if="isVisible" class="toast-wrapper">
            <div class="toast" :class="type">
                <div class="toast-content">
                    <i :class="getIcon" class="toast-icon"></i>
                    <span class="toast-message">{{ message }}</span>
                </div>
                <button @click="hide" class="close-btn">
                    <i class="ph-bold ph-x"></i>
                </button>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'info',
        validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
    }
})

const emit = defineEmits(['close'])
const isVisible = ref(true)

const getIcon = computed(() => {
    const icons = {
        info: 'ph-bold ph-info',
        success: 'ph-bold ph-check-circle',
        warning: 'ph-bold ph-warning',
        error: 'ph-bold ph-x-circle'
    }
    return icons[props.type]
})

const show = () => {
    isVisible.value = true
    // Auto-hide after 5 seconds
    // setTimeout(hide, 5000)
}

const hide = () => {
    isVisible.value = false
    emit('close')
}

watch(() => props.message, show)
show()
</script>

<style scoped>
.toast-wrapper {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    max-width: 400px;
    width: calc(100% - 48px);
}

.toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(229, 231, 235, 0.5);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toast-icon {
    font-size: 20px;
    flex-shrink: 0;
}

.toast-message {
    color: #1e293b;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
}

.close-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #64748b;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background-color: #f1f5f9;
    color: #0f172a;
}

/* Toast Types */
.info {
    border-left: 4px solid #2196F3;
    .toast-icon { color: #2196F3; }
}

.success {
    border-left: 4px solid #10b981;
    .toast-icon { color: #10b981; }
}

.warning {
    border-left: 4px solid #f59e0b;
    .toast-icon { color: #f59e0b; }
}

.error {
    border-left: 4px solid #ef4444;
    .toast-icon { color: #ef4444; }
}

/* Animation */
.toast-slide-enter-active,
.toast-slide-leave-active {
    transition: all 0.3s ease;
}

.toast-slide-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.toast-slide-leave-to {
    opacity: 0;
    transform: translateX(30px);
}
</style>