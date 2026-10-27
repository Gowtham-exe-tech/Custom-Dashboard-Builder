//to validate data before store in db
//checking:
//Dashboard name and description
//Widget types and unique IDs
//Widget titles and grid positions
//Layout settings
//Global filter configuration
//Refresh interval settings

import httpError from "./httpError.js";

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

const allowedFilterTypes = [
  "dateRange",
  "select",
  "text",
  "number",
];

const allowedDateRanges = ["all", "today", "7d", "30d", "90d", "1y"];

const allowedRefreshIntervals = [
  "manual",
  "5min",
  "1hr",
  "daily",
];

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function validateDashboard(data, { partial = false } = {}) {
  if (!isPlainObject(data)) {
    throw httpError(400, "Dashboard data must be an object");
  }

  // Require a name when creating a dashboard, but allow other fields to be updated independently
  if (!partial || data.name !== undefined) {
    if (
      typeof data.name !== "string" ||
      data.name.trim().length === 0 ||
      data.name.trim().length > 100
    ) {
      throw httpError(
        400,
        "Dashboard name is required and must be under 100 characters"
      );
    }
  }

  if (
    data.description !== undefined &&
    (typeof data.description !== "string" || data.description.length > 500)
  ) {
    throw httpError(
      400,
      "Dashboard description must be a string under 500 characters"
    );
  }

  if (
    data.isDefault !== undefined &&
    typeof data.isDefault !== "boolean"
  ) {
    throw httpError(400, "isDefault must be a boolean");
  }

  // Validate the saved date range
  if (data.dateRange !== undefined && !allowedDateRanges.includes(data.dateRange)) {
    throw httpError(400, "Invalid dashboard date range");
  }

  // Validate the saved refresh preference
  if (
    data.refreshInterval !== undefined &&
    !allowedRefreshIntervals.includes(data.refreshInterval)
  ) {
    throw httpError(400, "Invalid dashboard refresh interval");
  }

  // Check layout settings before validating widget positions
  if (data.layout !== undefined) {
    if (!isPlainObject(data.layout)) {
      throw httpError(400, "Dashboard layout must be an object");
    }

    const { columns, rowHeight, gap } = data.layout;

    // This dashboard uses a maximum of 12 grid columns
    if (
      columns !== undefined &&
      (!Number.isInteger(columns) || columns < 1 || columns > 12)
    ) {
      throw httpError(
        400,
        "layout.columns must be an integer between 1 and 12"
      );
    }

    if (
      rowHeight !== undefined &&
      (!Number.isFinite(rowHeight) || rowHeight < 20 || rowHeight > 500)
    ) {
      throw httpError(
        400,
        "layout.rowHeight must be between 20 and 500"
      );
    }

    if (
      gap !== undefined &&
      (!Number.isFinite(gap) || gap < 0 || gap > 100)
    ) {
      throw httpError(400, "layout.gap must be between 0 and 100");
    }
  }

  if (data.widgets !== undefined) {
    if (!Array.isArray(data.widgets)) {
      throw httpError(400, "widgets must be an array");
    }

    const widgetIds = new Set();

    // Use the submitted column count, or the default 12-column grid
    const columns = data.layout?.columns ?? 12;

    for (const widget of data.widgets) {
      if (!isPlainObject(widget)) {
        throw httpError(400, "Each widget must be an object");
      }

      if (
        typeof widget.id !== "string" ||
        widget.id.trim() === ""
      ) {
        throw httpError(400, "Each widget must have a non-empty id");
      }

      // Widget IDs must be unique so layout and filter references remain unambiguous
      if (widgetIds.has(widget.id)) {
        throw httpError(400, `Duplicate widget id: ${widget.id}`);
      }

      widgetIds.add(widget.id);

      if (!allowedWidgetTypes.includes(widget.type)) {
        throw httpError(400, `Unsupported widget type: ${widget.type}`);
      }

      if (
        typeof widget.title !== "string" ||
        widget.title.trim() === "" ||
        widget.title.length > 100
      ) {
        throw httpError(
          400,
          "Each widget must have a title under 100 characters"
        );
      }

      const { x, y, w, h } = widget;

      if (!Number.isInteger(x) || x < 0) {
        throw httpError(
          400,
          `Widget ${widget.id}: x must be a non-negative integer`
        );
      }

      if (!Number.isInteger(y) || y < 0) {
        throw httpError(
          400,
          `Widget ${widget.id}: y must be a non-negative integer`
        );
      }

      if (!Number.isInteger(w) || w < 1 || w > columns) {
        throw httpError(
          400,
          `Widget ${widget.id}: w must be between 1 and ${columns}`
        );
      }

      // Prevent a widget from extending past the right edge of the grid
      if (x + w > columns) {
        throw httpError(
          400,
          `Widget ${widget.id} exceeds the dashboard grid width`
        );
      }

      if (!Number.isInteger(h) || h < 1 || h > 100) {
        throw httpError(
          400,
          `Widget ${widget.id}: h must be between 1 and 100`
        );
      }

      if (
        widget.config !== undefined &&
        !isPlainObject(widget.config)
      ) {
        throw httpError(
          400,
          `Widget ${widget.id}: config must be an object`
        );
      }
    }
  }

  if (data.globalFilters !== undefined) {
    if (!Array.isArray(data.globalFilters)) {
      throw httpError(400, "globalFilters must be an array");
    }

    const filterIds = new Set();

    for (const filter of data.globalFilters) {
      if (!isPlainObject(filter)) {
        throw httpError(400, "Each global filter must be an object");
      }

      if (
        typeof filter.id !== "string" ||
        filter.id.trim() === ""
      ) {
        throw httpError(
          400,
          "Each global filter must have a non-empty id"
        );
      }

      // Prevent duplicate filter IDs within the same dashboard
      if (filterIds.has(filter.id)) {
        throw httpError(400, `Duplicate global filter id: ${filter.id}`);
      }

      filterIds.add(filter.id);

      if (!allowedFilterTypes.includes(filter.type)) {
        throw httpError(
          400,
          `Unsupported global filter type: ${filter.type}`
        );
      }

      if (
        typeof filter.field !== "string" ||
        filter.field.trim() === ""
      ) {
        throw httpError(400, "Each global filter must have a field");
      }

      if (
        filter.appliesTo !== undefined &&
        (
          !Array.isArray(filter.appliesTo) ||
          filter.appliesTo.some(
            (widgetId) => typeof widgetId !== "string"
          )
        )
      ) {
        throw httpError(
          400,
          "globalFilter.appliesTo must be an array of widget ids"
        );
      }
    }
  }

  // Return the validated input so the controller can continue processing it
  return data;
}

export {
  validateDashboard,
  allowedWidgetTypes,
  allowedRefreshIntervals,
  allowedDateRanges,
};