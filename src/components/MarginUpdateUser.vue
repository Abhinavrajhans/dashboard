<template>
  <!-- Keeping existing HTML structure -->
  <div class="data-fetch-container bg-gray-50">
    <div class="header">
      <h1 class="account-heading">Account: {{ account }}</h1>
      <div class="portfolio-section">
        <div class="portfolio-label">Portfolio Value:</div>
        <div class="portfolio-input-group">
          <span class="currency-symbol">₹</span>
          <input 
            type="number" 
            v-model="portfolioValue" 
            class="portfolio-input"
            @input="validatePortfolioValue"
            :class="{ 'error-input': portfolioError }"
          />
          <button 
            @click="updatePortfolioValue" 
            class="update-button"
            :disabled="portfolioError || isUpdatingPortfolio"
          >
            <i v-if="!isUpdatingPortfolio" class="ph-bold ph-check"></i>
            <i v-else class="ph-bold ph-spinner animate-spin"></i>
          </button>
        </div>
        <span v-if="portfolioError" class="error-text text-sm text-red-500 mt-1">{{ portfolioError }}</span>
      </div>
    </div>

    <!-- Existing template structure remains the same -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading data...</p>
    </div>


    <div v-if="filteredData && !loading && !error" class="content-wrapper">
      <!-- Existing content structure -->
      <div class="stats-selector">
        <label for="stat-option" class="stat-label">Choose a Statistic:</label>
        <select v-model="selectedStat" id="stat-option" class="stat-dropdown">
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="max">Maximum</option>
          <option value="min">Minimum</option>
        </select>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Qty Limit ({{ computeStat('qtylimit') }})</th>
              <th>CV Limit ({{ computeStat('cvlimit') }})</th>
              <th>Factor 1 ({{ computeStat('factor1') }})</th>
              <th>Factor 2 ({{ computeStat('factor2') }})</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in filteredData" :key="index">
              <td class="strategy-cell">{{ row.strategy }}</td>
              <td>
                <input 
                  type="number" 
                  v-model="row.qtylimit" 
                  class="editable-input"
                  @input="validateField(row, 'qtylimit')"
                  :class="{ 'error-input': row.errors?.qtylimit }"
                />
                <span v-if="row.errors?.qtylimit" class="error-text text-sm text-red-500 mt-1">{{ row.errors.qtylimit }}</span>
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="row.cvlimit" 
                  class="editable-input"
                  @input="validateField(row, 'cvlimit')"
                  :class="{ 'error-input': row.errors?.cvlimit }"
                />
                <span v-if="row.errors?.cvlimit" class="error-text text-sm text-red-500 mt-1">{{ row.errors.cvlimit }}</span>
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="row.factor1" 
                  class="editable-input"
                  @input="validateField(row, 'factor1')"
                  :class="{ 'error-input': row.errors?.factor1 }"
                />
                <span v-if="row.errors?.factor1" class="error-text text-sm text-red-500 mt-1">{{ row.errors.factor1 }}</span>
              </td>
              <td>
                <input 
                  type="number" 
                  v-model="row.factor2" 
                  class="editable-input"
                  @input="validateField(row, 'factor2')"
                  :class="{ 'error-input': row.errors?.factor2 }"
                />
                <span v-if="row.errors?.factor2" class="error-text text-sm text-red-500 mt-1">{{ row.errors.factor2 }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="action-buttons">
        <button 
          @click="updatePortfolioValue" 
          class="save-button"
          :disabled="hasErrors || isSaving"
        >
          <span class="button-icon">{{ isSaving ? '⌛' : '💾' }}</span>
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
        <button @click="confirmCancel" class="cancel-button">
          <span class="button-icon">✖</span>
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// State management
const data = ref(null);
const filteredData = ref(null);
const account = ref(route.params.username);
const loading = ref(false);
const error = ref(null);
const selectedStat = ref("sum");
const portfolioValue = ref('');
const portfolioError = ref('');
const isSaving = ref(false);
const isUpdatingPortfolio = ref(false);
const hasUnsavedChanges = ref(false);

// Computed properties
const hasErrors = computed(() => {
  if (!filteredData.value) return false;
  return filteredData.value.some(row => row.errors && Object.keys(row.errors).length > 0);
});

// API calls with enhanced error handling
const fetchData = async (endpoint, stateRef) => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("Authentication required. Please log in again.");

    const response = await fetch(`https://api.swancapital.in/${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      router.push("/login");
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Error: ${errorMessage}`);
    }

    const jsonData = await response.json();
    stateRef.value = jsonData;
  } catch (err) {
    error.value = err.message;
    console.error(`Error fetching ${endpoint}:`, err.message);
    throw err;
  }
};

// Data fetching with retry mechanism
const fetchMarginData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    await fetchData("MarginData", data);
    filteredData.value = data.value["params"][account.value];
    portfolioValue.value=data.value["pf"][account.value];
    hasUnsavedChanges.value = false;
  } catch (err) {
    throw err;
  } finally {
    loading.value = false;
  }
};

// Validation functions
const validatePortfolioValue = () => {
  const value = Number(portfolioValue.value);
  
  if (isNaN(value)) {
    portfolioError.value = 'Please enter a valid number';
    return false;
  }
  
  if (value < 0) {
    portfolioError.value = 'Value cannot be negative';
    return false;
  }
  portfolioError.value = ''; 
  hasUnsavedChanges.value = true;
  return true;
};

