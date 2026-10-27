<template>
  <div class="chart-root" @mouseleave="hoverIndex = -1">
    <svg
      v-if="chartWidth && chartHeight"
      :width="chartWidth"
      :height="chartHeight">
      <template v-if="!placeholder">
        <line
          v-for="(tick, index) in yTickList"
          :key="'g' + index"
          :x1="left"
          :x2="chartWidth - right"
          :y1="tick.pos"
          :y2="tick.pos"
          :stroke="showGrid ? '#e6e8eb' : 'transparent'"
          stroke-dasharray="3 3" />
      </template>
      <line :x1="left" :x2="left" :y1="top" :y2="axisY" stroke="#9aa3b2" />
      <line
        :x1="left"
        :x2="chartWidth - right"
        :y1="axisY"
        :y2="axisY"
        stroke="#9aa3b2" />
      <template v-if="!placeholder">
        <AxisText
          v-for="(tick, index) in yTickList"
          v-show="index % yStep === 0"
          :key="'yt' + index"
          :x="left - 6"
          :y="tick.pos"
          :lines="tick.lines"
          :font-size="tickSize"
          anchor="end"
          centered />
        <AxisText
          v-for="(tick, index) in xTickList"
          v-show="index % xStep === 0"
          :key="'xt' + index"
          :x="tick.pos"
          :y="axisY + tickSize + 5"
          :lines="tick.lines"
          :font-size="tickSize" />
        <text
          v-if="xName"
          :x="(left + chartWidth - right) / 2"
          :y="chartHeight - 5"
          text-anchor="middle"
          :font-size="fontSize"
          font-weight="600"
          fill="#3b4252">
          {{ xName }}
        </text>
        <text
          v-if="yName"
          :transform="`translate(12 ${(top + axisY) / 2}) rotate(-90)`"
          text-anchor="middle"
          :font-size="fontSize"
          font-weight="600"
          fill="#3b4252">
          {{ yName }}
        </text>
      </template>
      <circle
        v-for="(point, index) in list"
        :key="index"
        :cx="xFor(point.x)"
        :cy="yFor(point.y)"
        :r="hoverIndex === index ? 6 : 4.5"
        :fill="color"
        fill-opacity="0.75"
        :stroke="color"
        @mousemove="moveTip($event, index)" />
    </svg>
    <ChartTooltip
      :show="hoverIndex > -1"
      :x="tipX"
      :y="tipY"
      :label="hoverIndex > -1 ? tipLabel : ''"
      :value="hoverIndex > -1 ? tipValue : ''"
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
import { isNumberField, fieldKind } from "../../utils/dashboardConfig";
import ChartTooltip from "./ChartTooltip.vue";
import AxisText from "./AxisText.vue";

