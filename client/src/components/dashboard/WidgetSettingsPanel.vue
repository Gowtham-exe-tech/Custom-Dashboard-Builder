<template>
  <Transition name="sp">
    <div v-if="open" class="sp-overlay">

      <aside class="sp-panel" role="dialog" aria-label="Widget configuration">
        <button
          type="button"
          class="sp-close"
          aria-label="Close"
          @click="$emit('close')">
          <img src="../../assets/icons/close-regular.svg" alt="" />
        </button>
        <h3 class="sp-heading">Widget configuration</h3>

        <div v-if="draft" class="sp-scroll" @click="menu = ''">
          <div v-if="hasTabs" class="sp-tabs">
            <button
              type="button"
              :class="{ active: tab === 'data' }"
              @click="tab = 'data'">
              Data</button
            ><button
              type="button"
              :class="{ active: tab === 'styling' }"
              @click="tab = 'styling'">
              Styling
            </button>
          </div>
          <div v-show="tab === 'data'">
            <div class="sp-field" :class="{ invalid: errors.title }">
              <label>Widget title <b>*</b></label
              ><input
                v-model="draft.title"
                maxlength="100"
                placeholder="Untitled" /><small v-if="errors.title">{{
                errors.title
              }}</small>
            </div>
            <div class="sp-field sp-area">
              <textarea
                v-model="draft.config.description"
                rows="4"
                maxlength="300"
                placeholder="Description"></textarea>
            </div>
            <h4 class="sp-sub">Widget size</h4>
            <div class="sp-field" :class="{ invalid: errors.w }">
              <label>Width (Columns) <b>*</b></label
              ><input
                v-model.number="draft.w"
                type="number"
                min="1"
                max="12" /><small v-if="errors.w">{{ errors.w }}</small>
            </div>
            <div class="sp-field" :class="{ invalid: errors.h }">
              <label>Height (Rows) <b>*</b></label
              ><input
                v-model.number="draft.h"
                type="number"
                min="1"
                max="18" /><small v-if="errors.h">{{ errors.h }}</small>
            </div>
            <h4 class="sp-sub">Data setting</h4>
            <template v-if="draft.type === 'kpi'">
              <div class="sp-field" :class="{ invalid: errors.metric }">
                <label v-if="draft.config.metric">Select metric <b>*</b></label
                ><select v-model="draft.config.metric">
                  <option value="" disabled>Select metric *</option>
                  <option
                    v-for="item in kpiMetricOptions"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option></select
                ><small v-if="errors.metric">{{ errors.metric }}</small>
              </div>
              <div class="sp-field" :class="{ invalid: errors.aggregation }">
                <label v-if="draft.config.aggregation"
                  >Aggregation <b>*</b></label
                ><select v-model="draft.config.aggregation">
                  <option value="" disabled>Aggregation *</option>
                  <option
                    v-for="item in aggregations"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option></select
                ><small v-if="errors.aggregation">{{
                  errors.aggregation
                }}</small>
              </div>
              <div class="sp-field">
                <label>Data format <b>*</b></label
                ><select v-model="draft.config.format">
                  <option
                    v-for="item in dataFormatOptions"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
              <div class="sp-field" :class="{ invalid: errors.decimals }">
                <label>Decimal Precision <b>*</b></label
                ><input
                  v-model.number="draft.config.decimals"
                  type="number"
                  min="0"
                  max="5" /><small v-if="errors.decimals">{{
                  errors.decimals
                }}</small>
              </div>
            </template>
            <template v-else-if="draft.type === 'table'">
              <div
                class="sp-field sp-multi"
                :class="{ invalid: errors.columns }"
                @click.stop>
                <label v-if="draft.config.columns.length"
                  >Choose columns <b>*</b></label
                >
                <div
                  class="sp-multi-box"
                  @click="menu = menu === 'columns' ? '' : 'columns'">
                  <span
                    v-if="!draft.config.columns.length"
                    class="sp-placeholder"
                    >Choose columns *</span
                  >
                  <span
                    v-for="key in draft.config.columns"
                    :key="key"
                    class="sp-chip"
                    >{{ labelFor(key)
                    }}<button
                      type="button"
                      aria-label="Remove"
                      @click.stop="toggleColumn(key)">
                      ×
                    </button></span
                  >
                </div>
                <ul v-if="menu === 'columns'" class="sp-menu">
                  <li
                    v-for="item in tableColumnOptions"
                    :key="item.value"
                    @click="toggleColumn(item.value)">
                    <input
                      type="checkbox"
                      :checked="draft.config.columns.includes(item.value)"
                      tabindex="-1" /><span>{{ item.label }}</span>
                  </li>
                </ul>
                <small v-if="errors.columns">{{ errors.columns }}</small>
              </div>
              <div class="sp-field">
                <label v-if="draft.config.sortOrder">Sort by</label
                ><select v-model="draft.config.sortOrder">
                  <option value="">Sort by</option>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              <div class="sp-field">
                <label v-if="draft.config.pageSize">Pagination</label
                ><select v-model="draft.config.pageSize">
                  <option value="">Pagination</option>
                  <option
                    v-for="size in paginationOptions"
                    :key="size"
                    :value="size">
                    {{ size }}
                  </option>
                </select>
              </div>
              <label class="sp-check"
                ><input
                  v-model="draft.config.applyFilter"
                  type="checkbox"
                  @change="onFilterToggle" />Apply filter</label
              >
              <div v-if="draft.config.applyFilter" class="sp-filters">
                <div
                  v-for="(row, index) in draft.config.filters"
                  :key="index"
                  class="sp-filter-row">
                  <button
                    v-if="draft.config.filters.length > 1"
                    type="button"
                    class="sp-filter-remove"
                    aria-label="Remove filter"
                    @click="draft.config.filters.splice(index, 1)">
                    ×
                  </button>
                  <div class="sp-filter-pair">
                    <select v-model="row.field">
                      <option value="" disabled>Choose attribute</option>
                      <option
                        v-for="item in filterFieldOptions"
                        :key="item.value"
                        :value="item.value">
                        {{ item.label }}
                      </option>
                    </select>
                    <select v-model="row.operator">
                      <option value="" disabled>Operator</option>
                      <option
                        v-for="item in operatorOptions"
                        :key="item.value"
                        :value="item.value">
                        {{ item.label }}
                      </option>
                    </select>
                  </div>
                  <input
                    v-model="row.value"
                    class="sp-filter-value"
                    placeholder="Value" />
                </div>
                <small v-if="errors.filters" class="sp-error-text">{{
                  errors.filters
                }}</small>
                <button
                  type="button"
                  class="sp-add-filter"
                  @click="addFilterRow">
                  + Add filter
                </button>
              </div>
            </template>
            <template v-else-if="draft.type === 'pie'">
              <div class="sp-field" :class="{ invalid: errors.chartData }">
                <label v-if="draft.config.chartData"
                  >Choose chart data <b>*</b></label
                ><select v-model="draft.config.chartData">
                  <option value="" disabled>Choose chart data *</option>
                  <option
                    v-for="item in pieDataOptions"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option></select
                ><small v-if="errors.chartData">{{ errors.chartData }}</small>
              </div>
              <label class="sp-check"
                ><input v-model="draft.config.showLegend" type="checkbox" />Show
                legend</label
              >
            </template>
            <template v-else-if="draft.type === 'scatter'">
              <div class="sp-field" :class="{ invalid: errors.xField }">
                <label v-if="draft.config.xField">X axis <b>*</b></label
                ><select v-model="draft.config.xField">
                  <option value="" disabled>X axis *</option>
                  <option
                    v-for="item in scatterFieldOptions"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option></select
                ><small v-if="errors.xField">{{ errors.xField }}</small>
              </div>
              <div class="sp-field" :class="{ invalid: errors.yField }">
                <label v-if="draft.config.yField">Y axis <b>*</b></label
                ><select v-model="draft.config.yField">
                  <option value="" disabled>Y axis *</option>
                  <option
                    v-for="item in scatterFieldOptions"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option></select
                ><small v-if="errors.yField">{{ errors.yField }}</small>
              </div>
            </template>
            <template v-else>
              <div class="sp-field" :class="{ invalid: errors.groupBy }">
                <label v-if="draft.config.groupBy"
                  >X axis (group by) <b>*</b></label
                ><select v-model="draft.config.groupBy">
                  <option value="" disabled>X axis (group by) *</option>
                  <option
                    v-for="item in groupByOptions"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option></select
                ><small v-if="errors.groupBy">{{ errors.groupBy }}</small>
              </div>
              <div v-if="draft.config.groupBy === 'orderDate'" class="sp-field">
                <label>Group dates by</label
                ><select v-model="draft.config.dateGrouping">
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                </select>
              </div>
              <div class="sp-field" :class="{ invalid: errors.metric }">
                <label v-if="draft.config.metric"
                  >Y axis (metric) <b>*</b></label
                ><select v-model="draft.config.metric">
                  <option value="" disabled>Y axis (metric) *</option>
                  <option
                    v-for="item in numberFieldOptions"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option></select
                ><small v-if="errors.metric">{{ errors.metric }}</small>
              </div>
              <div class="sp-field" :class="{ invalid: errors.aggregation }">
                <label v-if="draft.config.aggregation"
                  >Aggregation <b>*</b></label
                ><select v-model="draft.config.aggregation">
                  <option value="" disabled>Aggregation *</option>
                  <option
                    v-for="item in aggregationOptions"
                    :key="item.value"
                    :value="item.value">
                    {{ item.label }}
                  </option></select
                ><small v-if="errors.aggregation">{{
                  errors.aggregation
                }}</small>
              </div>
            </template>
          </div>
          <div v-if="hasTabs" v-show="tab === 'styling'">
            <div
              class="sp-field sp-suffix"
              :class="{ invalid: errors.fontSize }">
              <label>Font size <b>*</b></label
              ><input
                v-model.number="draft.config.fontSize"
                type="number"
                min="12"
                max="20" /><span class="sp-unit">px</span
              ><small v-if="errors.fontSize">{{ errors.fontSize }}</small>
            </div>
            <h4 v-if="draft.type === 'table'" class="sp-sub">
              Header background
            </h4>
            <h4 v-else class="sp-sub">Chart color</h4>
            <div class="sp-color" :class="{ invalid: errors.color }">
              <input
                type="color"
                :value="colorValue"
                @input="setColor($event.target.value)" />
              <div class="sp-hex">
                <span>#</span
                ><input
                  :value="colorValue.replace('#', '').toUpperCase()"
                  maxlength="6"
                  @input="setColor('#' + $event.target.value)" />
              </div>
            </div>
            <small v-if="errors.color" class="sp-error-text">{{
              errors.color
            }}</small>
            <template v-if="draft.type !== 'table'">
              <label class="sp-check"
                ><input v-model="draft.config.showGrid" type="checkbox" />Show
                grid lines</label
              >
              <label
                v-if="['bar', 'line', 'area'].includes(draft.type)"
                class="sp-check"
                ><input v-model="draft.config.showLabels" type="checkbox" />Show
                data labels</label
              >
            </template>
          </div>
        </div>
        <div class="sp-foot">
          <button
            type="button"
            class="sp-btn sp-outline"
            @click="$emit('close')">
            Cancel</button
          ><button type="button" class="sp-btn sp-primary" @click="save">
            Save
          </button>
        </div>
      </aside>
    </div>
  </Transition>
