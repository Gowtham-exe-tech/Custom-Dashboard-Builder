import Order from "../models/Order.js";
import httpError from "../utils/httpError.js";

const searchableFields = [
  "orderNumber",
  "customerName",
  "customerEmail",
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "streetAddress",
  "city",
  "stateProvince",
  "postalCode",
  "country",
  "createdBy",
  "productName",
];

const allowedSortFields = [
  "orderNumber",
  "customerName",
  "productName",
  "quantity",
  "unitPrice",
  "total",
  "status",
  "orderDate",
  "createdAt",
];

const allowedOrderFields = [
  "orderNumber",
  "customerName",
  "customerEmail",
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "streetAddress",
  "city",
  "stateProvince",
  "postalCode",
  "country",
  "createdBy",
  "productName",
  "quantity",
  "unitPrice",
  "status",
  "orderDate",
  "notes",
];

// Treat search input as plain text, not as a regular expression.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNumber(value, fieldName) {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw httpError(400, `${fieldName} must be a valid number`);
  }

  return parsedValue;
}

function parseDate(value, fieldName) {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw httpError(400, `${fieldName} must be a valid date`);
  }

  return parsedDate;
}

// Keep only fields that can be changed through the order API.
function pickOrderFields(data = {}) {
  const result = {};

  for (const field of allowedOrderFields) {
    if (Object.hasOwn(data, field)) {
      result[field] = data[field];
    }
  }
  return result;
}

function buildOrderQuery(queryParams = {}) {
  const {
    status,
    customerName,
    productName,
    search,
    minTotal,
    maxTotal,
    fromDate,
    toDate,
  } = queryParams;

  const filter = {};

  if (status) {
    const allowedStatuses = ["Pending", "In progress", "Completed"];

    if (!allowedStatuses.includes(status)) {
      throw httpError(400, "Invalid order status");
    }

    filter.status = status;
  }

  // Customer and product filters support partial, case-insensitive matches.
  if (customerName) {
    filter.customerName = {
      $regex: escapeRegex(String(customerName)),
      $options: "i",
    };
  }

  if (productName) {
    filter.productName = {
      $regex: escapeRegex(String(productName)),
      $options: "i",
    };
  }

  // Search across order number, customer, customerEmail, and product.
  if (search) {
    const searchRegex = {
      $regex: escapeRegex(String(search)),
      $options: "i",
    };

    filter.$or = searchableFields.map((field) => ({
      [field]: searchRegex,
    }));
  }

  const minimumTotal = parseNumber(minTotal, "minTotal");
  const maximumTotal = parseNumber(maxTotal, "maxTotal");

  if (
    minimumTotal !== undefined &&
    maximumTotal !== undefined &&
    minimumTotal > maximumTotal
  ) {
    throw httpError(400, "minTotal cannot be greater than maxTotal");
  }

  if (minimumTotal !== undefined || maximumTotal !== undefined) {
    filter.total = {};

    if (minimumTotal !== undefined) {
      filter.total.$gte = minimumTotal;
    }

    if (maximumTotal !== undefined) {
      filter.total.$lte = maximumTotal;
    }
  }

  const startDate = parseDate(fromDate, "fromDate");
  const endDate = parseDate(toDate, "toDate");

  if (startDate && endDate && startDate > endDate) {
    throw httpError(400, "fromDate cannot be later than toDate");
  }

  if (startDate || endDate) {
    filter.orderDate = {};

    if (startDate) {
      filter.orderDate.$gte = startDate;
    }

    if (endDate) {
      filter.orderDate.$lte = endDate;
    }
  }

  return filter;
}

// Get a page of orders and the total count matching the same filters.
async function listOrders(queryParams = {}) {
  const filter = buildOrderQuery(queryParams);

  const page = Number(queryParams.page ?? 1);
  const limit = Number(queryParams.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    throw httpError(400, "page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw httpError(400, "limit must be an integer between 1 and 100");
  }

  const sortBy = queryParams.sortBy || "createdAt";
  const sortOrder = String(queryParams.order || "desc").toLowerCase();

  if (!allowedSortFields.includes(sortBy)) {
    throw httpError(400, `Sorting by ${sortBy} is not supported`);
  }

  if (!["asc", "desc"].includes(sortOrder)) {
    throw httpError(400, "order must be asc or desc");
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [orders, totalItems] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page * limit < totalItems,
      hasPreviousPage: page > 1 && totalItems > 0,
    },
  };
}

// Create an order after removing fields that clients should not set directly.
async function createOrder(data = {}) {
  const orderData = pickOrderFields(data);

  if (Object.keys(orderData).length === 0) {
    throw httpError(400, "Order data is required");
  }

  const order = new Order(orderData);

  // Mongoose validates required fields and calculates total through the model hook.
  await order.save();

  return order;
}

// Find one order and return a 404 when its ID doesn't exist.
async function getOrder(orderId) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw httpError(404, "Order not found");
  }

  return order;
}

// Update only allowed fields and run model validation before saving.
async function updateOrder(orderId, data = {}) {
  const updates = pickOrderFields(data);

  if (Object.keys(updates).length === 0) {
    throw httpError(400, "Provide at least one valid field to update");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw httpError(404, "Order not found");
  }

  order.set(updates);
  await order.save();

  return order;
}

// Delete an order only if it exists.
async function deleteOrder(orderId) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw httpError(404, "Order not found");
  }

  await order.deleteOne();

  return order;
}

export {
  listOrders,
  buildOrderQuery,
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
};
