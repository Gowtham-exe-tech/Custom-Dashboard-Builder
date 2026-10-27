// here, I connect dashboard widget configurations to the aggregation functions

import Order from "../models/Order.js";
import httpError from "../utils/httpError.js";
import { filterOrders } from "../utils/filterOrders.js";
import { aggregateOrders, createScatterData } from "./aggregatonService.js";

const allowedWidgetTypes = [
  "bar",
  "line",
  "pie",
  "area",
  "scatter",
  "table",
  "kpi",
  "text",
];

const allowedTableFields = [
  "orderNumber",
  "customerId",
  "customerName",
  "customerEmail",
  "address",
  "createdBy",
  "productName",
  "quantity",
  "unitPrice",
  "total",
  "status",
  "orderDate",
];

const allowedFilterLogic = ["AND", "OR"];

// columns shown when a table widget has none chosen yet
const defaultTableFields = ["orderNumber", "quantity", "productName", "total"];

// how many days back each date range reaches (today starts at midnight)
const dateRangeDays = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

// Add fields the orders page shows but the order model does not store
function addDerivedFields(orders) {
  const customerIds = new Map();
  const sorted = [...orders].sort((a, b) => new Date(a.createdAt || a.orderDate) - new Date(b.createdAt || b.orderDate));
  sorted.forEach((order) => {
    const key = (order.customerEmail || order.email || order.customerName || "").toLowerCase();
    if (!customerIds.has(key)) customerIds.set(key, `CUST-${String(customerIds.size + 1).padStart(4, "0")}`);
  });
  return orders.map((order) => {
    const key = (order.customerEmail || order.email || order.customerName || "").toLowerCase();
    const address = [order.streetAddress, order.city, order.stateProvince, order.postalCode, order.country].filter(Boolean).join(", ");
    return { ...order, customerId: customerIds.get(key), customerEmail: order.customerEmail || order.email || "", address };
  });
}

// Keep only the orders inside the selected date range
function filterByDateRange(orders, dateRange = "all") {
  if (dateRange === "all") return orders;
  const now = new Date();
  let start;
  if (dateRange === "today") start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (dateRangeDays[dateRange]) start = new Date(now.getTime() - dateRangeDays[dateRange] * 24 * 60 * 60 * 1000);
  else throw httpError(400, `Unsupported date range: ${dateRange}`);
  return orders.filter((order) => new Date(order.orderDate) >= start);
}

// Pie charts: category fields count orders, number fields add up per product
const pieNumberFields = ["quantity", "unitPrice", "total"];
function getPieData(orders, config) {
  const field = config.chartData || "status";
  const isNumber = pieNumberFields.includes(field);
  const data = aggregateOrders(orders, isNumber ? { aggregation: "sum", field, groupBy: "productName" } : { aggregation: "count", groupBy: field });
  return { ...data, chartData: field };
}

function validateWidget(widget) {
  if (!widget || typeof widget !== "object" || Array.isArray(widget)) {
    throw httpError(400, "Widget configuration must be an object");
  }

  if (!allowedWidgetTypes.includes(widget.type)) {
    throw httpError(400, `Unsupported widget type: ${widget.type}`);
  }

  if (!widget.config || typeof widget.config !== "object" || Array.isArray(widget.config)) {
    throw httpError(400, "Widget config must be an object");
  }
}

function getWidgetFilters(config) {
  const filters = config.filters ?? [];
  const logic = config.filterLogic ?? "AND";

  if (!Array.isArray(filters)) {
    throw httpError(400, "Widget filters must be an array");
  }

  if (!allowedFilterLogic.includes(logic)) {
    throw httpError(400, "Widget filterLogic must be AND or OR");
  }
  return { filters, logic };
}

