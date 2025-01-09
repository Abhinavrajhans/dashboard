<script setup>
import { ref, watchEffect, onMounted, onUnmounted ,computed} from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter();
import {
    useVueTable,
    FlexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
} from '@tanstack/vue-table'
import * as XLSX from 'xlsx';
const download = (type) => {
    const file_name = props.title + '.' + type
    const data = props.data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, file_name);
}


// Define the props
const props = defineProps({
    data: {
        type: Array,
        required: true
    },
    showPin:{
        type:Boolean,
        required:false
    },
    title: {
        type: String,
        required: true
    },
    columns: {
        type: Array,
        required: true
    },
    hasColor: {
        type: Array,
        required: true
    },
    navigateTo: {
        type: Object,
        required: true
    },
    showPagination: {
        type: Boolean,
        required: true
    },
    hasRowcolor: {
        type: Object,
        required: false
    }
})

const tellnav = (data) => {
    return props.navigateTo[data.id.substring(2)];
}
const checkNavigate = (data) => {

    if (props.navigateTo[data.id.substring(2)]) {
        let link = props.navigateTo[data.id.substring(2)] + data.getValue()
        router.push(link);
    }
}

const sorting = ref([])
const filter = ref('')
const toggleAllColumns = (value) => {
  table.toggleAllColumnsVisible(value)
}

const isAllColumnsVisible = computed(() => {
  return table.getIsAllColumnsVisible()
})

// Custom pagination state
const currentPage = ref(0)
const pageSize = ref(5)

// Add this after your existing refs
const columnVisibility = ref({})

// Modify your table initialization to include column visibility state
const table = useVueTable({
  get data() {
    return props.data
  },
  columns: props.columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    get sorting() {
      return sorting.value
    },
    get globalFilter() {
      return filter.value
    },
    get columnVisibility() {
      return columnVisibility.value
    }
  },
  onSortingChange: updaterOrValue => {
    sorting.value =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(sorting.value)
        : updaterOrValue
  },
  onColumnVisibilityChange: updaterOrValue => {
    columnVisibility.value =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(columnVisibility.value)
        : updaterOrValue
  },
})

// Computed properties for pagination
const pageCount = ref(0)
const rows = ref([])

// Add this after the existing imports
// Add after imports
const formatIndianNumber = (value) => {
    if (value === null || value === undefined || value === '') return value;

    const num = Number(value);
    if (isNaN(num)) return value;

    // Handle the negative sign
    const isNegative = num < 0;
    const absoluteNum = Math.abs(num);

    const [integerPart, decimalPart] = absoluteNum.toString().split('.');
    const lastThree = integerPart.slice(-3);
    const remaining = integerPart.slice(0, -3);

    const withCommas = remaining
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;

    const formattedNumber = decimalPart
        ? `${withCommas}.${decimalPart}`
        : withCommas;

    // Add back the negative sign if necessary
    return isNegative ? `-${formattedNumber}` : formattedNumber;
};


watchEffect(() => {
    const filteredRows = table.getFilteredRowModel().rows
    const sortedRows = table.getSortedRowModel().rows
    const finalRows = sortedRows.length > 0 ? sortedRows : filteredRows

    pageCount.value = Math.ceil(finalRows.length / pageSize.value)
    const start = currentPage.value * pageSize.value
    const end = start + pageSize.value
    rows.value = finalRows.slice(start, end)
})


// Pagination methods
const nextPage = () => {
    if (currentPage.value < pageCount.value - 1) {
        currentPage.value++
    }
}

const previousPage = () => {
    if (currentPage.value > 0) {
        currentPage.value--
    }
}

const setPageSize = (size) => {
    pageSize.value = size
    currentPage.value = 0  // Reset to first page when changing page size
}

const handleMouseWheel = (event) => {
    const container = event.currentTarget;
    if (container) {
        container.scrollLeft += event.deltaY;
        event.preventDefault();
    }
}

onMounted(() => {
    const containers = document.querySelectorAll('.table-container');
    containers.forEach(container => {
        container.addEventListener('wheel', handleMouseWheel, { passive: false });
    });
})

onUnmounted(() => {
    const containers = document.querySelectorAll('.table-container');
    containers.forEach(container => {
        container.removeEventListener('wheel', handleMouseWheel);
    });
})

