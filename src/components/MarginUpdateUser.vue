<template>
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
                        @change="updatePortfolioValue"
                        :placeholder="data?.pf[account] || '0'"
                    />
                    <button @click="updatePortfolioValue" class="update-button">
                        <i class="ph-bold ph-check"></i>
                    </button>
                </div>
            </div>
        </div>
  
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
  
      <!-- Error State -->
      <div v-if="error" class="error-container">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12" y2="16"></line>
        </svg>
        <p>{{ error }}</p>
      </div>
  
      <!-- Main Content -->
      <div v-if="filteredData && !loading && !error" class="content-wrapper">
        <!-- Statistics Selector -->
        <div class="stats-selector">
          <label for="stat-option" class="stat-label">Choose a Statistic:</label>
          <select v-model="selectedStat" id="stat-option" class="stat-dropdown">
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="max">Maximum</option>
            <option value="min">Minimum</option>
          </select>
        </div>
  
        <!-- Editable Table -->
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
                  <input type="number" v-model="row.qtylimit" class="editable-input" />
                </td>
                <td>
                  <input type="number" v-model="row.cvlimit" class="editable-input" />
                </td>
                <td>
                  <input type="number" v-model="row.factor1" class="editable-input" />
                </td>
                <td>
                  <input type="number" v-model="row.factor2" class="editable-input" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="saveChanges" class="save-button">
            <span class="button-icon">💾</span>
            Save Changes
          </button>
          <button @click="cancelChanges" class="cancel-button">
            <span class="button-icon">✖</span>
            Cancel
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  
  const route = useRoute();
  const router = useRouter();
  
  const data = ref(null);
  const filteredData = ref(null);
  const account = ref(route.params.username);
  const loading = ref(false);
  const error = ref(null);
  const selectedStat = ref("sum");
  
  const fetchData = async (endpoint, stateRef) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("User not authenticated");
  
      const response = await fetch(`https://api.swancapital.in/${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Error fetching ${endpoint}: ${errorMessage}`);
      }
  
      const jsonData = await response.json();
      stateRef.value = jsonData;
    } catch (err) {
      error.value = err.message;
      console.error(`Error fetching ${endpoint}:`, err.message);
    } finally {
      loading.value = false;
    }
  };
  
  const fetchMarginData = async () => {
    loading.value = true;
    await fetchData("MarginData", data);
    filteredData.value = data.value["params"][account.value];
  };
  
  const saveChanges = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("User not authenticated");
  
      const response = await fetch(`https://api.swancapital.in/MarginUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account: account.value, data: filteredData.value }),
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Error saving data: ${errorMessage}`);
      }
  
      alert("Changes saved successfully!");
    } catch (err) {
      alert(`Error saving changes: ${err.message}`);
      console.error("Error saving changes:", err.message);
    }
  };
  
  const cancelChanges = () => {
    router.push("/marginUpdate");
  };
  
  const computeStat = (field) => {
    if (!filteredData.value || filteredData.value.length === 0) return "-";
  
    const values = filteredData.value.map((row) => row[field]);
    switch (selectedStat.value) {
      case "sum":
        return values.reduce((acc, val) => acc + val, 0);
      case "avg":
        return (values.reduce((acc, val) => acc + val, 0) / values.length).toFixed(2);
      case "max":
        return Math.max(...values);
      case "min":
        return Math.min(...values);
      default:
        return "-";
    }
  };
  
  onMounted(fetchMarginData);
  </script>
  
<style scoped>
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