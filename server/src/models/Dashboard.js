import mongoose from "mongoose";

const filterSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      required: true, 
      trim: true 
    },
    type: {
      type: String,
      enum: ["dateRange", "select", "text", "number"],
      required: true,
    },
    field: { 
      type: String, 
      required: true, 
      trim: true 
    },
    label: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 100 
    },
    value: { 
      type: mongoose.Schema.Types.Mixed, 
      default: null 
    },
    appliesTo: { 
      type: [String],
      default: [] 
    },
  },
  { _id: false },
);

const widgetSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      required: true, 
      trim: true 
    },
    type: {
      type: String,
      enum: ["bar", "line", "pie", "area", "scatter", "table", "kpi", "text"],
      required: true,
    },
    title: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 150 
    },
    x: { type: Number, required: true, min: 0, max: 11, default: 0 },
    y: { type: Number, required: true, min: 0, default: 0 },
    w: { type: Number, required: true, min: 1, max: 12, default: 4 },
    h: { type: Number, required: true, min: 1, max: 100, default: 3 },
    config: { 
      type: mongoose.Schema.Types.Mixed, 
      default: {} 
    },
  },
  { _id: false },
);

const dashboardSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 120 
    },
    description: { 
      type: String, 
      trim: true, 
      maxlength: 1000, 
      default: "" 
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    },
    // default "show data for" range chosen on the configuration page
    dateRange: {
      type: String,
      enum: ["all", "today", "7d", "30d", "90d", "1y"],
      default: "all",
    },
    widgets: { 
      type: [widgetSchema], 
      default: [] 
    },
    globalFilters: { 
      type: [filterSchema], 
      default: [] 
    },
    layout: {
      columns: { type: Number, min: 1, max: 24, default: 12 },
      rowHeight: { type: Number, min: 20, max: 500, default: 80 },
      gap: { type: Number, min: 0, max: 100, default: 16 },
      items: { 
        type: [mongoose.Schema.Types.Mixed], 
        default: [] 
      },
    },
    refreshInterval: {
      type: String,
      enum: ["manual", "5min", "1hr", "daily"],
      default: "manual",
    },
  },
  { timestamps: true },
);

dashboardSchema.index({ updatedAt: -1 });
dashboardSchema.index({ isDefault: 1 });

const Dashboard = mongoose.model("Dashboard", dashboardSchema);
export default Dashboard;
