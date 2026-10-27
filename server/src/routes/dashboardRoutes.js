import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createDashboard,
  getDashboards,
  getDashboardById,
  getDefaultDashboard,
  updateDashboard,
  setDefaultDashboard,
  deleteDashboard,
} from "../controllers/dashboardController.js";

const router = express.Router();

// Create a dashboard
router.post("/", asyncHandler(createDashboard));

// Get all dashboards
router.get("/", asyncHandler(getDashboards));

// Get the default dashboard
router.get("/default", asyncHandler(getDefaultDashboard));

// Set a dashboard as the default
router.put(
  "/:dashboardId/default",
  asyncHandler(setDefaultDashboard)
);

// Get one dashboard
router.get("/:dashboardId", asyncHandler(getDashboardById));

router.put("/:dashboardId", asyncHandler(updateDashboard));
router.delete("/:dashboardId", asyncHandler(deleteDashboard));

export default router;