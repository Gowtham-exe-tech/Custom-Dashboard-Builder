import httpError from "./httpError.js";

// Only allow filtering on fields that exist in the Order model
const allowedFields = [
  "orderNumber",
  "customerName",
  "customerEmail",
  "productName",
  "quantity",
  "unitPrice",
  "total",
  "status",
  "orderDate",
  "createdAt",
  "updatedAt",
];

// Keep supported operators in one place so unsupported operators are rejected
const allowedOperators = [
  "equals",
  "notEquals",
  "contains",
  "startsWith",
  "endsWith",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "notIn",
  "between",
  "isEmpty",
  "isNotEmpty",
];

const numericFields = ["quantity", "unitPrice", "total"];
const dateFields = ["orderDate", "createdAt", "updatedAt"];

// Convert values into comparable types before applying conditions
function getComparableValue(field, value) {
  if (value === undefined || value === null || value === "") {
    throw httpError(400, `A value is required for ${field}`);
  }

  // Numeric comparisons must use numbers, not string comparisons
  if (numericFields.includes(field)) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      throw httpError(400, `Invalid numeric value for ${field}`);
    }

    return numberValue;
  }

  // Convert dates into timestamps so date comparisons work correctly
  if (dateFields.includes(field)) {
    const dateValue = new Date(value);

    if (Number.isNaN(dateValue.getTime())) {
      throw httpError(400, `Invalid date value for ${field}`);
    }

    return dateValue.getTime();
  }

  return String(value).toLowerCase();
}

function matchesFilter(order, filter) {
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
    throw httpError(400, "Each filter must be an object");
  }

  const { field, operator, value } = filter;

  if (!allowedFields.includes(field)) {
    throw httpError(400, `Filtering by ${field} is not supported`);
  }

  if (!allowedOperators.includes(operator)) {
    throw httpError(400, `Filtering operator ${operator} is not supported`);
  }

  const actualValue = order[field];

  // Handle empty values before performing other comparisons
  const actualIsEmpty = actualValue === undefined || actualValue === null || actualValue === "";

  if (operator === "isEmpty") {
    return actualIsEmpty;
  }

  if (operator === "isNotEmpty") {
    return !actualIsEmpty;
  }

  // Text operators are useful for searching names and product details
  if (["contains", "startsWith", "endsWith"].includes(operator)) {
    if (actualValue === undefined || actualValue === null) {
      return false;
    }

    const actualText = String(actualValue).toLowerCase();
    const filterText = String(value ?? "").toLowerCase();

    if (operator === "contains") {
      return actualText.includes(filterText);
    }

    if (operator === "startsWith") {
      return actualText.startsWith(filterText);
    }

    return actualText.endsWith(filterText);
  }

  // check whether a value exists in a supplied list
  if (operator === "in" || operator === "notIn") {
    if (!Array.isArray(value)) {
      throw httpError(400, `${operator} requires an array value`);
    }

    const actualComparable = getComparableValue(field, actualValue);
    const filterValues = value.map((item) =>
      getComparableValue(field, item)
    );

    const found = filterValues.some(
      (item) => item === actualComparable
    );

    return operator === "in" ? found : !found;
  }

  // checks whether a value falls inside an inclusive range
  if (operator === "between") {
    if (!Array.isArray(value) || value.length !== 2) {
      throw httpError(400, "between requires exactly two values");
    }

    const actualComparable = getComparableValue(field, actualValue);
    const lowerValue = getComparableValue(field, value[0]);
    const upperValue = getComparableValue(field, value[1]);

    if (lowerValue > upperValue) {
      throw httpError(400, "The lower range value cannot exceed the upper value");
    }

    return (
      actualComparable >= lowerValue &&
      actualComparable <= upperValue
    );
  }

  const actualComparable = getComparableValue(field, actualValue);
  const filterComparable = getComparableValue(field, value);

  // Apply the selected comparison operator
  switch (operator) {
    case "equals":
      return actualComparable === filterComparable;

    case "notEquals":
      return actualComparable !== filterComparable;

    case "gt":
      return actualComparable > filterComparable;

    case "gte":
      return actualComparable >= filterComparable;

    case "lt":
      return actualComparable < filterComparable;

    case "lte":
      return actualComparable <= filterComparable;

    default:
      throw httpError(400, `Unsupported operator: ${operator}`);
  }
}

function filterOrders(orders, filters = [], logic = "AND") {
  if (!Array.isArray(orders) || !Array.isArray(filters)) {
    throw httpError(400, "Orders and filters must be arrays");
  }

  if (!["AND", "OR"].includes(logic)) {
    throw httpError(400, "Filter logic must be AND or OR");
  }

  // With no conditions, return the original set of orders
  if (filters.length === 0) {
    return orders;
  }

  return orders.filter((order) => {
    const results = filters.map((filter) =>
      matchesFilter(order, filter)
    );
    
    return logic === "AND"
      ? results.every(Boolean)
      : results.some(Boolean);
  });
}

export {
  filterOrders,
  matchesFilter,
  allowedFields,
  allowedOperators,
};
