import express from "express";
import { listOrders, createOrder, getOrder, updateOrder, deleteOrder} from "../controllers/orderController.js";


const router = express.Router();

// Routes for the complete orders collection
router.route("/").get(listOrders).post(createOrder);

// Routes for one order
router.route("/:id").get(getOrder).put(updateOrder).delete(deleteOrder);

export default router;