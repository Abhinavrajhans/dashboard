<script setup>
import { onMounted, ref, provide } from 'vue';
import { RouterView } from 'vue-router';
import SideBar from './components/SideBar.vue';
import Toast from './components/Toast.vue';
import Login from './components/Login.vue';
import Signup from './components/Signup.vue';

const sideBarState = ref(false);
const toastConfig = ref({
  show: false,
  message: '',
  type: 'info',
});

const ChangeSideBarState = (data) => {
  sideBarState.value = data;
};

const triggerToast = (message, type = 'info') => {
  toastConfig.value = {
    show: true,
    message,
    type,
  };
};

const hideToast = () => {
  toastConfig.value.show = false;
};

const showloginorSignup = ref(false);
const isLoggedIn = ref(false);

const toggleForm = () => {
  showloginorSignup.value = !showloginorSignup.value;
};

const checkLoginStatus = () => {
  const token = localStorage.getItem('access_token');
  isLoggedIn.value = !!token;
};

const book = ref({});
const past_time_client = ref(0);
const client_latency = ref(0);
const max_client_latency = ref(0);

const handleMessage = (message) => {
  try {
    if (message === undefined) return;
    book.value['time'] = message['time'];

    if (book.value['Order_Errors']) {
      for (const key in book.value['Order_Errors']) {
        if (book.value['Order_Errors'][key].length != message['Order_Errors'][key].length) {
          triggerToast('New Error in Order', 'error');
        }
      }
    }

    book.value['Order_Errors'] = message['Order_Errors'];

    if (book.value['Pulse_Errors']) {
      for (const key in book.value['Pulse_Errors']) {
        if (book.value['Pulse_Errors'][key].length != message['Pulse_Errors'][key].length) {
          triggerToast('New Error in ' + key, 'error');
        }
      }
    }
    book.value['Pulse_Errors'] = message['Pulse_Errors'];
  } catch (error) {
    console.error('Error parsing event data or updating data:', error);
  }
};

const connectToSSE = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    if (isLoggedIn.value) alert('User not authenticated To Get Errors');
    return;
  }

  const socket = new WebSocket('wss://api.swancapital.in/errorLogs');

  socket.onmessage = (event) => {
    if (event.data === 'ping') {
      socket.send('pong');
    } else {
      const message = JSON.parse(event.data);
      let ar2 = message['time'];
      if (past_time_client.value === 0) past_time_client.value = ar2;
      if (past_time_client.value != 0) {
        let date1 = new Date(past_time_client.value.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
        let date2 = new Date(ar2.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1'));
        let diffInMs = date2 - date1;
        let diffInSeconds = diffInMs / 1000;
        client_latency.value = diffInSeconds;
        max_client_latency.value = Math.max(max_client_latency.value, client_latency.value);
        past_time_client.value = ar2;
      }

      handleMessage(message);
    }
  };

  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.reason);
  };

  socket.onopen = () => {
    const authMessage = JSON.stringify({ token });
    socket.send(authMessage);
    console.log('WebSocket connection opened');
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
};

onMounted(() => {
  connectToSSE();
  checkLoginStatus();
});

provide('triggerToast', triggerToast);
provide('book', book.value);
</script>

<template>
  <div class="App-pageLayout">
    <!-- Auth Container -->
    <div v-if="!isLoggedIn" class="App-auth-container">
      <div class="App-auth-card">
        <Signup v-if="showloginorSignup" @toggleForm="toggleForm" />
        <Login v-else @toggleForm="toggleForm" />
      </div>
    </div>

    <!-- Main App Container -->
    <div v-else class="App-app-container">
      <SideBar @State="ChangeSideBarState" class="App-sideBar" />

      <!-- Main Content Area -->
      <div :class="[sideBarState ? 'App-content' : 'App-content2', 'App-content-wrapper']">
        <!-- Top Bar -->
        <div class="App-top-bar">
          <div class="App-breadcrumb">
            <i class="ph-bold ph-house-simple"></i>
            <span>Dashboard</span>
          </div>

          <div class="App-indicators">
            <div class="App-latency-indicator">
              <span class="App-label">Latency:</span>
              <span class="App-value">{{ client_latency.toFixed(2) }}s</span>
            </div>
            <div class="App-max-latency-indicator">
              <span class="App-label">Max:</span>
              <span class="App-value">{{ max_client_latency.toFixed(2) }}s</span>
            </div>
          </div>
        </div>

        <!-- Toast Notifications -->
        <Toast 
          v-if="toastConfig.show" 
          :message="toastConfig.message" 
          :type="toastConfig.type" 
          @close="hideToast" 
          class="App-toast-container"
        />

        <!-- Router View -->
        <div class="App-router-view-container">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

.App-pageLayout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: "Inter", sans-serif;
}

/* Auth Styles */
.App-auth-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.App-auth-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.5);
  backdrop-filter: blur(10px);
}

/* App Container Styles */
.App-app-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.App-sideBar {
  position: fixed;
  height: 100vh;
  z-index: 50;
}

/* Content Styles */
.App-content-wrapper {
  flex: 1;
  background-color: #f8fafc;
  min-height: 100vh;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.App-content {
  margin-left: 100px;
  width: calc(100% - 100px);
}

.App-content2 {
  margin-left: 300px;
  width: calc(100% - 300px);
}

/* Top Bar Styles */
.App-top-bar {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background: white;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.App-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-weight: 500;
}

.App-breadcrumb i {
  font-size: 1.25rem;
}

/* Indicators Styles */
.App-indicators {
  display: flex;
  gap: 1.5rem;
}

.App-latency-indicator,
.App-max-latency-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.App-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.App-value {
  color: #0f172a;
  font-weight: 600;
}

/* Router View Container */
.App-router-view-container {
  padding: 2rem;
  height: calc(100vh - 70px);
  overflow-y: auto;
}

/* Toast Container */
.App-toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
}

/* Responsive Design */
@media (max-width: 768px) {
  .App-content {
    margin-left: 88px;
    width: calc(100% - 88px);
  }

  .App-content2 {
    margin-left: 280px;
    width: calc(100% - 280px);
  }

  .App-top-bar {
    padding: 0 1rem;
  }

  .App-indicators {
    gap: 0.75rem;
  }

  .App-latency-indicator,
  .App-max-latency-indicator {
    padding: 0.375rem 0.75rem;
  }
}
</style>
