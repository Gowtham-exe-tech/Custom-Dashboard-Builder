import httpError from "../utils/httpError.js";

const allowedAggregations = [
  "count",
  "sum",
  "average",
  "min",
  "max",
];

const allowedGroupFields = [
  "customerId",
  "createdBy",
  "address",
  "customerEmail",
  "status",
  "customerName",
  "productName",
  "quantity",
  "unitPrice",
  "total",
  "orderDate",
];

// fields where "count" means number of different values
const distinctCountFields = ["customerId", "customerName", "customerEmail"];

const allowedMetricFields = [
  "quantity",
  "unitPrice",
  "total",
];

const allowedScatterFields = [
  "orderNumber",
  "customerId",
  "customerName",
  "customerEmail",
  "address",
  "orderDate",
  "productName",
  "createdBy",
  "status",
  "total",
  "unitPrice",
  "quantity",
];

// Read a field from an order and reject unsupported fields
function getFieldValue(order, field) {
  if (!allowedGroupFields.includes(field) && field !== "orderNumber") {
    throw httpError(400, `Field ${field} is not supported for grouping`);
  }
  return order[field];
}

// Convert a date to a readable grouping label
function getGroupLabel(value, groupBy, dateGrouping = "day") {
  if (value === undefined || value === null || value === "") {
    return "Unknown";
  }

  // Group dates by calendar day so orders from the same day share one group
  if (groupBy === "orderDate") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }
    return date.toISOString().slice(0, dateGrouping === "month" ? 7 : 10);
  }
  return String(value);
}

function getNumericValues(orders, field) {
  if (!allowedMetricFields.includes(field)) {
    throw httpError(400, `Metric field must be one of: ${allowedMetricFields.join(", ")}`);
  }

  return orders.map((order) => {
    const value = Number(order[field]);

    if (!Number.isFinite(value)) {
      throw httpError(400, `Order contains an invalid ${field} value`);
    }
    return value;
  });
}

function calculateMetric(orders, aggregation, field) {
  if (!allowedAggregations.includes(aggregation)) {
    throw httpError(400, `Unsupported aggregation: ${aggregation}`);
  }

  // Count works on any field: customers are counted once, other fields count filled values
  if (aggregation === "count") {
    if (!field) return orders.length;
    const filled = orders.map((order) => order[field]).filter((value) => value !== undefined && value !== null && value !== "");
    return distinctCountFields.includes(field) ? new Set(filled).size : filled.length;
  }

  const values = getNumericValues(orders, field);

  if (values.length === 0) {
    return 0;
  }

  switch (aggregation) {
    case "sum":
      return values.reduce((sum, value) => sum + value, 0);
    case "average":
      return (
        values.reduce((sum, value) => sum + value, 0) /
        values.length
      );
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      throw httpError(400, `Unsupported aggregation: ${aggregation}`);
  }
}

function groupOrders(orders, groupBy, dateGrouping = "day") {
  if (!allowedGroupFields.includes(groupBy)) {
    throw httpError(400, `Grouping by ${groupBy} is not supported`);
  }

  const groups = new Map();

  for (const order of orders) {
    const fieldValue = getFieldValue(order, groupBy);
    const label = getGroupLabel(fieldValue, groupBy, dateGrouping);

    // Each unique label gets its own collection of matching orders
    if (!groups.has(label)) {
      groups.set(label, []);
    }

    groups.get(label).push(order);
  }

  return groups;
}

function aggregateOrders(orders, { aggregation = "count", field = "total", groupBy, dateGrouping = "day" } = {}) {
  if (!Array.isArray(orders)) {
    throw httpError(400, "Orders must be an array");
  }

  // Without groupBy, return one calculated metric for the entire dataset
  if (!groupBy) {
    return {
      aggregation,
      field,
      value: calculateMetric(orders, aggregation, field),
    };
  }

  const groups = groupOrders(orders, groupBy, dateGrouping);

  // Convert grouped records into a simple array that charts can consume
  const results = Array.from(groups.entries()).map(([label, group]) => ({
    label,
    value: calculateMetric(group, aggregation, field),
  }));

  // Dates read better in time order
  if (groupBy === "orderDate") results.sort((a, b) => a.label.localeCompare(b.label));

  return {
    aggregation,
    field,
    groupBy,
    results,
  };
}

// number fields stay numbers, every other field is sent as text for a category axis
const scatterNumberFields = ["quantity", "unitPrice", "total"];
function scatterValue(order, field) {
  const value = order[field];
  if (scatterNumberFields.includes(field)) return Number(value);
  if (field === "orderDate") return value ? new Date(value).toISOString().slice(0, 10) : "";
  return value === undefined || value === null ? "" : String(value);
}

function createScatterData(orders, xField, yField) {
  if (!allowedScatterFields.includes(xField) || !allowedScatterFields.includes(yField)) {
    throw httpError(400, "Scatter chart fields are not supported");
  }

  // Each order becomes one point on the scatter chart
  return orders.map((order) => ({
    x: scatterValue(order, xField),
    y: scatterValue(order, yField),
    orderNumber: order.orderNumber,
  }));
}

export {
  aggregateOrders,
  calculateMetric,
  groupOrders,
  createScatterData,
  allowedAggregations,
  allowedGroupFields,
  allowedMetricFields,
};
