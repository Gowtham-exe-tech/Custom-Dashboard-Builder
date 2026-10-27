<template>
  <article
    class="wgt-card"
    :class="[
      `wgt-${widget.type}`,
      { 'wgt-config': mode === 'config', 'wgt-moving': moving },
    ]"
    @pointerdown="onCardDown">
    <header class="wgt-head">
      <h3 class="wgt-title" :title="widget.config.description || ''">
        {{ widget.title }}
      </h3>
      <div v-if="mode === 'config'" class="wgt-actions" @pointerdown.stop>
        <button
          type="button"
          class="wgt-action wgt-delete"
          title="Delete"
          @click="$emit('remove', widget)">
          <img src="../assets/icons/trash-regular.svg" alt="" />
        </button>
        <button
          type="button"
          class="wgt-action wgt-settings"
          title="Settings"
          @click="$emit('edit', widget)">
          <img src="../assets/icons/settings-regular.svg" alt="" />
        </button>
      </div>
    </header>
    <div class="wgt-body">
      <p v-if="loading" class="wgt-note">Loading...</p>
      <p v-else-if="failed" class="wgt-note wgt-error">Unable to load data</p>
      <div v-else-if="widget.type === 'kpi'" class="wgt-kpi">{{ kpiText }}</div>
      <TableWidget
        v-else-if="widget.type === 'table'"
        :columns="tableColumns"
        :rows="tableRows"
        :font-size="Number(config.fontSize) || 14"
        :header-background="config.headerBackground"
        :page-size="config.pageSize" />
      <PieChart
        v-else-if="widget.type === 'pie'"
        :items="results"
        :show-legend="config.showLegend !== false"
        :placeholder="showPlaceholder" />
      <ScatterChart
        v-else-if="widget.type === 'scatter'"
        :points="scatterPoints"
        :color="config.color"
        :show-grid="config.showGrid !== false"
        :font-size="Number(config.fontSize) || 12"
        :x-field="config.xField"
        :y-field="config.yField"
        :x-name="axisName(config.xField)"
        :y-name="axisName(config.yField)"
        :placeholder="showPlaceholder" />
      <BarChart
        v-else-if="widget.type === 'bar'"
        :items="results"
        :color="config.color"
        :show-grid="config.showGrid !== false"
        :show-labels="Boolean(config.showLabels)"
        :font-size="Number(config.fontSize) || 12"
        :money="chartMoney"
        :placeholder="showPlaceholder"
        :x-title="xTitle"
        :y-title="yTitle" />
      <LineAreaChart
        v-else
        :area="widget.type === 'area'"
        :items="results"
        :color="config.color"
        :show-grid="config.showGrid !== false"
        :show-labels="Boolean(config.showLabels)"
        :font-size="Number(config.fontSize) || 12"
        :money="chartMoney"
        :placeholder="showPlaceholder"
        :x-title="xTitle"
        :y-title="yTitle" />
    </div>
    <span
      v-if="mode === 'config'"
      class="wgt-resize"
      title="Drag to resize"
      @pointerdown.stop.prevent="$emit('resize-start', $event, widget)"></span>
  </article>
</template>

<script>
import TableWidget from "./widgets/TableWidget.vue";
import BarChart from "./widgets/BarChart.vue";
import LineAreaChart from "./widgets/LineAreaChart.vue";
import PieChart from "./widgets/PieChart.vue";
import ScatterChart from "./widgets/ScatterChart.vue";
import {
  fieldLabel,
  fieldKind,
  aggregationLabel,
} from "../utils/dashboardConfig";
import { formatKpi } from "../utils/formatHelpers";

// one card for every widget type, used on both pages
export default {
  name: "WidgetCard",
  components: { TableWidget, BarChart, LineAreaChart, PieChart, ScatterChart },
  props: {
    widget: { type: Object, required: true },
    result: { type: Object, default: null },
    mode: { type: String, default: "view" },
    loading: Boolean,
    failed: Boolean,
    moving: Boolean,
  },
  emits: ["edit", "remove", "move-start", "resize-start"],
  computed: {
    config() {
      return this.widget.config || {};
    },
    // sample shapes show only while a widget has no real data yet
    showPlaceholder() {
      return !this.result;
    },
    payload() {
      return this.result && this.result.data ? this.result.data : null;
    },
    results() {
      return this.payload && Array.isArray(this.payload.results)
        ? this.payload.results
        : [];
    },
    scatterPoints() {
      return Array.isArray(this.payload) ? this.payload : [];
    },
    tableColumns() {
      return this.result
        ? (this.payload && this.payload.columns) || this.config.columns || []
        : [];
    },
    tableRows() {
      return this.result ? (this.payload && this.payload.rows) || [] : [];
    },
    xTitle() {
      return fieldLabel(this.config.groupBy);
    },
    yTitle() {
      return this.config.aggregation === "count"
        ? "Number of orders"
        : `${aggregationLabel(this.config.aggregation)} of ${fieldLabel(
            this.config.metric,
          )}`;
    },
    chartMoney() {
      return (
        this.config.aggregation !== "count" &&
        this.isMoney(this.config.metric || "total")
      );
    },
    kpiText() {
      const value = this.payload ? this.payload.value : 0;
      return formatKpi(
        value,
        this.config.format,
        Number(this.config.decimals) || 0,
      );
    },
  },
  methods: {
    isMoney(key) {
      return fieldKind(key) === "currency";
    },
    axisName(key) {
      return key ? fieldLabel(key) : "";
    },
    // dragging the card moves it, buttons and the resize handle are skipped
    onCardDown(event) {
      if (this.mode === "config" && event.button === 0)
        this.$emit("move-start", event, this.widget);
    },
  },
};
</script>

<style scoped>
.wgt-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 12px 16px 14px;
  background: #fff;
  border: 1px solid #e3e5e8;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(16 24 40 / 6%);
  overflow: hidden;
}
.wgt-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-height: 18px;
  margin-bottom: 8px;
}
.wgt-title {
  margin: 0;
  overflow: hidden;
  color: #15171a;
  font-family: "Quicksand", sans-serif;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wgt-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
.wgt-kpi {
  color: #15171a;
  font-family: "Quicksand", sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  word-break: break-all;
}
.wgt-kpi {
  font-size: clamp(16px, 2.2vh, 22px);
}
.wgt-note {
  margin: 0;
  color: #818392;
  font-size: 12px;
}
.wgt-error {
  color: #d64545;
}
.wgt-config {
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.wgt-config.wgt-moving {
  cursor: grabbing;
  opacity: 0.85;
  box-shadow: 0 6px 18px rgb(16 24 40 / 18%);
}
.wgt-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.wgt-config:hover .wgt-actions {
  opacity: 1;
}
.wgt-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}
.wgt-action img {
  width: 13px;
  height: 13px;
}
.wgt-delete img {
  filter: invert(38%) sepia(70%) saturate(2400%) hue-rotate(335deg)
    brightness(95%);
}
.wgt-settings img {
  filter: invert(68%) sepia(24%) saturate(692%) hue-rotate(103deg)
    brightness(92%) contrast(88%);
}
.wgt-action:hover {
  background: #eef7f3;
}
.wgt-delete:hover {
  background: #fdeeee;
}
.wgt-resize {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background: linear-gradient(
    135deg,
    transparent 50%,
    #55bd99 50%,
    #55bd99 58%,
    transparent 58%,
    transparent 70%,
    #55bd99 70%,
    #55bd99 78%,
    transparent 78%
  );
  opacity: 0;
  transition: opacity 0.15s;
}
.wgt-config:hover .wgt-resize {
  opacity: 1;
}
</style>
