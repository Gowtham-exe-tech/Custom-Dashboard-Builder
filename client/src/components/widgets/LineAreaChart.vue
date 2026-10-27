<template>
  <div class="chart-root" @mouseleave="hoverIndex = -1">
    <svg
      v-if="chartWidth && chartHeight"
      :width="chartWidth"
      :height="chartHeight"
      @mousemove="moveTip">
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
          v-show="index % labelStep === 0"
          :key="'l' + index"
          :x="xFor(index)"
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
      <path
        v-if="area && list.length > 1"
        :d="areaPath"
        :fill="color"
        fill-opacity="0.22" />
      <path
        v-if="list.length > 1"
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round" />
      <circle
        v-for="(item, index) in list"
        :key="'c' + index"
        :cx="xFor(index)"
        :cy="yFor(item.value)"
        :r="hoverIndex === index ? 5 : 3.5"
        fill="#fff"
        :stroke="color"
        stroke-width="2" />
      <template v-if="showLabels && !placeholder">
        <text
          v-for="(item, index) in list"
          :key="'v' + index"
          :x="xFor(index)"
          :y="yFor(item.value) - 9"
          text-anchor="middle"
          :font-size="tickSize"
          fill="#3b4252">
          {{ tickText(item.value) }}
        </text>
      </template>
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
import {
  makeTicks,
  wrapLabel,
  charWidth,
  monotonePath,
} from "../../utils/chartHelpers";
import {
  formatShort,
  formatMoney,
  formatNumber,
} from "../../utils/formatHelpers";
import ChartTooltip from "./ChartTooltip.vue";
import AxisText from "./AxisText.vue";

const sampleItems = [2, 4, 3, 5.5, 4.5, 6].map((value, index) => ({
  label: `Item ${index + 1}`,
  value,
}));

export default {
  name: "LineAreaChart",
  components: { ChartTooltip, AxisText },
  mixins: [chartSizeMixin],
  props: {
    items: { type: Array, default: () => [] },
    area: Boolean,
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
    left() {
      return this.placeholder
        ? 14
        : (this.yTitle ? 22 : 6) +
            Math.max(...this.ticks.map((tick) => this.tickText(tick).length)) *
              charWidth(this.tickSize) +
            10;
    },
    right() {
      return 12;
    },
    top() {
      return 14;
    },
    // points sit in the middle of equal slots, so the first and last labels are not cut
    band() {
      return Math.max(
        1,
        (this.chartWidth - this.left - this.right) /
          Math.max(1, this.list.length),
      );
    },
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
    bottom() {
      if (this.placeholder) return 10;
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
    pointList() {
      return this.list.map((item, index) => [
        this.xFor(index),
        this.yFor(item.value),
      ]);
    },
    linePath() {
      return monotonePath(this.pointList);
    },
    areaPath() {
      const last = this.pointList[this.pointList.length - 1];
      return `${this.linePath} L${last[0]} ${this.axisY} L${this.pointList[0][0]} ${this.axisY} Z`;
    },
  },
  methods: {
    xFor(index) {
      return this.left + this.band * (index + 0.5);
    },
    yFor(value) {
      return (
        this.top +
        (this.axisY - this.top) * (1 - (Number(value) || 0) / this.topValue)
      );
    },
    tickText(value, full = false) {
      return full
        ? this.money
          ? formatMoney(value)
          : formatNumber(value, 2).replace(/\.00$/, "")
        : formatShort(value, this.money);
    },
    // show the tooltip for the point nearest to the mouse
    moveTip(event) {
      if (!this.list.length || this.placeholder) return;
      const box = this.$el.getBoundingClientRect();
      const x = event.clientX - box.left;
      this.hoverIndex = Math.max(
        0,
        Math.min(this.list.length - 1, Math.floor((x - this.left) / this.band)),
      );
      this.tipX = Math.min(x + 12, Math.max(0, this.chartWidth - 130));
      this.tipY = Math.max(0, this.yFor(this.list[this.hoverIndex].value) - 36);
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
