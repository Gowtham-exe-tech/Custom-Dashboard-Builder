//support single and all widgets here

import mongoose from "mongoose";
import Dashboard from "../models/Dashboard.js";
import httpError from "../utils/httpError.js";
import { getWidgetData } from "../services/widgetDataService.js";

// Find the dashboard and return a clear error when its ID is invalid or missing
async function findDashboard(dashboardId) {
  if (!mongoose.isValidObjectId(dashboardId)) {
    throw httpError(400, "Invalid dashboard ID");
  }

  const dashboard = await Dashboard.findById(dashboardId).lean();

  if (!dashboard) {
    throw httpError(404, "Dashboard not found");
  }

  return dashboard;
}

// Convert saved global filter settings into conditions used by filterOrders()
function normalizeGlobalFilters(globalFilters = []) {
  if (!Array.isArray(globalFilters)) {
    throw httpError(400, "Dashboard globalFilters must be an array");
  }

  return globalFilters.map((globalFilter) => {
    // Also accept filters that already use the condition format
    if (Array.isArray(globalFilter.filters)) {
      return {
        appliesTo: globalFilter.appliesTo ?? [],
        logic: globalFilter.logic ?? "AND",
        filters: globalFilter.filters,
      };
    }

    const { type, field, value, appliesTo = [] } = globalFilter;

    if (!field || typeof field !== "string") {
      throw httpError(400, "Each global filter must have a field");
    }

    let filters = [];

    // A date range can have a start date, an end date, or both
    if (type === "dateRange") {
      const startDate = value?.from ?? value?.startDate;
      const endDate = value?.to ?? value?.endDate;

      if (startDate && endDate) {
        filters = [
          { field, operator: "gte", value: startDate },
          { field, operator: "lte", value: endDate },
        ];
      } else if (startDate) {
        filters = [{ field, operator: "gte", value: startDate }];
      } else if (endDate) {
        filters = [{ field, operator: "lte", value: endDate }];
      } else {
        throw httpError(400, `Date range filter ${field} has no dates`);
      }
    } else if (type === "select") {
      filters = [{ field, operator: "equals", value }];
    } else if (type === "text") {
      filters = [{ field, operator: "contains", value }];
    } else if (type === "number") {
      filters = [{ field, operator: "equals", value }];
    } else {
      throw httpError(400, `Unsupported global filter type: ${type}`);
    }

    return {
      appliesTo,
      logic: "AND",
      filters,
    };
  });
}

// Return data for one widget in a saved dashboard
async function getSingleWidgetData(req, res) {
  const { dashboardId, widgetId } = req.params;
  const dashboard = await findDashboard(dashboardId);

  // Widgets are stored inside the dashboard document, not in a separate collection
  const widget = dashboard.widgets.find((item) => item.id === widgetId);

  if (!widget) {
    throw httpError(404, "Widget not found in this dashboard");
  }

  const globalFilters = normalizeGlobalFilters(dashboard.globalFilters);

  // The service handles order loading, filtering, and aggregation
  const result = await getWidgetData({
    widget,
    globalFilters,
    dateRange: req.query.dateRange || dashboard.dateRange || "all",
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

// Return data for all widgets so the dashboard can load in one request
async function getAllWidgetData(req, res) {
  const dashboard = await findDashboard(req.params.dashboardId);
  const globalFilters = normalizeGlobalFilters(dashboard.globalFilters);

  // Run independent widget calculations concurrently
  const results = await Promise.all(
    dashboard.widgets.map((widget) =>
      getWidgetData({
        widget,
        globalFilters,
        dateRange: req.query.dateRange || dashboard.dateRange || "all",
      })
    )
  );

  res.status(200).json({
    success: true,
    data: {
      dashboardId: dashboard._id,
      dashboardName: dashboard.name,
      widgets: results,
    },
  });
}

// Return data for a widget that is not saved yet (used by the configuration page)
async function previewWidgetData(req, res) {
  const { widget, dateRange = "all" } = req.body || {};

  if (!widget || typeof widget !== "object") {
    throw httpError(400, "A widget is required");
  }

  const result = await getWidgetData({
    widget: { ...widget, id: widget.id || "preview", config: widget.config || {} },
    globalFilters: [],
    dateRange,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

export {
  previewWidgetData,
  getSingleWidgetData,
  getAllWidgetData,
  normalizeGlobalFilters,
};
