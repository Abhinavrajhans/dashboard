<template>
    <div class="signup-container">
      <div class="signup-card">
        <h2>Sign Up</h2>
        <form @submit.prevent="handleSignup">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              v-model="username"
              type="text"
              id="username"
              placeholder="Enter your username"
              required
            />
          </div>
  
          <div class="form-group">
            <label for="email">Email</label>
            <input
              v-model="email"
              type="email"
              id="email"
              placeholder="Enter your email"
              required
            />
          </div>
  
          <div class="form-group">
            <label for="password">Password</label>
            <input
              v-model="password"
              type="password"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>
  
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              required
            />
          </div>
  
          <!-- Role Selection
          <div class="form-group">
            <label for="role">Role</label>
            <a-select
              v-model:value="role"
              placeholder="Select Role"
              style="width: 100%"
            >
              <a-select-option value="Admin">Admin</a-select-option>
              <a-select-option value="Monitor">Monitor</a-select-option>
            </a-select>
          </div>
          
          <div class="form-group" v-if="role === 'Monitor'">
            <label>Account Access</label>
            <a-select
              v-model:value="selectedAccounts"
              mode="multiple"
              placeholder="Select Accounts"
              style="width: 100%"
              :options="accountOptions"
              :maxTagCount="3"
            ></a-select>
          </div> -->
  
          <button type="submit" class="signup-button">Sign Up</button>
        </form>
  
        <!-- Login Button -->
        <button @click="goToLogin" class="login-button">
          Already have an account? Log In
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  const SignUpUser = async (username, password, role, accountAccess) => {
    try {
      const response = await fetch('https://api.swancapital.in/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
          role: role,
          accountAccess: role === 'Monitor' ? accountAccess : null,
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        return data;
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
  
  // State definitions
  const username = ref('');
  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const role = ref('');
  const selectedAccounts = ref([]);
  const accounts = ref([]);
  
  // Computed property for account options
  const accountOptions = computed(() => 
    accounts.value.map(account => ({
      label: account,
      value: account
    }))
  );
  
  // Fetch accounts when the component is mounted
  onMounted(async () => {
    try {
      const response = await fetch('https://api.swancapital.in/getAccounts');
      if (response.ok) {
        const data = await response.json();
        accounts.value = Object.keys(data) || [];
      } else {
        console.error('Error fetching accounts:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
  
  // Emit function for toggling forms
  const emit = defineEmits(['toggleForm']);
  
  // Handle Signup logic
  const handleSignup = async () => {
    if (password.value !== confirmPassword.value) {
      alert('Passwords do not match.');
      return;
    }
  
    if (username.value && email.value && password.value ) {
      // if (role.value === 'Monitor' && selectedAccounts.value.length === 0) {
      //   alert('Please select at least one account for Monitor.');
      //   return;
      // }
  
      try {
        await SignUpUser(
          username.value,
          password.value,
          role.value,
          selectedAccounts.value
        );
        alert('Signup successful!');
        goToLogin();
      } catch (error) {
        alert('Error during signup. Please try again.');
      }
    } else {
      alert('Please fill in all fields.');
    }
  };
  
  // Emit event to switch to login form
  const goToLogin = () => {
    emit('toggleForm');
  };
  </script>
  
  <style scoped>
  .signup-container {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20px;
  }
  
  .signup-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }
  
  h2 {
    text-align: center;
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.15s ease-in-out;
  }
  
  input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  .signup-button,
  .login-button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;
  }
  
  .signup-button {
    background-color: #10b981;
    color: white;
    margin-bottom: 1rem;
  }
  
  .signup-button:hover {
    background-color: #059669;
  }
  
  .login-button {
    background-color: #3b82f6;
    color: white;
  }
  
  .login-button:hover {
    background-color: #2563eb;
  }
  
  /* Ant Design Select Customization */
  :deep(.ant-select) {
    width: 100%;
  }
  
  :deep(.ant-select-selector) {
    border-radius: 0.375rem !important;
    min-height: 42px !important;
  }
  
  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    line-height: 42px !important;
  }
  
  :deep(.ant-select-multiple .ant-select-selection-item) {
    line-height: 24px !important;
  }
  
  @media (max-width: 640px) {
    .signup-card {
      padding: 1.5rem;
    }
  
    input,
    .signup-button,
    .login-button {
      padding: 0.625rem;
    }
  
    :deep(.ant-select-selector) {
      min-height: 38px !important;
    }
  
    :deep(.ant-select-selection-item),
    :deep(.ant-select-selection-placeholder) {
      line-height: 38px !important;
    }
  }
  </style>