</template>


<script>

import {
  kpiMetricOptions,
  tableColumnOptions,
  pieDataOptions,
  groupByOptions,
  numberFieldOptions,
  scatterFieldOptions,
  filterFieldOptions,
  operatorOptions,
  aggregationOptions,
  dataFormatOptions,
  paginationOptions,
  aggregationsFor,
  fieldLabel,
  gridColumns,
  gridRows,
} from "../../utils/dashboardConfig";
import { isFree } from "../../utils/gridHelpers";

const hexPattern = /^#[0-9a-fA-F]{6}$/;
const copy = (value) => JSON.parse(JSON.stringify(value));

export default {
  name: "WidgetSettingsPanel",
  props: {
    open: Boolean,
    widget: { type: Object, default: null },
    otherWidgets: { type: Array, default: () => [] },
  },
  emits: ["close", "save"],
  data() {
    return {
      draft: null,
      tab: "data",
      menu: "",
      errors: {},
      kpiMetricOptions,
      tableColumnOptions,
      pieDataOptions,
      groupByOptions,
      numberFieldOptions,
      scatterFieldOptions,
      filterFieldOptions,
      operatorOptions,
      aggregationOptions,
      dataFormatOptions,
      paginationOptions,
    };
  },
  computed: {
    hasTabs() {
      return this.draft && !["kpi", "pie"].includes(this.draft.type);
    },
    aggregations() {
      return aggregationsFor(this.draft.config.metric);
    },
    colorValue() {
      const color =
        this.draft.type === "table"
          ? this.draft.config.headerBackground
          : this.draft.config.color;
      return hexPattern.test(color) ? color : "#d8d8d8";
    },
  },
  watch: {
    // start every time with a fresh copy so Cancel throws changes away
    open(value) {
      if (value && this.widget) {
        this.draft = copy(this.widget);
        this.tab = "data";
        this.menu = "";
        this.errors = {};
      }
    },
    // count is the only option for text fields
    "draft.config.metric"() {
      if (
        this.draft &&
        this.draft.type === "kpi" &&
        !this.aggregations.some(
          (item) => item.value === this.draft.config.aggregation,
        )
      )
        this.draft.config.aggregation = "";
    },
  },
  methods: {
    labelFor: fieldLabel,
    toggleColumn(key) {
      const list = this.draft.config.columns;
      const index = list.indexOf(key);
      if (index > -1) list.splice(index, 1);
      else list.push(key);
    },
    addFilterRow() {
      this.draft.config.filters.push({ field: "", operator: "", value: "" });
    },
    onFilterToggle() {
      if (this.draft.config.applyFilter && !this.draft.config.filters.length)
        this.addFilterRow();
    },
    setColor(value) {
      if (this.draft.type === "table")
        this.draft.config.headerBackground = value;
      else this.draft.config.color = value;
    },
    validate() {
      const draft = this.draft;
      const config = draft.config;
      const errors = {};
      if (!String(draft.title || "").trim())
        errors.title = "Widget title is required";
      if (!Number.isInteger(draft.w) || draft.w < 1 || draft.w > gridColumns)
        errors.w = `Width must be between 1 and ${gridColumns}`;
      if (!Number.isInteger(draft.h) || draft.h < 1 || draft.h > gridRows)
        errors.h = `Height must be between 1 and ${gridRows}`;
      // size has to fit inside the grid without touching other widgets
      if (
        !errors.w &&
        !errors.h &&
        !isFree(this.otherWidgets, {
          x: draft.x,
          y: draft.y,
          w: draft.w,
          h: draft.h,
        })
      )
        errors.w =
          "This size does not fit here. Another widget or the grid edge is in the way";
      if (draft.type === "kpi") {
        if (!config.metric) errors.metric = "Select a metric";
        if (!config.aggregation) errors.aggregation = "Select an aggregation";
        if (
          !Number.isInteger(config.decimals) ||
          config.decimals < 0 ||
          config.decimals > 5
        )
          errors.decimals = "Decimal precision must be between 0 and 5";
      }
      if (draft.type === "table") {
        if (!config.columns.length)
          errors.columns = "Choose at least one column";
        if (
          config.applyFilter &&
          config.filters.some(
            (row) =>
              (row.field || row.operator || row.value !== "") &&
              !(row.field && row.operator && String(row.value).trim() !== ""),
          )
        )
          errors.filters = "Complete or remove the empty filters";
      }
      if (draft.type === "pie" && !config.chartData)
        errors.chartData = "Choose chart data";
      if (draft.type === "scatter") {
        if (!config.xField) errors.xField = "Select the X axis";
        if (!config.yField) errors.yField = "Select the Y axis";
      }
      if (["bar", "line", "area"].includes(draft.type)) {
        if (!config.groupBy) errors.groupBy = "Select the X axis";
        if (!config.metric) errors.metric = "Select the Y axis";
        if (!config.aggregation) errors.aggregation = "Select an aggregation";
      }
      if (this.hasTabs) {
        if (
          !Number.isInteger(config.fontSize) ||
          config.fontSize < 12 ||
          config.fontSize > 20
        )
          errors.fontSize = "Font size must be between 12 and 20";
        if (
          !hexPattern.test(
            draft.type === "table" ? config.headerBackground : config.color,
          )
        )
          errors.color = "Enter a valid 6 digit hex color";
      }
      this.errors = errors;
      if (errors.fontSize || errors.color) this.tab = "styling";
      if (
        Object.keys(errors).some((key) => !["fontSize", "color"].includes(key))
      )
        this.tab = "data";
      return Object.keys(errors).length === 0;
    },
    save() {
      if (!this.validate()) return;
      const result = copy(this.draft);
      result.title = result.title.trim();
      if (result.type === "table") {
        result.config.filters = result.config.applyFilter
          ? result.config.filters.filter(
              (row) =>
                row.field && row.operator && String(row.value).trim() !== "",
            )
          : [];
        result.config.pageSize = result.config.pageSize
          ? Number(result.config.pageSize)
          : "";
      }
      this.$emit("save", result);
    },
  },
};
</script>


