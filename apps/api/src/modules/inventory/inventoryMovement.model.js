import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const inventoryMovementSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  movementNo: { type: String, required: true, trim: true },
  movementType: { type: String, enum: ["Stock In", "Stock Out", "Goods Receipt", "Return", "Stock Transfer", "Stock Adjustment", "Damaged", "Lost", "Custody"], required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
  destinationItem: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", default: null },
  quantity: { type: Number, min: 0, default: 0 },
  quantityBefore: { type: Number, default: 0 },
  quantityAfter: { type: Number, default: 0 },
  availableBefore: { type: Number, default: 0 },
  availableAfter: { type: Number, default: 0 },
  fromLocation: { type: String, default: "" },
  toLocation: { type: String, default: "" },
  custodian: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  referenceType: { type: String, default: "", trim: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  reference: { type: String, default: "", trim: true },
  notes: { type: String, default: "", trim: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  occurredAt: { type: Date, default: Date.now },
  ...BaseSchema,
}, { timestamps: true });
inventoryMovementSchema.index({ company: 1, movementNo: 1 }, { unique: true });
inventoryMovementSchema.index({ company: 1, item: 1, occurredAt: -1 });
export default mongoose.model("InventoryMovement", inventoryMovementSchema);
