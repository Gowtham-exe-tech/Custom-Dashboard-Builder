import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { createDataConnection, getDataConnections, getDataConnectionById, deleteDataConnection} from "../controllers/dataConnectionController.js";


const router = express.Router();

// Register and list data connections.
router.route("/").get(asyncHandler(getDataConnections)).post(asyncHandler(createDataConnection));

// Read or delete one registration.
router.route("/:id").get(asyncHandler(getDataConnectionById)).delete(asyncHandler(deleteDataConnection));

export default router;