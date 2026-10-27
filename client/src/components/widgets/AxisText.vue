<template>
  <text
    :x="x"
    :y="startY"
    :text-anchor="anchor"
    :font-size="fontSize"
    :fill="fill">
    <tspan
      v-for="(line, index) in lines"
      :key="index"
      :x="x"
      :dy="index === 0 ? 0 : lineHeight"
      >{{ line }}</tspan
    >
  </text>
</template>


<script>
// multi line svg text, always horizontal
export default {
  name: "AxisText",
  props: {
    x: Number,
    y: Number,
    lines: { type: Array, default: () => [] },
    fontSize: { type: Number, default: 11 },
    fill: { type: String, default: "#6b7385" },
    anchor: { type: String, default: "middle" },
    centered: Boolean,
  },
  computed: {
    lineHeight() {
      return this.fontSize * 1.25;
    },
    startY() {
      return this.centered
        ? this.y +
            this.fontSize * 0.35 -
            ((this.lines.length - 1) * this.lineHeight) / 2
        : this.y;
    },
  },
};
</script>