</script>
<template>
    <div class="modern-table-wrapper">
        <header class="table-header">
            <h2 class="table-title">{{ title }}</h2>
            
            <!-- Controls Bar -->
            <div class="controls-bar">
                <!-- Column Visibility Toggle -->
                <div v-if="showPin" class="visibility-panel">
                    <div class="mb-2 border-b pb-2">
                        <label class="flex items-center">
                            <input
                                type="checkbox"
                                :checked="isAllColumnsVisible"
                                @change="e => toggleAllColumns(e.target.checked)"
                                class="mr-2"
                            />
                            <span>Toggle All</span>
                        </label>
                    </div>
                    
                    <div v-if="showPin" class="columns-grid">
                        <div v-for="column in table.getAllLeafColumns()" 
                             :key="column.id" 
                             class="column-option">
                            <label class="flex items-center">
                                <input
                                    type="checkbox"
                                    :checked="column.getIsVisible()"
                                    @change="column.toggleVisibility()"
                                    class="mr-2"
                                />
                                <span>{{ column.id }}</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Search and Download -->
                <div class="table-actions">
                    <div class="search-box" v-if="showPagination">
                        <i class="ph-bold ph-magnifying-glass search-icon"></i>
                        <input 
                            type="text" 
                            class="search-input" 
                            placeholder="Search in table..."
                            v-model="filter" 
                        />
                    </div>
                    
                    <div class="action-buttons">
                        <button @click="download('csv')" class="action-btn csv">
                            <i class="ph-bold ph-file-csv"></i>
                            <span>CSV</span>
                        </button>
                        <button @click="download('xlsx')" class="action-btn excel">
                            <i class="ph-bold ph-file-excel"></i>
                            <span>Excel</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Table Container -->
        <div class="table-container" @wheel="handleMouseWheel">
            <div class="inline-block min-w-full py-2 align-middle">
                <table class="min-w-full divide-y divide-gray-300">
                    <thead>
                        <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                            <th v-for="header in headerGroup.headers" 
                                :key="header.id" 
                                scope="col"
                                class="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 borderright textcenter"
                                :class="{
                                    'cursor-pointer select-none': header.column.getCanSort(),
                                    'sticky-header': header.index === 0,
                                }" 
                                @click="header.column.getToggleSortingHandler()?.($event)">
                                <FlexRender 
                                    :render="header.column.columnDef.header"
                                    :props="header.getContext()" 
                                />
                                {{ { asc: ' ↑', desc: '↓' }[header.column.getIsSorted()] }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr v-for="row in rows" :key="row.id">
                            <td v-for="(cell, index) in row.getVisibleCells()" 
                                :key="cell.id"
                                class="maxwidth150 minwidhth100 break-words whitespace-normal px-3 py-4 text-sm text-black-600 textcenter"
                                :class="{
                                    'sticky-column': index === 0,
                                    'red': cell.getValue() < 0 && hasColor.includes(cell.id.split('_').slice(1).join('_')),
                                    'green': cell.getValue() > 0 && hasColor.includes(cell.id.split('_').slice(1).join('_')),
                                    'cursorpointer': tellnav(cell)
                                }"
                                @click="checkNavigate(cell)">
                                <template v-if="cell.getValue() !== undefined">
                                    {{ typeof cell.getValue() === 'number' ? formatIndianNumber(cell.getValue()) : cell.getValue() }}
                                </template>
                                <template v-else>
                                    N/A
                                </template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="showPagination" class="pagination-section">
            <div class="pagination-info">
                <span class="current-page">Page {{ currentPage + 1 }} of {{ pageCount }}</span>
                <span class="results-count">{{ table.getFilteredRowModel().rows.length }} results</span>
            </div>
            
            <div class="page-size-selector">
                <span class="selector-label">Rows per page:</span>
                <div class="size-buttons">
                    <button v-for="size in [5, 10, 20]" 
                            :key="size"
                            @click="setPageSize(size)"
                            :class="['size-btn', { active: pageSize === size }]"
                    >
                        {{ size }}
                    </button>
                </div>
            </div>
            
            <div class="pagination-controls">
                <button class="page-btn" 
                        @click="currentPage = 0"
                        :disabled="currentPage === 0">
                    <i class="ph-bold ph-caret-double-left"></i>
                </button>
                <button class="page-btn" 
                        @click="previousPage"
                        :disabled="currentPage === 0">
                    <i class="ph-bold ph-caret-left"></i>
                </button>
                
                <span class="page-indicator">{{ currentPage + 1 }}</span>
                
                <button class="page-btn" 
                        @click="nextPage"
                        :disabled="currentPage === pageCount - 1">
                    <i class="ph-bold ph-caret-right"></i>
                </button>
                <button class="page-btn" 
                        @click="currentPage = pageCount - 1"
                        :disabled="currentPage === pageCount - 1">
                    <i class="ph-bold ph-caret-double-right"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modern-table-wrapper {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
}

/* Header Styles */
.table-header {
    margin-bottom: 1.5rem;
}

.table-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1.25rem;
}

.controls-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

/* Visibility Panel */
.visibility-panel {
    position: relative;
}

.toggle-visibility-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
}

.toggle-visibility-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}

.columns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-top: 0.5rem;
}

.column-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #475569;
    cursor: pointer;
}

/* Search and Actions */
.table-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.search-box {
    position: relative;
}

