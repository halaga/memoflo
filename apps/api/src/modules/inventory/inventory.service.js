import mongoose from "mongoose";
import Department from "../organization/department/department.model.js";
import Employee from "../employee/employee.model.js";
import InventoryItem from "./inventory.model.js";
import InventoryMovement from "./inventoryMovement.model.js";
import ProcurementRequest from "../procurement/procurement.model.js";
import Memo from "../memo/memo.model.js";

function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
const ALLOWED_FIELDS = ["name", "category", "description", "supplier", "purchaseReference", "condition", "minimumStock", "itemCode", "serialNumber", "quantity", "availableQuantity", "unit", "status", "ownerDepartment", "custodian", "location", "purchaseDate", "notes"];
function clean(payload = {}) { return Object.fromEntries(Object.entries(payload).filter(([key]) => ALLOWED_FIELDS.includes(key))); }
function validId(id, label) { if (!mongoose.isValidObjectId(id)) fail(`${label} is invalid.`); }
function movementNumber() { return `STK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }

class InventoryService {
  async validateReferences(companyId, payload) {
    if (payload.ownerDepartment) {
      validId(payload.ownerDepartment, "Owner department id");
      const department = await Department.findOne({ _id: payload.ownerDepartment, company: companyId, deletedAt: null }).select("_id");
      if (!department) fail("Owner department does not belong to this company.");
    }
    if (payload.referenceType === "Procurement" && !payload.referenceId) fail("Select the approved purchase request being received.");
    if (payload.referenceType === "Procurement" && payload.referenceId) {
      validId(payload.referenceId, "Procurement request id");
      const purchase = await ProcurementRequest.findOne({ _id: payload.referenceId, company: companyId, deletedAt: null }).select("_id requestNo status");
      if (!purchase) fail("The linked purchase request does not belong to this company.");
      if (!["Approved", "Completed"].includes(purchase.status)) fail("Goods can only be received against an approved purchase request.");
    }
    if (payload.referenceType === "Approval Memo" && payload.referenceId) {
      validId(payload.referenceId, "Approval Memo id");
      const memo = await Memo.findOne({ _id: payload.referenceId, company: companyId, memoType: "approval", deletedAt: null }).select("_id title status");
      if (!memo) fail("The linked Approval Memo does not belong to this company or is not an Approval Memo.");
      if (!["Approved", "Completed"].includes(memo.status)) fail("Goods can only be received against an approved Approval Memo.");
    }
    if (payload.custodian) {
      validId(payload.custodian, "Custodian id");
      const custodian = await Employee.findOne({ _id: payload.custodian, company: companyId, active: true, deletedAt: null }).select("_id");
      if (!custodian) fail("Custodian does not belong to this company.");
    }
    if (payload.quantity !== undefined && Number(payload.quantity) < 0) fail("Quantity cannot be negative.");
    if (payload.availableQuantity !== undefined && Number(payload.availableQuantity) < 0) fail("Available quantity cannot be negative.");
    if (payload.minimumStock !== undefined && Number(payload.minimumStock) < 0) fail("Minimum stock cannot be negative.");
    if (payload.quantity !== undefined && payload.availableQuantity !== undefined && Number(payload.availableQuantity) > Number(payload.quantity)) fail("Available quantity cannot exceed total quantity.");
  }
  async list(companyId, filters = {}) {
    const query = { company: companyId, active: true, isActive: true, deletedAt: null };
    if (filters.ownerDepartment) query.ownerDepartment = filters.ownerDepartment;
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    return InventoryItem.find(query).populate("ownerDepartment", "name").populate("custodian", "_id firstName lastName employeeNo email").sort({ category: 1, name: 1 }).lean();
  }
  async create(companyId, payload) {
    const data = clean(payload);
    if (!String(data.name || "").trim()) fail("Inventory item name is required.");
    await this.validateReferences(companyId, data);
    data.company = companyId;
    return InventoryItem.create(data);
  }
  async update(companyId, id, payload) {
    validId(id, "Inventory item id");
    const data = clean(payload);
    await this.validateReferences(companyId, data);
    const item = await InventoryItem.findOneAndUpdate({ _id: id, company: companyId, active: true, deletedAt: null }, data, { new: true, runValidators: true }).populate("ownerDepartment", "name").populate("custodian", "_id firstName lastName employeeNo email");
    if (!item) fail("Inventory item not found.", 404);
    return item;
  }
  async remove(companyId, id) {
    validId(id, "Inventory item id");
    const item = await InventoryItem.findOneAndUpdate({ _id: id, company: companyId, active: true, deletedAt: null }, { status: "Retired", availableQuantity: 0 }, { new: true });
    if (!item) fail("Inventory item not found.", 404);
    return item;
  }
  async movements(companyId, itemId, limit = 100) {
    const query = { company: companyId };
    if (itemId) { validId(itemId, "Inventory item id"); query.$or = [{ item: itemId }, { destinationItem: itemId }]; }
    return InventoryMovement.find(query).populate("item", "name itemCode").populate("destinationItem", "name itemCode").populate("performedBy", "firstName lastName").populate("custodian", "firstName lastName").sort({ occurredAt: -1 }).limit(Math.min(Math.max(Number(limit) || 100, 1), 500)).lean();
  }
  async recordMovement(companyId, actorId, payload) {
    const type = String(payload.movementType || "");
    const allowed = ["Stock In", "Stock Out", "Goods Receipt", "Return", "Stock Transfer", "Stock Adjustment", "Damaged", "Lost", "Custody"];
    if (!allowed.includes(type)) fail("Choose a valid stock movement type.");
    validId(payload.item, "Inventory item id");
    const quantity = Number(payload.quantity || 0);
    if (type !== "Stock Adjustment" && (!Number.isFinite(quantity) || quantity <= 0)) fail("Movement quantity must be greater than zero.");
    if (type === "Stock Adjustment" && (!Number.isFinite(quantity) || quantity === 0)) fail("Enter a non-zero adjustment quantity (positive or negative).");
    if (type === "Stock Transfer") validId(payload.destinationItem, "Destination item id");
    if (type === "Goods Receipt" && (!["Procurement", "Approval Memo"].includes(payload.referenceType) || !payload.referenceId)) fail("Goods Receipt must be linked to an approved purchase request or Approval Memo.");
    if (["Procurement", "Approval Memo"].includes(payload.referenceType) && !payload.referenceId) fail(`Select the approved ${payload.referenceType} being received.`);
    if (payload.referenceType === "Procurement" && payload.referenceId) {
      validId(payload.referenceId, "Procurement request id");
      const purchase = await ProcurementRequest.findOne({ _id: payload.referenceId, company: companyId, deletedAt: null }).select("_id requestNo status");
      if (!purchase) fail("The linked purchase request does not belong to this company.");
      if (!["Approved", "Completed"].includes(purchase.status)) fail("Goods can only be received against an approved purchase request.");
    }
    if (payload.referenceType === "Approval Memo" && payload.referenceId) {
      validId(payload.referenceId, "Approval Memo id");
      const memo = await Memo.findOne({ _id: payload.referenceId, company: companyId, memoType: "approval", deletedAt: null }).select("_id title status");
      if (!memo) fail("The linked Approval Memo does not belong to this company or is not an Approval Memo.");
      if (!["Approved", "Completed"].includes(memo.status)) fail("Goods can only be received against an approved Approval Memo.");
    }
    if (payload.custodian) {
      validId(payload.custodian, "Custodian id");
      const person = await Employee.findOne({ _id: payload.custodian, company: companyId, active: true, deletedAt: null }).select("_id");
      if (!person) fail("Custodian does not belong to this company.");
    }
    const session = await mongoose.startSession();
    let created;
    try {
      await session.withTransaction(async () => {
        const item = await InventoryItem.findOne({ _id: payload.item, company: companyId, active: true, deletedAt: null }).session(session);
        if (!item) fail("Inventory item not found.", 404);
        const before = { quantity: Number(item.quantity || 0), available: Number(item.availableQuantity || 0) };
        let destination = null;
        let destinationBefore = null;
        if (type === "Stock In" || type === "Goods Receipt") {
          item.quantity = before.quantity + quantity; item.availableQuantity = before.available + quantity;
        } else if (type === "Return") {
          if (before.available + quantity > before.quantity) fail("Return quantity exceeds the number of units currently issued.");
          item.availableQuantity = before.available + quantity;
          if (item.availableQuantity >= item.quantity) item.custodian = null;
        } else if (type === "Stock Out") {
          if (before.available < quantity) fail(`Only ${before.available} ${item.unit || "unit(s)"} are available to issue.`);
          item.availableQuantity = before.available - quantity;
          if (payload.custodian) item.custodian = payload.custodian;
        } else if (["Damaged", "Lost"].includes(type)) {
          if (before.available < quantity) fail(`Only ${before.available} ${item.unit || "unit(s)"} are available to remove.`);
          item.quantity = before.quantity - quantity; item.availableQuantity = before.available - quantity;
        } else if (type === "Stock Adjustment") {
          if (quantity < 0 && before.available < Math.abs(quantity)) fail("Adjustment would reduce stock below assigned quantity.");
          item.quantity = before.quantity + quantity; item.availableQuantity = before.available + quantity;
          if (item.quantity < 0) fail("Adjustment cannot make stock negative.");
        } else if (type === "Stock Transfer") {
          if (String(item._id) === String(payload.destinationItem)) fail("Source and destination items must be different records.");
          if (before.available < quantity) fail(`Only ${before.available} ${item.unit || "unit(s)"} are available to transfer.`);
          destination = await InventoryItem.findOne({ _id: payload.destinationItem, company: companyId, active: true, deletedAt: null }).session(session);
          if (!destination) fail("Destination inventory item not found in this company.", 404);
          destinationBefore = { quantity: Number(destination.quantity || 0), available: Number(destination.availableQuantity || 0) };
          if (String(item.unit || "unit").toLowerCase() !== String(destination.unit || "unit").toLowerCase()) fail("Source and destination items must use the same unit of measurement.");
          item.quantity -= quantity; item.availableQuantity -= quantity;
          destination.quantity = destinationBefore.quantity + quantity; destination.availableQuantity = destinationBefore.available + quantity;
          if (payload.toLocation) destination.location = String(payload.toLocation).trim();
          await destination.save({ session });
        } else if (type === "Custody") {
          if (!payload.custodian) fail("Choose the new custodian.");
          if (before.available < quantity) fail(`Only ${before.available} ${item.unit || "unit(s)"} are available to assign.`);
          item.availableQuantity = before.available - quantity;
          item.custodian = payload.custodian;
          item.status = "Assigned";
          if (payload.toLocation) item.location = String(payload.toLocation).trim();
        }
        if (type === "Damaged") item.condition = "Damaged";
        if (type === "Lost") item.condition = "Lost";
        if (type === "Return" && payload.custodian) item.custodian = payload.custodian;
        if (type === "Stock Transfer") {
          item.status = item.availableQuantity > 0 ? "Available" : "Assigned";
          destination.status = destination.availableQuantity > 0 ? "Available" : "Assigned";
        }
        if (type !== "Custody" && !["Stock Transfer"].includes(type)) item.status = item.availableQuantity <= 0 ? "Assigned" : item.availableQuantity < item.quantity ? "Assigned" : "Available";
        await item.save({ session });
        [created] = await InventoryMovement.create([{
          company: companyId, movementNo: movementNumber(), movementType: type, item: item._id,
          destinationItem: destination?._id || null, quantity: Math.abs(quantity), quantityBefore: before.quantity,
          quantityAfter: Number(item.quantity || 0), availableBefore: before.available, availableAfter: Number(item.availableQuantity || 0),
          fromLocation: String(payload.fromLocation || item.location || "").trim(), toLocation: String(payload.toLocation || destination?.location || item.location || "").trim(),
          custodian: payload.custodian || item.custodian || null, referenceType: String(payload.referenceType || "").trim(),
          referenceId: payload.referenceId || null, reference: String(payload.reference || "").trim(), notes: String(payload.notes || "").trim(),
          performedBy: actorId, occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
        }], { session });
      });
    } finally { await session.endSession(); }
    return created;
  }
}
export default new InventoryService();
