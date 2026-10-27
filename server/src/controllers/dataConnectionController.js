import mongoose from "mongoose";
import DataConnection from "../models/DataConnection.js";
import httpError from "../utils/httpError.js";

// Register the internal orders dataset as a data source.
export async function createDataConnection(req, res) {
  const { name, description = "" } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    throw httpError(400, "Data connection name is required");
  }

  const connection = new DataConnection({
    name: name.trim(),
    description,
    sourceType: "internal",
    dataset: "orders",
  });

  await connection.save();

  res.status(201).json({
    success: true,
    message: "Data connection created successfully",
    data: connection,
  });
}

// Return the registered data sources.
export async function getDataConnections(req, res) {
  const connections = await DataConnection.find()
    .sort({ name: 1 })
    .lean();

  res.status(200).json({
    success: true,
    count: connections.length,
    data: connections,
  });
}

// Return one data connection by its MongoDB ID.
export async function getDataConnectionById(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw httpError(400, "Invalid data connection ID");
  }

  const connection = await DataConnection.findById(id).lean();

  if (!connection) {
    throw httpError(404, "Data connection not found");
  }

  res.status(200).json({
    success: true,
    data: connection,
  });
}

// Delete a data connection registration.
// This does not delete the actual orders collection.
export async function deleteDataConnection(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw httpError(400, "Invalid data connection ID");
  }

  const connection = await DataConnection.findByIdAndDelete(id);

  if (!connection) {
    throw httpError(404, "Data connection not found");
  }

  res.status(200).json({
    success: true,
    message: "Data connection deleted successfully",
    data: {
      id: connection._id,
    },
  });
}