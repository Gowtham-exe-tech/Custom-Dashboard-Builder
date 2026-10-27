import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      maxlength: [120, "First name cannot exceed 120 characters"],
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [120, "Last name cannot exceed 120 characters"],
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: [40, "Phone number cannot exceed 40 characters"],
      default: "",
    },
    streetAddress: {
      type: String,
      trim: true,
      maxlength: [250, "Street address cannot exceed 250 characters"],
      default: "",
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
      default: "",
    },
    stateProvince: {
      type: String,
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [30, "Postal code cannot exceed 30 characters"],
      default: "",
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, "Country cannot exceed 100 characters"],
      default: "",
    },
    createdBy: {
      type: String,
      trim: true,
      maxlength: [120, "Created by cannot exceed 120 characters"],
      default: "",
    },
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      trim: true,
      unique: true,
      maxlength: [40, "Order number cannot exceed 40 characters"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [120, "Customer name cannot exceed 120 characters"],
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      default: "",
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [160, "Product name cannot exceed 160 characters"],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
      default: 0,
    },
    total: {
      type: Number,
      min: [0, "Total cannot be negative"],
    },
    status: {
      type: String,
      enum: ["Pending", "In progress", "Completed"],
      default: "Pending",
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },
  },
  { timestamps: true, versionKey: false },
);

// Calculate the total consistently whenever an order is created or updated.
orderSchema.pre("validate", function () {
  if (Number.isFinite(this.quantity) && Number.isFinite(this.unitPrice)) {
    this.total = Math.round(this.quantity * this.unitPrice * 100) / 100;
  }
});

// Add indexes for commonly searched fields
orderSchema.index({ orderDate: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ customerName: 1 });
orderSchema.index({ productName: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
