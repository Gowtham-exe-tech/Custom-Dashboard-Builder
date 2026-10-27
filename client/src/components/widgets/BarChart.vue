<template>
  <div class="chart-root" @mouseleave="hoverIndex = -1">
    <svg
      v-if="chartWidth && chartHeight"
      :width="chartWidth"
      :height="chartHeight">
      <line
        v-for="tick in ticks"
        :key="tick"
        :x1="left"
        :x2="chartWidth - right"
        :y1="yFor(tick)"
        :y2="yFor(tick)"
        :stroke="showGrid ? '#e6e8eb' : 'transparent'"
        stroke-dasharray="3 3" />
      <line :x1="left" :x2="left" :y1="top" :y2="axisY" stroke="#9aa3b2" />
      <line
        :x1="left"
        :x2="chartWidth - right"
        :y1="axisY"
        :y2="axisY"
        stroke="#9aa3b2" />
      <template v-if="!placeholder">
        <text
          v-for="tick in ticks"
          :key="'t' + tick"
          :x="left - 6"
          :y="yFor(tick) + 3"
          text-anchor="end"
          :font-size="tickSize"
          fill="#6b7385">
          {{ tickText(tick) }}
        </text>
        <AxisText
          v-for="(item, index) in list"
          v-show="labelVisible(index)"
          :key="'l' + index"
          :x="barX(index) + barWidth / 2"
          :y="axisY + tickSize + 5"
          :lines="labelLines[index]"
          :font-size="tickSize" />
        <text
          v-if="xTitle"
          :x="(left + chartWidth - right) / 2"
          :y="chartHeight - 5"
          text-anchor="middle"
          :font-size="fontSize"
          font-weight="600"
          fill="#3b4252">
          {{ xTitle }}
        </text>
        <text
          v-if="yTitle"
          :transform="`translate(12 ${(top + axisY) / 2}) rotate(-90)`"
          text-anchor="middle"
          :font-size="fontSize"
          font-weight="600"
          fill="#3b4252">
          {{ yTitle }}
        </text>
      </template>
      <g
        v-for="(item, index) in list"
        :key="index"
        @mousemove="moveTip($event, index)">
        <rect
          :x="barX(index)"
          :y="yFor(item.value)"
          :width="barWidth"
          :height="Math.max(0, axisY - yFor(item.value))"
          :fill="color"
          :opacity="hoverIndex === -1 || hoverIndex === index ? 1 : 0.7" />
        <text
          v-if="showLabels && !placeholder"
          :x="barX(index) + barWidth / 2"
          :y="yFor(item.value) - 4"
          text-anchor="middle"
          :font-size="tickSize"
          fill="#3b4252">
          {{ tickText(item.value) }}
        </text>
      </g>
    </svg>
    <ChartTooltip
      :show="hoverIndex > -1"
      :x="tipX"
      :y="tipY"
      :label="hoverIndex > -1 ? String(list[hoverIndex].label) : ''"
      :value="hoverIndex > -1 ? tickText(list[hoverIndex].value, true) : ''"
      :color="color" />
  </div>
</template>


<script>
import chartSizeMixin from "../../utils/chartSizeMixin";
import { makeTicks, wrapLabel, charWidth } from "../../utils/chartHelpers";
import {
  formatShort,
  formatMoney,
  formatNumber,
} from "../../utils/formatHelpers";
import ChartTooltip from "./ChartTooltip.vue";
import AxisText from "./AxisText.vue";

const sampleItems = [4, 3, 5, 4.5, 6, 5.5].map((value, index) => ({
  label: `Item ${index + 1}`,
  value,
}));

export default {
  name: "BarChart",
  components: { ChartTooltip, AxisText },
  mixins: [chartSizeMixin],
  props: {
    items: { type: Array, default: () => [] },
    color: { type: String, default: "#55bd99" },
    showGrid: { type: Boolean, default: true },
    showLabels: { type: Boolean, default: false },
    fontSize: { type: Number, default: 12 },
    money: Boolean,
    placeholder: Boolean,
    xTitle: { type: String, default: "" },
    yTitle: { type: String, default: "" },
  },
  data() {
    return { hoverIndex: -1, tipX: 0, tipY: 0 };
  },
  computed: {
    list() {
      return this.placeholder ? sampleItems : this.items;
    },
    tickSize() {
      return this.fontSize - 1;
    },
    lineHeight() {
      return this.tickSize * 1.25;
    },
    maxValue() {
      return Math.max(0, ...this.list.map((item) => Number(item.value) || 0));
    },
    ticks() {
      return makeTicks(this.maxValue);
    },
    topValue() {
      return this.ticks[this.ticks.length - 1];
    },
    // room on the left for the y title and the tick numbers
    left() {
      return this.placeholder
        ? 10
        : (this.yTitle ? 22 : 6) +
            Math.max(...this.ticks.map((tick) => this.tickText(tick).length)) *
              charWidth(this.tickSize) +
            10;
    },
    right() {
      return 12;
    },
    top() {
      return 12;
    },
    band() {
      return Math.max(
        1,
        (this.chartWidth - this.left - this.right) /
          Math.max(1, this.list.length),
      );
    },
    // when bars are very thin, show every few labels so the text stays readable
    labelStep() {
      return this.band < this.tickSize * 2.4
        ? Math.ceil((this.tickSize * 5) / this.band)
        : 1;
    },
    labelLines() {
      return this.list.map((item) =>
        wrapLabel(item.label, this.band * this.labelStep - 6, this.tickSize),
      );
    },
    // bottom space grows with the number of wrapped lines
    bottom() {
      if (this.placeholder) return 8;
      const lines = Math.max(
        1,
        ...this.labelLines
          .filter((_, index) => index % this.labelStep === 0)
          .map((item) => item.length),
      );
      return Math.min(
        this.chartHeight * 0.5,
        lines * this.lineHeight + 12 + (this.xTitle ? this.fontSize + 10 : 0),
      );
    },
    axisY() {
      return this.chartHeight - this.bottom;
    },
    barWidth() {
      return Math.max(2, Math.min(this.band * 0.7, 90));
    },
  },
  methods: {
    yFor(value) {
      return (
        this.top +
        (this.axisY - this.top) * (1 - (Number(value) || 0) / this.topValue)
      );
    },
    barX(index) {
      return this.left + this.band * index + (this.band - this.barWidth) / 2;
    },
    tickText(value, full = false) {
      return full
        ? this.money
          ? formatMoney(value)
          : formatNumber(value, 2).replace(/\.00$/, "")
        : formatShort(value, this.money);
    },
    labelVisible(index) {
      return index % this.labelStep === 0;
    },
    moveTip(event, index) {
      const box = this.$el.getBoundingClientRect();
      this.hoverIndex = index;
      this.tipX = Math.min(
        event.clientX - box.left + 12,
        Math.max(0, this.chartWidth - 130),
      );
      this.tipY = Math.max(0, event.clientY - box.top - 34);
    },
  },
};
</script>


<style scoped>
.chart-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
svg {
  display: block;
  font-family: "Open Sans", sans-serif;
}
</style>
