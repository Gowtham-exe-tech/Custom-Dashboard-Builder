import {
  listOrders as listOrdersService,
  createOrder as createOrderService,
  getOrder as getOrderService,
  updateOrder as updateOrderService,
  deleteOrder as deleteOrderService,
} from "../services/orderService.js";

import asyncHandler from "../utils/asyncHandler.js";
import validateObjectId from "../utils/validateObjectId.js";


// Return the requested page of orders with pagination information.
export const listOrders = asyncHandler(async (req, res) => {
  const result = await listOrdersService(req.query);
  res.status(200).json({
    success: true,
    ...result,
  });
});

// Create an order and return the saved document.
export const createOrder = asyncHandler(async (req, res) => {
  const order = await createOrderService(req.body);
  res.status(201).json({
    success: true,
    data: order,
  });
});

// Find one order using its MongoDB ID.
export const getOrder = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, "order ID");
  const order = await getOrderService(req.params.id);
  res.status(200).json({
    success: true,
    data: order,
  });
});

// Update an existing order.
export const updateOrder = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, "order ID");
  const order = await updateOrderService(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: order,
  });
});

// Delete an order and confirm the operation.
export const deleteOrder = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, "order ID");
  await deleteOrderService(req.params.id);
  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});