function applyGlobalFilters(orders, globalFilters, widgetId) {
  if (!Array.isArray(globalFilters)) {
    throw httpError(400, "Global filters must be an array");
  }

  let filteredOrders = orders;
  for (const globalFilter of globalFilters) {
    // An empty appliesTo list means the filter applies to every widget
    const appliesTo = globalFilter.appliesTo ?? [];

    if (appliesTo.length > 0 && !appliesTo.includes(widgetId)) {
      continue;
    }

    // Only apply global filters that use the same supported condition structure
    const { filters, logic } = globalFilter;

    if (!Array.isArray(filters) || !allowedFilterLogic.includes(logic)) {
      throw httpError(400, "Each applicable global filter must contain filters and AND/OR logic");
    }
    filteredOrders = filterOrders(filteredOrders, filters, logic);
  }
  return filteredOrders;
}

function getTableData(orders, config) {
  const requestedFields = config.columns?.length ? config.columns : config.fields?.length ? config.fields : defaultTableFields;

  if (!Array.isArray(requestedFields) || requestedFields.length === 0) {
    throw httpError(400, "Table fields must be a non-empty array");
  }

  // Prevent the frontend from requesting arbitrary database fields
  for (const field of requestedFields) {
    if (!allowedTableFields.includes(field)) {
      throw httpError(400, `Table field ${field} is not supported`);
    }
  }

  // Sort by the first chosen column
  const direction = config.sortOrder === "desc" ? -1 : 1;
  const sortField = requestedFields[0];
  const sorted = [...orders].sort((a, b) => {
    const first = a[sortField];
    const second = b[sortField];
    if (typeof first === "number" && typeof second === "number") return (first - second) * direction;
    return String(first ?? "").localeCompare(String(second ?? ""), undefined, { numeric: true }) * direction;
  });

  return {
    columns: requestedFields,
    rows: sorted.slice(0, 500).map((order) => {
      const row = {};

      for (const field of requestedFields) {
        row[field] = order[field];
      }
      return row;
    }),
    totalRows: orders.length,
  };
}

function getTextData(config) {
  // Return text content as data; the frontend decides how to render it
  return {
    content: String(config.content ?? ""),
  };
}

async function getWidgetData({widget, globalFilters = [], dateRange = "all"}) {
  validateWidget(widget);

  // Text widgets don't need order records or database aggregation
  if (widget.type === "text") {
    return {
      widgetId: widget.id,
      type: widget.type,
      title: widget.title,
      data: getTextData(widget.config),
    };
  }

  const config = widget.config;

  // Load the order dataset; widget conditions will narrow it down afterward
  const orders = addDerivedFields(await Order.find({}).lean());

  const { filters, logic } = getWidgetFilters(config);

  // Apply the selected date range, then widget-specific conditions
  let filteredOrders = filterOrders(filterByDateRange(orders, dateRange), filters, logic);

  // Then apply applicable dashboard-level conditions
  filteredOrders = applyGlobalFilters(
    filteredOrders,
    globalFilters,
    widget.id
  );

  let data;

  switch (widget.type) {
    case "bar":
    case "line":
    case "area": {
      // x axis groups the orders, y axis is the chosen metric
      data = aggregateOrders(filteredOrders, {
        aggregation: config.aggregation || "count",
        field: config.metric || config.field || "total",
        groupBy: config.groupBy || "status",
        dateGrouping: config.dateGrouping || "day",
      });
      break;
    }

    case "pie": {
      data = getPieData(filteredOrders, config);
      break;
    }

    case "kpi": {
      // A KPI returns one number instead of grouped chart data
      data = aggregateOrders(filteredOrders, {
        aggregation: config.aggregation || "sum",
        field: config.metric || config.field || "total",
      });
      break;
    }

    case "scatter": {
      data = createScatterData(
        filteredOrders,
        config.xField || "quantity",
        config.yField || "total"
      );
      break;
    }

    case "table": {
      data = getTableData(filteredOrders, config);
      break;
    }

    default:
      throw httpError(400, `No data handler for widget type ${widget.type}`);
  }

  return {
    widgetId: widget.id,
    type: widget.type,
    title: widget.title,
    data,
    recordCount: filteredOrders.length,
  };
}

export {
  getWidgetData,
  validateWidget,
  applyGlobalFilters,
};