const samplePoints = [
  [1, 2],
  [2, 4.5],
  [3, 3],
  [4, 5.5],
  [5, 4],
  [6, 6.5],
  [2.5, 1.5],
].map(([x, y]) => ({ x, y }));
export default {
  name: "ScatterChart",
  components: { ChartTooltip, AxisText },
  mixins: [chartSizeMixin],
  props: {
    points: { type: Array, default: () => [] },
    xField: { type: String, default: "" },
    yField: { type: String, default: "" },
    color: { type: String, default: "#55bd99" },
    showGrid: { type: Boolean, default: true },
    fontSize: { type: Number, default: 12 },
    xName: { type: String, default: "" },
    yName: { type: String, default: "" },
    placeholder: Boolean,
  },
  data() {
    return { hoverIndex: -1, tipX: 0, tipY: 0 };
  },
  computed: {
    list() {
      return this.placeholder ? samplePoints : this.points;
    },
    tickSize() {
      return this.fontSize - 1;
    },
    lineHeight() {
      return this.tickSize * 1.25;
    },
    // number fields use a number scale, everything else is a list of categories
    xNumeric() {
      return this.placeholder || isNumberField(this.xField);
    },
    yNumeric() {
      return this.placeholder || isNumberField(this.yField);
    },
    xScale() {
      return this.buildScale(
        this.list.map((point) => point.x),
        this.xNumeric,
      );
    },
    yScale() {
      return this.buildScale(
        this.list.map((point) => point.y),
        this.yNumeric,
      );
    },
    yLabelWidth() {
      if (this.placeholder) return 0;
      const longest = Math.max(
        1,
        ...this.yScale.labels.map((label) => String(label).length),
      );
      return Math.min(
        longest * charWidth(this.tickSize),
        Math.max(60, this.chartWidth * 0.25),
      );
    },
    left() {
      return this.placeholder
        ? 12
        : (this.yName ? 22 : 6) + this.yLabelWidth + 10;
    },
    right() {
      return 14;
    },
    top() {
      return 14;
    },
    plotWidth() {
      return Math.max(1, this.chartWidth - this.left - this.right);
    },
    xBand() {
      return this.xNumeric
        ? this.plotWidth
        : this.plotWidth / Math.max(1, this.xScale.labels.length);
    },
    xStep() {
      return !this.xNumeric && this.xBand < this.tickSize * 2.4
        ? Math.ceil((this.tickSize * 5) / this.xBand)
        : 1;
    },
    xTickList() {
      return this.xScale.labels.map((label, index) => ({
        lines: wrapLabel(
          this.xNumeric ? this.short(label, this.xField) : label,
          this.xNumeric ? 70 : this.xBand * this.xStep - 6,
          this.tickSize,
        ),
        pos: this.xNumeric
          ? this.xFor(label)
          : this.left + this.xBand * (index + 0.5),
      }));
    },
    bottom() {
      if (this.placeholder) return 10;
      const lines = Math.max(
        1,
        ...this.xTickList
          .filter((_, index) => index % this.xStep === 0)
          .map((tick) => tick.lines.length),
      );
      return Math.min(
        this.chartHeight * 0.5,
        lines * this.lineHeight + 12 + (this.xName ? this.fontSize + 10 : 0),
      );
    },
    axisY() {
      return this.chartHeight - this.bottom;
    },
    yBand() {
      return this.yNumeric
        ? 1
        : (this.axisY - this.top) / Math.max(1, this.yScale.labels.length);
    },
    yStep() {
      return !this.yNumeric && this.yBand < this.lineHeight
        ? Math.ceil(this.lineHeight / this.yBand)
        : 1;
    },
    yTickList() {
      return this.yScale.labels.map((label) => ({
        lines: wrapLabel(
          this.yNumeric ? this.short(label, this.yField) : label,
          this.yLabelWidth,
          this.tickSize,
        ),
        pos: this.yFor(label),
      }));
    },
    tipLabel() {
      const point = this.list[this.hoverIndex];
      return point.orderNumber || "Order";
    },
    tipValue() {
      const point = this.list[this.hoverIndex];
      return `${this.xName || "X"}: ${this.full(point.x, this.xField)}, ${
        this.yName || "Y"
      }: ${this.full(point.y, this.yField)}`;
    },
  },
  methods: {
    // numbers get nice ticks, other values become sorted categories
    buildScale(values, numeric) {
      if (numeric) {
        const ticks = makeTicks(
          Math.max(0, ...values.map((value) => Number(value) || 0)),
        );
        return { labels: ticks, top: ticks[ticks.length - 1] };
      }
      const labels = [...new Set(values.map((value) => String(value)))].sort(
        (a, b) => a.localeCompare(b, undefined, { numeric: true }),
      );
      return { labels, top: 1 };
    },
    xFor(value) {
      return this.xNumeric
        ? this.left + this.plotWidth * ((Number(value) || 0) / this.xScale.top)
        : this.left +
            this.xBand * (this.xScale.labels.indexOf(String(value)) + 0.5);
    },
    // first category sits at the bottom, like numbers
    yFor(value) {
      return this.yNumeric
        ? this.top +
            (this.axisY - this.top) *
              (1 - (Number(value) || 0) / this.yScale.top)
        : this.axisY -
            this.yBand * (this.yScale.labels.indexOf(String(value)) + 0.5);
    },
    short(value, field) {
      return formatShort(value, fieldKind(field) === "currency");
    },
    full(value, field) {
      if (!isNumberField(field)) return value;
      return fieldKind(field) === "currency"
        ? formatMoney(value)
        : formatNumber(value, 2).replace(/\.00$/, "");
    },
    moveTip(event, index) {
      if (this.placeholder) return;
      const box = this.$el.getBoundingClientRect();
      this.hoverIndex = index;
      this.tipX = Math.min(
        event.clientX - box.left + 12,
        Math.max(0, this.chartWidth - 220),
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