<style scoped>
.sp-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  background: rgb(20 22 24 / 45%);
  transition: opacity 0.3s ease;
}
.sp-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(480px, 100vw);
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 20px rgb(16 24 40 / 15%);
  transition: transform 0.3s ease;
}
.sp-enter-from,
.sp-leave-to {
  opacity: 0;
}
.sp-enter-from .sp-panel,
.sp-leave-to .sp-panel {
  transform: translateX(100%);
}
.sp-close {
  position: absolute;
  top: 0;
  left: -28px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: #fff;
  border: 0;
  border-radius: 4px 0 0 4px;
}
.sp-close img {
  width: 12px;
  height: 12px;
  opacity: 0.6;
}
.sp-heading {
  margin: 0;
  padding: 16px 22px;
  color: #15171a;
  border-bottom: 1px solid #eceef0;
  font-family: "Quicksand", sans-serif;
  font-size: 15px;
  font-weight: 700;
}
.sp-scroll {
  flex: 1;
  min-height: 0;
  padding: 14px 22px 20px;
  overflow-y: auto;
}
.sp-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #55bd99;
  border-radius: 4px;
}
.sp-tabs button {
  height: 32px;
  color: #202124;
  background: #fff;
  border: 0;
  font-size: 12px;
}
.sp-tabs button.active {
  color: #fff;
  background: #55bd99;
}
.sp-sub {
  margin: 18px 0 12px;
  color: #15171a;
  font-family: "Quicksand", sans-serif;
  font-size: 13px;
  font-weight: 700;
}
.sp-field {
  position: relative;
  margin-bottom: 14px;
}
.sp-field > label {
  position: absolute;
  top: -7px;
  left: 10px;
  z-index: 1;
  padding: 0 4px;
  color: #818392;
  background: #fff;
  font-size: 10px;
  line-height: 1.2;
  pointer-events: none;
}
.sp-field > label b {
  color: #e5484d;
  font-weight: 400;
}
.sp-field input:not([type="checkbox"]),
.sp-field select,
.sp-field textarea,
.sp-filter-pair select,
.sp-filter-value {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  color: #202124;
  background: #fff;
  border: 1px solid #d6d9de;
  border-radius: 4px;
  font-size: 12px;
  outline: 0;
}
.sp-field select,
.sp-filter-pair select {
  appearance: none;
  padding-right: 28px;
  background-image: url("../../assets/icons/angle-down-regular.svg");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
}
.sp-field select:invalid,
.sp-field select:has(option[disabled]:checked) {
  color: #9aa3b2;
}
.sp-field textarea {
  height: auto;
  padding: 10px 12px;
  resize: vertical;
}
.sp-field input:focus,
.sp-field select:focus,
.sp-field textarea:focus,
.sp-filter-pair select:focus,
.sp-filter-value:focus {
  border-color: #55bd99;
}
.sp-field.invalid input,
.sp-field.invalid select,
.sp-field.invalid .sp-multi-box {
  border-color: #e5484d;
}
.sp-field small,
.sp-error-text {
  display: block;
  margin-top: 4px;
  color: #e5484d;
  font-size: 11px;
}
.sp-suffix input {
  padding-right: 52px;
}
.sp-unit {
  position: absolute;
  top: 1px;
  right: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 34px;
  color: #4b5260;
  background: #d9d9d9;
  border-radius: 0 4px 4px 0;
  font-size: 12px;
}
.sp-multi-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 4px 28px 4px 10px;
  border: 1px solid #d6d9de;
  border-radius: 4px;
  background: #fff url("../../assets/icons/angle-down-regular.svg") no-repeat
    right 10px center / 12px;
  cursor: pointer;
}
.sp-placeholder {
  color: #9aa3b2;
  font-size: 12px;
}
.sp-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  color: #20463a;
  background: #bfe8d9;
  border-radius: 3px;
  font-size: 11px;
}
.sp-chip button {
  padding: 0;
  color: #20463a;
  background: transparent;
  border: 0;
  font-size: 13px;
  line-height: 1;
}
.sp-menu {
  position: absolute;
  top: 40px;
  right: 0;
  left: 0;
  z-index: 5;
  max-height: 220px;
  margin: 0;
  padding: 4px 0;
  overflow-y: auto;
  list-style: none;
  background: #fff;
  border: 1px solid #d6d9de;
  border-radius: 4px;
  box-shadow: 0 6px 16px rgb(16 24 40 / 12%);
}
.sp-menu li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
}
.sp-menu li:hover {
  background: #f3f8f6;
}
.sp-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 14px;
  color: #202124;
  font-size: 12px;
  cursor: pointer;
}
.sp-check input,
.sp-menu input {
  accent-color: #55bd99;
}
.sp-filters {
  padding: 12px;
  background: #f6f6f7;
  border-radius: 4px;
}
.sp-filter-row {
  position: relative;
  margin-bottom: 10px;
}
.sp-filter-pair {
  display: grid;
  grid-template-columns: 1fr 110px;
  gap: 8px;
  margin-bottom: 8px;
}
.sp-filter-remove {
  position: absolute;
  top: -8px;
  right: -6px;
  z-index: 2;
  width: 18px;
  height: 18px;
  padding: 0;
  color: #e5484d;
  background: #fff;
  border: 1px solid #f3c4c6;
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
}
.sp-add-filter {
  display: block;
  margin: 6px 0 0 auto;
  padding: 0;
  color: #55bd99;
  background: transparent;
  border: 0;
  font-size: 12px;
}
.sp-color {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sp-color input[type="color"] {
  width: 40px;
  height: 36px;
  padding: 2px;
  background: #fff;
  border: 1px solid #d6d9de;
  border-radius: 4px;
  cursor: pointer;
}
.sp-hex {
  display: flex;
  flex: 1;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d6d9de;
  border-radius: 4px;
  font-size: 12px;
}
.sp-hex span {
  margin-right: 6px;
  color: #6b7385;
}
.sp-hex input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  font-size: 12px;
}
.sp-color.invalid .sp-hex {
  border-color: #e5484d;
}
.sp-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid #eceef0;
}
.sp-btn {
  min-width: 68px;
  height: 34px;
  padding: 0 16px;
  border: 1px solid #55bd99;
  border-radius: 4px;
  font-size: 12px;
}
.sp-outline {
  color: #55bd99;
  background: #fff;
}
.sp-primary {
  color: #fff;
  background: #55bd99;
}
</style>
