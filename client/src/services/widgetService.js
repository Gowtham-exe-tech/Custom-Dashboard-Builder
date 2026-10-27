import api from "./api";


// params can hold dateRange (all, today, 7d, 30d, 90d, 1y)
export const getAllWidgetData = (id, params) =>
  api.get(`/dashboards/${id}/widgets/data`, { params });

export const getWidgetData = (dashboardId, widgetId, params) =>
  api.get(`/dashboards/${dashboardId}/widgets/${widgetId}/data`, { params });

// data for a widget that is not saved yet (configuration page)
export const previewWidgetData = (widget, dateRange) =>
  api.post("/dashboards/widget-preview", { widget, dateRange });
