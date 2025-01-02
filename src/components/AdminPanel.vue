<template>
    <div class="admin-container">
      <h1 class="admin-title">User Management</h1>
  
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>Loading users...</p>
      </div>
  
      <!-- Error State -->
      <div v-if="error" class="error-message">
        {{ error }}
        <button @click="fetchUsers" class="retry-button">Retry</button>
      </div>
  
      <!-- Users Table -->
      <div v-if="!loading && !error" class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>Email</th>
              <th>Role</th>
              <th>Account Access</th>
              <th>Actions</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="index">
              <td>{{ user.username }}</td>
              <td>{{ user.password }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user['Account Access'].join(', ') }}</td>
              <td>
                <button 
                  @click="openEditModal(user)"
                  class="edit-button"
                  :disabled="updateLoading"
                >
                  {{ updateLoading && editingIndex === index ? 'Saving...' : 'Edit' }}
                </button>
              </td>
              <td class="icon-cell">
                <i 
                    class="icon ph-bold ph-trash" 
                    @click="deleteUser(user)"
                    style="cursor: pointer;" 
                    title="Delete User"
                ></i>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Edit Modal -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <h2 class="modal-title">Edit User</h2>
          
          <!-- Edit Form Error -->
          <div v-if="updateError" class="error-message">
            {{ updateError }}
          </div>
  
          <div class="form-container">
            <div class="form-group">
              <label>Username</label>
              <input 
                v-model="editingUser.username"
                type="text"
                disabled
              >
            </div>
            <div class="form-group">
              <label>Password</label>
              <input 
                v-model="editingUser.password"
                type="text"
                :disabled="updateLoading"
              >
            </div>
            
  
            <div class="form-group">
              <label>Email</label>
              <input 
                v-model="editingUser.email"
                type="email"
                :disabled="updateLoading"
              >
            </div>
            <div class="form-group">
                <label>Role</label>
                <select 
                    v-model="editingUser.role" 
                    :disabled="updateLoading" 
                    class="form-select"
                >
                    <option v-for="role in roles" :key="role" :value="role">
                    {{ role }}
                    </option>
                </select>
            </div>
            <div class="form-group" v-if="editingUser.role === 'Monitor'">
                <label>Account Access</label>
                <a-select
                    v-model:value="selectedAccounts"
                    mode="multiple"
                    placeholder="Select Accounts"
                    style="width: 100%"
                    :options="accountOptionsWithAll"
                    :maxTagCount="3"
                    @change="handleAccountChange"
                    :disabled="updateLoading" 
                ></a-select>
            </div>

          </div>
  
          <div class="modal-actions">
            <button 
              @click="closeModal"
              class="cancel-button"
              :disabled="updateLoading"
            >
              Cancel
            </button>
            <button 
              @click="saveChanges"
              class="save-button"
              :disabled="updateLoading"
            >
              {{ updateLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
<script setup>
import { ref, computed, onMounted } from 'vue';

// State management
const users = ref([]);
const loading = ref(false);
const error = ref(null);
const showModal = ref(false);
const editingUser = ref(null);
const editingIndex = ref(-1);
const updateLoading = ref(false);
const updateError = ref(null);
const accounts = ref([]);
const selectedAccounts = ref([]);
const roles = ref([])
// "All" Label State
const isAllSelected = ref(false);

// Add "All" or "Remove All" option dynamically
const accountOptionsWithAll = computed(() => [
  { label: isAllSelected.value ? 'Remove All' : 'All', value: 'all' },
  ...accounts.value.map(account => ({
    label: account,
    value: account,
  })),
]);

// Handle selection change
const handleAccountChange = (value) => {
  if (value.includes('all')) {
    if (isAllSelected.value) {
      // Deselect all accounts
      selectedAccounts.value = [];
      isAllSelected.value = false;
    } else {
      // Select all accounts
      selectedAccounts.value = accounts.value;
      isAllSelected.value = true;
    }
  } else {
    // Normal selection handling
    selectedAccounts.value = value.filter(account => account !== 'all');
    isAllSelected.value = selectedAccounts.value.length === accounts.value.length;
  }
};


const openEditModal = (user) => {
  editingUser.value = { ...user };
  editingIndex.value = users.value.findIndex(u => u.email === user.email);
  updateError.value = null;
  showModal.value = true;
  selectedAccounts.value = user['Account Access'] || []; // Pre-fill selected accounts in modal
};

// Close modal
const closeModal = () => {
  showModal.value = false;
  editingUser.value = null;
  editingIndex.value = -1;
  updateError.value = null;
  selectedAccounts.value = [];
};

const fetchData = async (endpoint, stateRef) => {
  try {
    const response = await fetch(`https://api.swancapital.in/${endpoint}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`${endpoint} data from API:`, data);
      
      // Handle the special case for accounts where we need Object.keys()
      stateRef.value = endpoint === 'getAccounts' ? Object.keys(data) : (data || []);
    } else {
      console.error(`Error fetching ${endpoint}:`, response.statusText);
    }
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
  }
};

// Save Changes
const saveChanges = async () => {
  if(selectedAccounts.value.length === 0){
    alert("Accounts can be Empty");
    return;
  }
  updateLoading.value = true;
  updateError.value = null;

  try {
    // Prepare data for API
    const updatedUser = {
      ...editingUser.value,
      'Account Access': selectedAccounts.value,
    };

    const response = await fetch('https://api.swancapital.in/editUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    });

    if (response.ok) {
      users.value[editingIndex.value] = { ...updatedUser }; // Update local table
      closeModal();
      alert('User updated successfully!');
      window.location.reload(); 
    } else {
      const errorMessage = await response.text();
      updateError.value = `Error updating user: ${errorMessage}`;
    }
  } catch (error) {
    updateError.value = `An error occurred: ${error.message}`;
  } finally {
    updateLoading.value = false;
  }
};



// Usage:
const fetchUsers = () => fetchData('users', users);
const fetchAccounts = () => fetchData('getAccounts', accounts);
const fetchRoles = () => fetchData('getRoles', roles);


const deleteUser = async (user) => {
  try {
    const response = await fetch('https://api.swancapital.in/deleteUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user), // Serialize the user object
    });

    if (response.ok) {
      console.log(`User ${user.email} deleted successfully.`);
      location.reload(); // Reload the page on success
    } else {
      alert("Error deleting user. Please try again.");
      console.error('Error deleting user:', response.statusText);
    }
  } catch (error) {
    alert("Error deleting user. Please try again.");
    console.error('Error deleting user:', error);
  }
};

onMounted(async () => {
  await fetchUsers();
  await fetchAccounts();
  await fetchRoles();
});
</script>

  
  <style scoped>
 .admin-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

/* Table Styles */
.table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.admin-table th {
  background-color: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.admin-table td {
  padding: 12px 16px;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
}

.admin-table tr:hover {
  background-color: #f9fafb;
}

/* Button Styles */
.edit-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.edit-button:hover {
  background-color: #2563eb;
}

.save-button {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: #059669;
}

.cancel-button {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 8px;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #4b5563;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

/* Form Styles */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  color: #1f2937;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

/* Loading and Error States (already present in your code) */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loader {
  border: 4px solid #f3f3f3;
  border-radius: 50%;
  border-top: 4px solid #3b82f6;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  color: #dc2626;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.retry-button {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  margin-left: 10px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #b91c1c;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon-cell {
  text-align: center; /* Center horizontally */
  vertical-align: middle; /* Center vertically */
}

.icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem; /* Adjust size as needed */
}



.form-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  color: #1f2937;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%; /* Match the width of other input fields */
  appearance: none; /* Remove default arrow styles */
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>') no-repeat right 10px center;
  background-color: #fff;
  background-size: 1em;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-select:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}



  </style>