const validateField = (row, field) => {
  if (!row.errors) row.errors = {};
  const value = Number(row[field]);
  
  if (isNaN(value)) {
    row.errors[field] = 'Invalid number';
    return;
  }
  switch (field) {
    case 'qtylimit':
    case 'cvlimit' :
    case 'factor1':
    case 'factor2': 
      if (value < 0 ) {
        row.errors[field] = 'Must be Above 0';
      } else {
        delete row.errors[field];
      }
      break;
  }
  hasUnsavedChanges.value = true;
};


// Enhanced portfolio value update
const updatePortfolioValue = async () => {
  if (!validatePortfolioValue()) return;
  
  isUpdatingPortfolio.value = true;
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`https://api.swancapital.in/UpdatePortfolioValue`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        account: account.value, 
        portfolioValue: Number(portfolioValue.value),
        params:filteredData.value
      }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }

    alert("Portfolio value updated successfully!");
    cancelChanges();
  } catch (err) {
    alert(`Error updating portfolio value: ${err.message}`);
    console.error("Error updating portfolio value:", err.message);
  } finally {
    isUpdatingPortfolio.value = false;
  }
};

// Enhanced cancel functionality
const confirmCancel = () => {
  if (hasUnsavedChanges.value) {
    if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
      cancelChanges();
    }
  } else {
    cancelChanges();
  }
};

const cancelChanges = () => {

  router.push("/marginUpdate");
};



// Statistics computation
const computeStat = (field) => {
  if (!filteredData.value || filteredData.value.length === 0) return "-";

  const values = filteredData.value.map((row) => Number(row[field])).filter(val => !isNaN(val));
  if (values.length === 0) return "-";

  switch (selectedStat.value) {
    case "sum":
      return values.reduce((acc, val) => acc + val, 0).toFixed(2);
    case "avg":
      return (values.reduce((acc, val) => acc + val, 0) / values.length).toFixed(2);
    case "max":
      return Math.max(...values).toFixed(2);
    case "min":
      return Math.min(...values).toFixed(2);
    default:
      return "-";
  }
};

// Lifecycle hooks
onMounted(() => {
  fetchMarginData();
});
</script>
<style scoped>



.error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    padding: 2rem;
    margin: 2rem auto;
    max-width: 400px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
}

.error-icon {
    width: 32px;
    height: 32px;
    stroke: #ef4444;
    margin-bottom: 0.5rem;
}

.error-message {
    color: #1f2937;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
}

.retry-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    background-color: #3b82f6;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.retry-button:hover {
    background-color: #2563eb;
}

.retry-icon {
    width: 16px;
    height: 16px;
    stroke: currentColor;
}



.data-fetch-container {
    min-height: 100vh;
    padding: 1.75rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #f8fafc;
}

.header {
    position: relative;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 14px;
    padding: 1.75rem;
    text-align: center;
    transition: all 0.15s ease;
}

.account-heading {
    font-size: 1.5rem;
    color: #475569;
    font-weight: 600;
    margin-bottom: 1.25rem;
}

.portfolio-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.portfolio-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

.portfolio-input-group {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 10px;
    padding: 0.5rem;
    transition: all 0.15s ease;
    gap: 0.5rem;
}

.portfolio-input-group:focus-within {
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.currency-symbol {
    font-size: 1rem;
    color: #64748b;
    padding: 0 0.5rem;
}

.portfolio-input {
    width: 150px;
    border: none;
    outline: none;
    font-size: 1rem;
    color: #1e293b;
    font-weight: 500;
    padding: 0.375rem;
    background: transparent;
}

.update-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    background: #f1f5f9;
    border: none;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s ease;
}

.update-button:hover {
    background: #e2e8f0;
    color: #2563eb;
}

.content-wrapper {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 14px;
    padding: 1.75rem;
    margin-top: 1.75rem;
}

/* Table styles matching sidebar theme */
.table-container {
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 10px;
    overflow: hidden;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    background: #f8fafc;
    padding: 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.data-table td {
    padding: 1rem;
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.editable-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 8px;
    font-size: 0.875rem;
    color: #475569;
    transition: all 0.15s ease;
}

.editable-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

/* Action buttons matching sidebar theme */
.action-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.75rem;
    padding-top: 1.75rem;
    border-top: 1px solid rgba(229, 231, 235, 0.5);
}

.save-button,
.cancel-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.save-button {
    background: #2563eb;
    color: white;
}

.save-button:hover {
    background: #1d4ed8;
}

.cancel-button {
    background: #ef4444;
    color: white;
}

.cancel-button:hover {
    background: #dc2626;
}

/* Stats dropdown matching sidebar theme */
.stat-dropdown {
    padding: 0.75rem 1.25rem;
    border: 1px solid rgba(229, 231, 235, 0.5);
    border-radius: 10px;
    background: white;
    color: #475569;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.stat-dropdown:hover {
    border-color: #2563eb;
}

.stat-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
}

@media (max-width: 768px) {
    .data-fetch-container {
        padding: 1rem;
    }

    .action-buttons {
        flex-direction: column;
    }

    .portfolio-input-group {
        width: 100%;
        max-width: 300px;
    }
}
</style>