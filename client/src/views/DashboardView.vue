<template>
  <section class="dsh-page">
    <div class="page-heading dsh-heading">
      <div>
        <h2>Customer Orders</h2>
        <p class="page-description">
          View and manage customer orders and details
        </p>
      </div>
      <button
        v-if="hasWidgets"
        class="button outline-green dsh-config-button"
        type="button"
        @click="openConfiguration">
        <img src="../assets/icons/settings-regular.svg" alt="" />Configure
        dashboard
      </button>
    </div>
    <div class="dsh-tabs-row">
      <div class="orders-tabs">
        <button class="active dsh-active-tab" type="button">
          <img
            src="../assets/icons/line-chart-dots-square-regular.svg"
            alt="" />Dashboard
        </button>
        <button type="button" @click="$router.push('/orders')">
          <img src="../assets/icons/layout-web-12-regular.svg" alt="" />Table
        </button>
      </div>
      <label v-if="hasWidgets" class="dsh-date"
        ><img src="../assets/icons/calendar-filled.svg" alt="" /><select
          v-model="dateRange"
          aria-label="Date range"
          @change="loadWidgetData">
          <option
            v-for="item in dateRangeOptions"
            :key="item.value"
            :value="item.value">
            {{ item.label }}
          </option>
        </select></label
      >
    </div>
    <p v-if="loading" class="dsh-state">Loading dashboard...</p>
    <div v-else-if="errorMessage" class="dsh-state dsh-error">
      <p>{{ errorMessage }}</p>
      <button class="button outline-green" type="button" @click="loadDashboard">
        Try again
      </button>
    </div>
    <div v-else-if="!hasWidgets" class="dsh-empty">
      <img
        class="dsh-empty-icon"
        src="../assets/icons/line-chart-dots-square-regular.svg"
        alt="" />
      <h3>Dashboard Not Configured</h3>
      <p>Configure your dashboard to start viewing analytics</p>
      <button
        class="button outline-green"
        type="button"
        @click="openConfiguration">
        <img src="../assets/icons/settings-regular.svg" alt="" />Configure
        dashboard
      </button>
    </div>
    <div v-else class="dsh-grid">
      <WidgetCard
        v-for="widget in sortedWidgets"
        :key="widget.id"
        :widget="widget"
        mode="view"
        :result="widgetData[widget.id] || null"
        :loading="dataLoading && !widgetData[widget.id]"
        :failed="Boolean(widgetFailed[widget.id])"
        class="dsh-widget"
        :class="{ 'dsh-kpi': widget.type === 'kpi' }"
        :style="{
          gridColumn: `${widget.x + 1} / span ${widget.w}`,
          gridRow: `${widget.y + 1} / span ${widget.h}`,
        }" />
    </div>
  </section>
</template>

<script>
import WidgetCard from "../components/WidgetCard.vue";
import { getDefaultDashboard } from "../services/dashboardService";
import { getWidgetData } from "../services/widgetService";
import {
  dateRangeOptions,
  normalizeWidget,
  widgetTypes,
} from "../utils/dashboardConfig";

