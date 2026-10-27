<template>
  <div v-if="show" class="chart-tip" :style="{ left: x + 'px', top: y + 'px' }">
    <span
      v-if="color"
      class="chart-tip-dot"
      :style="{ background: color }"></span
    >{{ label }} : <strong>{{ value }}</strong>
  </div>
</template>


<script>
// dark tooltip box shown when hovering a chart
export default {
  name: "ChartTooltip",
  props: {
    show: Boolean,
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    label: { type: String, default: "" },
    value: { type: String, default: "" },
    color: { type: String, default: "" },
  },
};
</script>

<style scoped>
.chart-tip {
  position: absolute;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  color: #fff;
  background: #0d1b26;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
}
.chart-tip strong {
  font-weight: 700;
}
.chart-tip-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
</style>
