// gives a chart component its real pixel width and height
export default {
  data() {
    return { chartWidth: 0, chartHeight: 0, chartObserver: null };
  },
  mounted() {
    this.measureChart();
    this.chartObserver = new ResizeObserver(this.measureChart);
    this.chartObserver.observe(this.$el);
  },
  beforeUnmount() {
    if (this.chartObserver) this.chartObserver.disconnect();
  },
  methods: {
    measureChart() {
      this.chartWidth = this.$el.clientWidth;
      this.chartHeight = this.$el.clientHeight;
    },
  },
};