export default {
  name: "DashboardView",
  components: { WidgetCard },
  data() {
    return {
      dashboard: null,
      widgets: [],
      widgetData: {},
      widgetFailed: {},
      dateRange: "all",
      dateRangeOptions,
      loading: true,
      dataLoading: false,
      errorMessage: "",
      requestId: 0,
    };
  },
  computed: {
    hasWidgets() {
      return this.widgets.length > 0;
    },
    // top to bottom, left to right (used when the grid stacks on small screens)
    sortedWidgets() {
      return [...this.widgets].sort((a, b) => a.y - b.y || a.x - b.x);
    },
  },
  mounted() {
    this.loadDashboard();
  },
  methods: {
    openConfiguration() {
      this.$router.push(
        this.dashboard && this.dashboard._id
          ? {
              name: "dashboardEdit",
              params: { dashboardId: this.dashboard._id },
            }
          : { name: "dashboardCreate" },
      );
    },
    async loadDashboard() {
      this.loading = true;
      this.errorMessage = "";
      try {
        this.dashboard = (await getDefaultDashboard()).data.data;
        this.widgets = (this.dashboard.widgets || [])
          .filter((widget) => widgetTypes[widget.type])
          .map(normalizeWidget);
        this.dateRange = this.dashboard.dateRange || "all";
        this.loading = false;
        if (this.widgets.length) this.loadWidgetData();
      } catch (error) {
        // no default dashboard yet is not an error, show the empty state
        if (!String(error.message).toLowerCase().includes("default dashboard"))
          this.errorMessage = error.message;
        this.dashboard = null;
        this.widgets = [];
        this.loading = false;
      }
    },
    // load every widget on its own so one broken widget does not block the rest
    async loadWidgetData() {
      if (!this.dashboard) return;
      const requestId = ++this.requestId;
      this.dataLoading = true;
      const results = await Promise.allSettled(
        this.widgets.map((widget) =>
          getWidgetData(this.dashboard._id, widget.id, {
            dateRange: this.dateRange,
          }),
        ),
      );
      // ignore old answers when the date range changed again
      if (requestId !== this.requestId) return;
      const data = {};
      const failed = {};
      results.forEach((result, index) => {
        const id = this.widgets[index].id;
        if (result.status === "fulfilled") data[id] = result.value.data.data;
        else failed[id] = true;
      });
      this.widgetData = data;
      this.widgetFailed = failed;
      this.dataLoading = false;
    },
  },
};
</script>

<style>
/* fixed, non scrolling page on desktop. Only matches while the dashboard page is open */
@media (min-width: 992px) {
  .page-content:has(.dsh-page) {
    height: 100vh;
    min-height: 0;
    padding-bottom: 18px;
    overflow: hidden;
  }
}
</style>

<style scoped>
.dsh-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.dsh-heading {
  flex: none;
  margin-bottom: 18px;
}
.dsh-config-button {
  min-height: 36px;
  padding: 0 14px;
  margin-top: 0px;
}
.dsh-config-button:hover {
  background-color: #e5f5ef;
}
.dsh-tabs-row {
  display: flex;
  flex: none;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.dsh-active-tab img {
  filter: invert(68%) sepia(24%) saturate(692%) hue-rotate(103deg)
    brightness(92%) contrast(88%);
}
.dsh-date {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dsh-date img {
  width: 16px;
  height: 16px;
  opacity: 0.55;
}
.dsh-date select {
  height: 30px;
  padding: 0 12px;
  color: #6b7385;
  background: #f3f3f4;
  border: 0;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 10px;
}
.dsh-state {
  margin: 40px 0;
  color: #818392;
  font-size: 13px;
  text-align: center;
}
.dsh-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #d64545;
}
.dsh-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding-bottom: 60px;
  text-align: center;
}
.dsh-empty-icon {
  width: 58px;
  height: 58px;
  margin-bottom: 18px;
}
.dsh-empty h3 {
  margin: 0 0 8px;
  color: #283244;
  font-family: "Quicksand", sans-serif;
  font-size: 14px;
  font-weight: 600;
}
.dsh-empty p {
  margin: 0 0 16px;
  color: #7c8798;
  font-size: 11px;
}
.dsh-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(18, minmax(0, 1fr));
  gap: 8px;
  min-height: 0;
}
/* tablet: two columns, small cards side by side */
@media (max-width: 991px) {
  .dsh-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
    grid-auto-rows: auto;
    gap: 14px;
    padding-bottom: 24px;
  }
  .dsh-widget {
    grid-area: auto !important;
    grid-column: span 2 !important;
    min-height: 300px;
  }
  .dsh-widget.dsh-kpi {
    grid-column: span 1 !important;
    min-height: 84px;
  }
}
/* mobile: one column */
@media (max-width: 600px) {
  .dsh-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .dsh-widget,
  .dsh-widget.dsh-kpi {
    grid-column: auto !important;
  }
  .dsh-heading {
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style>
