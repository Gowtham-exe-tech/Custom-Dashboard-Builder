<template>
  <div class="tbl-root" :style="{ fontSize: fontSize + 'px' }">
    <div class="tbl-scroll">
      <table>
        <thead>
          <tr>
            <th
              v-for="column in shownColumns"
              :key="column"
              :style="{ background: headerBackground }">
              {{ labelFor(column) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in pageRows" :key="index">
            <td v-for="column in shownColumns" :key="column">
              {{ cellText(column, row[column]) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!pageRows.length" class="tbl-empty">No data</p>
    </div>
    <div v-if="pageCount > 1" class="tbl-pager">
      <button type="button" :disabled="page === 1" @click="page--">‹</button>
      <span>{{ page }} / {{ pageCount }}</span>
      <button type="button" :disabled="page === pageCount" @click="page++">
        ›
      </button>
    </div>
  </div>
</template>

<script>
import { fieldLabel } from "../../utils/dashboardConfig";
import { formatCell } from "../../utils/formatHelpers";

export default {
  name: "TableWidget",
  props: {
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    fontSize: { type: Number, default: 14 },
    headerBackground: { type: String, default: "#D8D8D8" },
    pageSize: { type: [Number, String], default: "" },
  },
  data() {
    return { page: 1 };
  },
  computed: {
    // show the first columns when none are picked yet
    shownColumns() {
      return this.columns.length
        ? this.columns
        : ["orderNumber", "quantity", "productName", "total"];
    },
    size() {
      return Number(this.pageSize) || 0;
    },
    pageCount() {
      return this.size
        ? Math.max(1, Math.ceil(this.rows.length / this.size))
        : 1;
    },
    pageRows() {
      return this.size
        ? this.rows.slice((this.page - 1) * this.size, this.page * this.size)
        : this.rows;
    },
  },
  watch: {
    rows() {
      this.page = 1;
    },
    pageSize() {
      this.page = 1;
    },
  },
  methods: { labelFor: fieldLabel, cellText: formatCell },
};
</script>

<style scoped>
.tbl-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 1px solid #e3e5e8;
  border-radius: 4px;
  overflow: hidden;
  color: #202124;
}
.tbl-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 9px 14px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #eceef0;
}
th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-weight: 600;
  font-size: 0.92em;
}
tbody tr:last-child td {
  border-bottom: 0;
}
.tbl-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - 38px);
  min-height: 40px;
  margin: 0;
  color: #202124;
}
.tbl-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 5px 10px;
  border-top: 1px solid #eceef0;
  font-size: 11px;
  color: #6b7385;
}
.tbl-pager button {
  width: 22px;
  height: 22px;
  padding: 0;
  color: #202124;
  background: #fff;
  border: 1px solid #dcdfe3;
  border-radius: 4px;
  line-height: 1;
}
.tbl-pager button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
