import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { getSingleWidgetData, getAllWidgetData, previewWidgetData } from "../controllers/widgetDataController.js";

const router = express.Router();

// Get calculated data for one widget
router.get(
  "/dashboards/:dashboardId/widgets/:widgetId/data",
  asyncHandler(getSingleWidgetData)
);

// Get calculated data for every widget in a dashboard
router.get(
  "/dashboards/:dashboardId/widgets/data",
  asyncHandler(getAllWidgetData)
);

// Get calculated data for an unsaved widget (configuration page preview)
router.post("/dashboards/widget-preview", asyncHandler(previewWidgetData));

export default router;
