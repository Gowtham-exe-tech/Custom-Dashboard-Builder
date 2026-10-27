import mongoose from "mongoose";
import Dashboard from "../models/Dashboard.js";
import httpError from "../utils/httpError.js";
import { validateDashboard } from "../utils/validateDashboard.js";


// To prevents clients from updating fields like _id directly.
const allowedDashboardFields = [
  "name",
  "description",
  "isDefault",
  "dateRange",
  "widgets",
  "globalFilters",
  "layout",
  "items",
  "refreshInterval",
];

function pickDashboardFields(data) {
  const result = {};

  for (const field of allowedDashboardFields) {
    if (Object.hasOwn(data, field)) {
      result[field] = data[field];
    }
  }
  return result;
}

// Check the dashboard ID before sending it to MongoDB.
function validateDashboardId(dashboardId) {
  if (!mongoose.isValidObjectId(dashboardId)) {
    throw httpError(400, "Invalid dashboard ID");
  }
}

// Create a dashboard
export async function createDashboard(req, res) {
  const dashboardData = pickDashboardFields(req.body);

  // Validate the dashboard structure before saving it.
  validateDashboard(dashboardData);

  // The first dashboard becomes the default if none exists yet.
  const existingDefault = await Dashboard.findOne({ isDefault: true }).lean();
  const shouldBeDefault = dashboardData.isDefault === true || !existingDefault;

  const dashboard = new Dashboard({
    ...dashboardData,
    isDefault: false,
  });

  await dashboard.save();

  // Only one dashboard should be marked as the default.
  if (shouldBeDefault) {
    await Dashboard.updateMany(
      { _id: { $ne: dashboard._id } },
      { $set: { isDefault: false } }
    );

    dashboard.isDefault = true;
    await dashboard.save();
  }

  res.status(201).json({
    success: true,
    message: "Dashboard created successfully",
    data: dashboard,
  });
}

// Get all dashboards
export async function getDashboards(req, res) {
  const dashboards = await Dashboard.find()
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: dashboards.length,
    data: dashboards,
  });
}

// Get one dashboard using its ID
export async function getDashboardById(req, res) {
  validateDashboardId(req.params.dashboardId);

  const dashboard = await Dashboard.findById(req.params.dashboardId).lean();

  if (!dashboard) {
    throw httpError(404, "Dashboard not found");
  }

  res.status(200).json({
    success: true,
    data: dashboard,
  });
}

// Get the dashboard currently marked as default
export async function getDefaultDashboard(req, res) {
  const dashboard = await Dashboard.findOne({ isDefault: true }).lean();

  if (!dashboard) {
    throw httpError(404, "No default dashboard found");
  }

  res.status(200).json({
    success: true,
    data: dashboard,
  });
}

// Update dashboard settings, widgets, filters, or layout
export async function updateDashboard(req, res) {
  const { dashboardId } = req.params;
  validateDashboardId(dashboardId);

  const currentDashboard = await Dashboard.findById(dashboardId);

  if (!currentDashboard) {
    throw httpError(404, "Dashboard not found");
  }

  const updates = pickDashboardFields(req.body);

  // Merge nested layout data so a partial layout update doesn't
  // accidentally remove existing layout settings during validation.
  const mergedDashboard = {
    ...currentDashboard.toObject(),
    ...updates,
    layout: {
      ...currentDashboard.layout?.toObject?.(),
      ...updates.layout,
    },
  };

  // Validate the complete updated configuration, not only the changed fields.
  validateDashboard(mergedDashboard);

  // Apply only fields supplied by the client.
  for (const [field, value] of Object.entries(updates)) {
    currentDashboard.set(field, value);
  }

  // If this dashboard becomes the default, unset the previous default.
  if (updates.isDefault === true) {
    await Dashboard.updateMany(
      { _id: { $ne: currentDashboard._id } },
      { $set: { isDefault: false } }
    );
  }

  await currentDashboard.save();

  res.status(200).json({
    success: true,
    message: "Dashboard updated successfully",
    data: currentDashboard,
  });
}

// Make an existing dashboard the default dashboard
export async function setDefaultDashboard(req, res) {
  const { dashboardId } = req.params;
  validateDashboardId(dashboardId);

  const dashboard = await Dashboard.findById(dashboardId);

  if (!dashboard) {
    throw httpError(404, "Dashboard not found");
  }

  // Remove the default flag from every other dashboard first.
  await Dashboard.updateMany(
    { _id: { $ne: dashboard._id } },
    { $set: { isDefault: false } }
  );

  dashboard.isDefault = true;
  await dashboard.save();

  res.status(200).json({
    success: true,
    message: "Default dashboard updated successfully",
    data: dashboard,
  });
}

// Delete a dashboard and promote another one if it was the default.
export async function deleteDashboard(req, res) {
  const { dashboardId } = req.params;
  validateDashboardId(dashboardId);

  const dashboard = await Dashboard.findById(dashboardId);

  if (!dashboard) {
    throw httpError(404, "Dashboard not found");
  }

  const wasDefault = dashboard.isDefault;

  await dashboard.deleteOne();

  // If the default was deleted, select the most recently updated dashboard.
  if (wasDefault) {
    const nextDashboard = await Dashboard.findOne().sort({ updatedAt: -1 });

    if (nextDashboard) {
      nextDashboard.isDefault = true;
      await nextDashboard.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "Dashboard deleted successfully",
    data: {
      dashboardId,
    },
  });
}