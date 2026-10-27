// shared settings for the dashboard and configuration pages
import barIcon from "../assets/icons/bar-chart.svg";
import lineIcon from "../assets/icons/line-chart.svg";
import pieIcon from "../assets/icons/pie-chart.svg";
import areaIcon from "../assets/icons/area-chart.svg";
import scatterIcon from "../assets/icons/scatter-plot.svg";
import tableIcon from "../assets/icons/widget-table-icon.svg";
import kpiIcon from "../assets/icons/kpi-value-icon.svg";

export const gridColumns = 12;
export const gridRows = 18;
export const gridGap = 8;

// date range values match the backend
export const dateRangeOptions = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last 1 year" },
];

// every order field a widget can use
export const fieldOptions = [
  { value: "orderNumber", label: "Order ID", kind: "text" },
  { value: "customerId", label: "Customer ID", kind: "text" },
  { value: "customerName", label: "Customer name", kind: "text" },
  { value: "customerEmail", label: "Email id", kind: "text" },
  { value: "address", label: "Address", kind: "text" },
  { value: "orderDate", label: "Order date", kind: "date" },
  { value: "productName", label: "Product", kind: "text" },
  { value: "createdBy", label: "Created by", kind: "text" },
  { value: "status", label: "Status", kind: "text" },
  { value: "total", label: "Total amount", kind: "currency" },
  { value: "unitPrice", label: "Unit price", kind: "currency" },
  { value: "quantity", label: "Quantity", kind: "number" },
];
const pick = (keys) =>
  keys.map((key) => fieldOptions.find((field) => field.value === key));
export const tableColumnOptions = fieldOptions;
export const kpiMetricOptions = fieldOptions.filter(
  (field) => field.value !== "orderNumber",
);
export const pieDataOptions = pick([
  "productName",
  "quantity",
  "unitPrice",
  "total",
  "status",
  "createdBy",
]);
export const groupByOptions = pick([
  "productName",
  "status",
  "createdBy",
  "customerName",
  "orderDate",
]);
export const scatterFieldOptions = fieldOptions;
export const numberFieldOptions = pick(["total", "unitPrice", "quantity"]);
export const filterFieldOptions = pick(["productName", "quantity", "status"]);
export const operatorOptions = [
  { value: "equals", label: "=" },
  { value: "notEquals", label: "≠" },
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "contains", label: "Contains" },
];
export const aggregationOptions = [
  { value: "sum", label: "Sum" },
  { value: "average", label: "Average" },
  { value: "count", label: "Count" },
];
export function aggregationLabel(value) {
  const item = aggregationOptions.find((option) => option.value === value);
  return item ? item.label : value;
}
export const dataFormatOptions = [
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
];
export const paginationOptions = [5, 10, 15];
export const pieColors = [
  "#55bd99",
  "#3b82f6",
  "#f59e0b",
  "#ff5a5f",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];
// widget types: label, icon, default size and library group
export const widgetTypes = {
  bar: { label: "Bar Chart", icon: barIcon, w: 5, h: 5, group: "Charts" },
  line: { label: "Line Chart", icon: lineIcon, w: 5, h: 5, group: "Charts" },
  pie: { label: "Pie Chart", icon: pieIcon, w: 4, h: 4, group: "Charts" },
  area: { label: "Area Chart", icon: areaIcon, w: 5, h: 5, group: "Charts" },
  scatter: {
    label: "Scatter Plot",
    icon: scatterIcon,
    w: 5,
    h: 5,
    group: "Charts",
  },
  table: { label: "Table", icon: tableIcon, w: 5, h: 5, group: "Tables" },
  kpi: { label: "KPI Value", icon: kpiIcon, w: 2, h: 2, group: "KPIs" },
};
export const libraryGroups = ["Charts", "Tables", "KPIs"].map((name) => ({
  name,
  items: Object.keys(widgetTypes)
    .filter((type) => widgetTypes[type].group === name)
    .map((type) => ({
      type,
      label: widgetTypes[type].label,
      icon: widgetTypes[type].icon,
    })),
}));

let idCounter = 0;
const makeId = () =>
  `widget-${Date.now()}-${idCounter++}-${Math.random()
    .toString(16)
    .slice(2, 6)}`;

// default config for each widget type
function defaultConfig(type) {
  const base = { description: "" };
  if (type === "kpi")
    return {
      ...base,
      metric: "",
      aggregation: "",
      format: "number",
      decimals: 0,
    };
  if (type === "table")
    return {
      ...base,
      columns: [],
      sortOrder: "",
      pageSize: "",
      applyFilter: false,
      filters: [],
      fontSize: 14,
      headerBackground: "#D8D8D8",
    };
  if (type === "pie") return { ...base, chartData: "", showLegend: true };
  if (type === "scatter")
    return {
      ...base,
      xField: "",
      yField: "",
      color: "#55bd99",
      showGrid: true,
      fontSize: 12,
    };
  return {
    ...base,
    groupBy: "",
    dateGrouping: "day",
    metric: "",
    aggregation: "",
    color: "#55bd99",
    showGrid: true,
    showLabels: false,
    fontSize: 12,
  };
}

export function createWidget(type, x = 0, y = 0) {
  const size = widgetTypes[type];
  return {
    id: makeId(),
    type,
    title: "Untitled",
    x,
    y,
    w: size.w,
    h: size.h,
    config: defaultConfig(type),
  };
}

// fill missing config keys on widgets that were saved earlier
export function normalizeWidget(widget) {
  return {
    ...widget,
    config: { ...defaultConfig(widget.type), ...(widget.config || {}) },
  };
}

export function fieldLabel(key) {
  const field = fieldOptions.find((item) => item.value === key);
  return field ? field.label : key;
}

export function fieldKind(key) {
  const field = fieldOptions.find((item) => item.value === key);
  return field ? field.kind : "text";
}

export function isNumberField(key) {
  return ["currency", "number"].includes(fieldKind(key));
}

// "Sum" and "Average" only make sense for number fields
export function aggregationsFor(metric) {
  return !metric || isNumberField(metric)
    ? aggregationOptions
    : aggregationOptions.filter((item) => item.value === "count");
}

// is the widget filled in enough to show real data
export function isConfigured(widget) {
  const config = widget.config || {};
  if (widget.type === "kpi")
    return Boolean(config.metric && config.aggregation);
  if (widget.type === "table")
    return Boolean(config.columns && config.columns.length);
  if (widget.type === "pie") return Boolean(config.chartData);
  if (widget.type === "scatter") return Boolean(config.xField && config.yField);
  return Boolean(config.groupBy && config.metric && config.aggregation);
}
