<template>
  <div class="pie-root" @mouseleave="hoverIndex = -1">
    <div class="pie-area">
      <svg viewBox="0 0 100 100" class="pie-svg">
        <circle
          v-if="slices.length === 1"
          cx="50"
          cy="50"
          r="48"
          :fill="colorFor(0)"
          @mousemove="moveTip($event, 0)" />
        <path
          v-for="(slice, index) in slices.length > 1 ? slices : []"
          :key="index"
          :d="slice.path"
          :fill="colorFor(index)"
          stroke="#fff"
          stroke-width="0.6"
          :opacity="hoverIndex === -1 || hoverIndex === index ? 1 : 0.8"
          @mousemove="moveTip($event, index)" />
      </svg>
    </div>
    <ul v-if="showLegend" class="pie-legend">
      <li v-for="(item, index) in list" :key="index">
        <i :style="{ background: colorFor(index) }"></i
        ><span>{{ item.label }}</span>
      </li>
    </ul>
    <ChartTooltip
      :show="hoverIndex > -1"
      :x="tipX"
      :y="tipY"
      :label="hoverIndex > -1 ? String(list[hoverIndex].label) : ''"
      :value="hoverIndex > -1 ? percentText(hoverIndex) : ''" />
  </div>
</template>


<script>
import { pieColors } from "../../utils/dashboardConfig";
import ChartTooltip from "./ChartTooltip.vue";

// sample slices for the configuration page
const sampleItems = [
  { label: "Metric - 1", value: 60 },
  { label: "Metric - 2", value: 15 },
  { label: "Metric - 3", value: 25 },
];
const sampleColors = ["#55bd99", "#f59e0b", "#ff5a5f"];

export default {
  name: "PieChart",
  components: { ChartTooltip },
  props: {
    items: { type: Array, default: () => [] },
    showLegend: { type: Boolean, default: true },
    placeholder: Boolean,
  },
  data() {
    return { hoverIndex: -1, tipX: 0, tipY: 0 };
  },
  computed: {
    list() {
      return (this.placeholder ? sampleItems : this.items).filter(
        (item) => Number(item.value) > 0,
      );
    },
    total() {
      return this.list.reduce((sum, item) => sum + Number(item.value), 0);
    },
    // turn each value into an svg arc path
    slices() {
      let angle = -Math.PI / 2;
      return this.list.map((item) => {
        const sweep = (Number(item.value) / this.total) * Math.PI * 2;
        const start = angle;
        angle += sweep;
        const point = (value) =>
          `${50 + 48 * Math.cos(value)} ${50 + 48 * Math.sin(value)}`;
        return {
          path: `M50 50 L${point(start)} A48 48 0 ${
            sweep > Math.PI ? 1 : 0
          } 1 ${point(angle)} Z`,
        };
      });
    },
  },
  methods: {
    colorFor(index) {
      return this.placeholder
        ? sampleColors[index % 3]
        : pieColors[index % pieColors.length];
    },
    percentText(index) {
      return `${+((Number(this.list[index].value) / this.total) * 100).toFixed(
        1,
      )} %`;
    },
    moveTip(event, index) {
      const box = this.$el.getBoundingClientRect();
      this.hoverIndex = index;
      this.tipX = Math.min(
        event.clientX - box.left + 14,
        Math.max(0, box.width - 130),
      );
      this.tipY = Math.max(0, event.clientY - box.top - 12);
    },
  },
};
</script>


<style scoped>
.pie-root {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.pie-area {
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 0;
  aspect-ratio: 1 / 1;
  max-width: 70%;
}
.pie-svg {
  width: 100%;
  height: 100%;
}
.pie-legend {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 30%;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: #202124;
}
.pie-legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.pie-legend i {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.pie-legend span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