.search-input {
    width: 280px;
    padding: 0.625rem 1rem 0.625rem 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #1e293b;
    transition: all 0.2s ease;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 1.125rem;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn.csv {
    background: #2563eb;
    color: white;
}

.action-btn.csv:hover {
    background: #1d4ed8;
}

.action-btn.excel {
    background: #16a34a;
    color: white;
}

.action-btn.excel:hover {
    background: #15803d;
}

/* Table Styles */
.table-container {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
    width: 100%;
    margin: 0 -1.5rem;
    padding: 0 1.5rem;
}

/* Base table styles */
table {
    border-right: none;
    border-left: none;
    width: 100%;
}

/* Cell widths */
.maxwidth150 {
    max-width: 150px;
}

.minwidhth100 {
    min-width: 100px;
}



/* Text alignment */
.textcenter {
    text-align: center;
}

/* Colors */
.red {
    color: #dc2626;
}

.green {
    color: #16a34a;
}

/* Clickable elements */
.cursorpointer {
    cursor: pointer;
    color: #2563eb;
    transition: all 0.2s ease;
}

.cursorpointer:hover {
    text-decoration: underline;
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Header Cells */
.data-table th {
    background: #f8fafc;
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
    position: relative;
}

.th-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sort-arrow {
    color: #94a3b8;
    font-size: 0.75rem;
}

.sortable {
    cursor: pointer;
    user-select: none;
}

.sortable:hover {
    background: #f1f5f9;
}

/* Table Body */
.data-table td {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    color: #1e293b;
    border-bottom: 1px solid #f1f5f9;
}

.table-row:hover td {
    background: #f8fafc;
}

.value-positive {
    color: #16a34a;
    font-weight: 500;
}

.value-negative {
    color: #dc2626;
    font-weight: 500;
}

.na-text {
    color: #94a3b8;
    font-style: italic;
}

.clickable {
    cursor: pointer;
    color: #2563eb;
}

.clickable:hover {
    text-decoration: underline;
}

/* Pagination Section */
.pagination-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f1f5f9;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
}

.pagination-info {
    font-size: 0.875rem;
    color: #475569;
    display: flex;
    gap: 0.5rem;
}

.results-count {
    color: #94a3b8;
}

.page-size-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.selector-label {
    font-size: 0.875rem;
    color: #475569;
}

.size-buttons {
    display: flex;
    gap: 0.25rem;
}

.size-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid #e2e8f0;
    background: white;
    color: #475569;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.size-btn:hover {
    background: #f8fafc;
}

.size-btn.active {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #2563eb;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.page-btn {
    padding: 0.5rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.page-btn:hover:not(:disabled) {
    background: #f8fafc;
    color: #2563eb;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-indicator {
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #1e293b;
    font-weight: 500;
}

/* Sticky Elements */
.sticky-header {
    position: sticky;
    left: 0;
    z-index: 2;
    background:  white;
}

.sticky-column {
    position: sticky;
    left: 0;
    z-index: 1;
    background:  white;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
    transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .controls-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .table-actions {
        flex-direction: column;
        gap: 1rem;
    }

    .search-box {
        width: 100%;
    }

    .search-input {
        width: 100%;
    }

    .action-buttons {
        width: 100%;
    }

    .action-btn {
        flex: 1;
        justify-content: center;
    }

    .columns-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .modern-table-wrapper {
        padding: 1rem;
    }

    .pagination-section {
        flex-direction: column;
        align-items: stretch;
        gap: 1.25rem;
    }

    .pagination-info,
    .page-size-selector {
        justify-content: center;
    }

    .pagination-controls {
        justify-content: center;
    }

    .columns-grid {
        grid-template-columns: 1fr;
    }

    .data-table th,
    .data-table td {
        padding: 0.75rem;
    }
}

/* Focus States */
.search-input:focus,
.action-btn:focus,
.page-btn:focus,
.size-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Loading States */
.table-scroll.loading {
    position: relative;
}

.table-scroll.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Empty State */
tbody:empty::after {
    content: 'No data available';
    display: block;
    text-align: center;
    padding: 2rem;
    color: #94a3b8;
    font-style: italic;
    grid-column: 1 / -1;
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}

/* Interactive Elements */
.clickable {
    position: relative;
    overflow: hidden;
}

.clickable::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: currentColor;
    transform: scaleX(0);
    transition: transform 0.2s ease;
}

.clickable:hover::after {
    transform: scaleX(1);
}

/* Print Styles */
@media print {
    .modern-table-wrapper {
        box-shadow: none;
    }

    .controls-bar,
    .pagination-section {
        display: none;
    }

    .table-scroll {
        overflow: visible;
    }

    .data-table {
        border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
        border: 1px solid #e2e8f0;
    }
}

/* Additional Utility Classes */
.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.max-width-cell {
    max-width: 200px;
}

.min-width-cell {
    min-width: 100px;
}

/* Tooltip for truncated content */
.text-ellipsis:hover::before {
    content: attr(data-full-text);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem;
    background: #1e293b;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: normal;
    max-width: 300px;
    z-index: 10;
}

/* Custom Checkbox Styling */
input[type="checkbox"] {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 2px solid #e2e8f0;
    appearance: none;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
}

input[type="checkbox"]:checked {
    background: #3b82f6;
    border-color: #3b82f6;
}

input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
}

/* Enhanced Row Hover Effect */
.table-row {
    transition: all 0.2s ease;
}

.table-row:hover {
    background: rgba(59, 130, 246, 0.05);
}

/* Sort Indicator Animation */
.sort-arrow {
    transition: transform 0.2s ease;
}

.sorted.asc .sort-arrow {
    transform: rotate(0deg);
}

.sorted.desc .sort-arrow {
    transform: rotate(180deg);
}



</style>