import mongoose from "mongoose";
import Department from "../organization/department/department.model.js";
import Employee from "../employee/employee.model.js";
import InventoryItem from "./inventory.model.js";

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

const ALLOWED_FIELDS = [
  "name", "category", "itemCode", "serialNumber", "quantity",
  "availableQuantity", "unit", "status", "ownerDepartment",
  "custodian", "location", "purchaseDate", "notes",
];

function clean(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => ALLOWED_FIELDS.includes(key))
  );
}

class InventoryService {
  async validateReferences(companyId, payload) {
    if (payload.ownerDepartment) {
      if (!mongoose.isValidObjectId(payload.ownerDepartment)) fail("Owner department id is invalid.");
      const department = await Department.findOne({
        _id: payload.ownerDepartment,
        company: companyId,
        deletedAt: null,
      }).select("_id");
      if (!department) fail("Owner department does not belong to this company.");
    }

    if (payload.custodian) {
      if (!mongoose.isValidObjectId(payload.custodian)) fail("Custodian id is invalid.");
      const custodian = await Employee.findOne({
        _id: payload.custodian,
        company: companyId,
        active: true,
        deletedAt: null,
      }).select("_id");
      if (!custodian) fail("Custodian does not belong to this company.");
    }

    const quantity = payload.quantity;
    const availableQuantity = payload.availableQuantity;
    if (quantity !== undefined && Number(quantity) < 0) fail("Quantity cannot be negative.");
    if (availableQuantity !== undefined && Number(availableQuantity) < 0) fail("Available quantity cannot be negative.");
    if (quantity !== undefined && availableQuantity !== undefined && Number(availableQuantity) > Number(quantity)) {
      fail("Available quantity cannot exceed total quantity.");
    }
  }

  async list(companyId, filters = {}) {
    const query = { company: companyId, active: true, isActive: true, deletedAt: null };
    if (filters.ownerDepartment) query.ownerDepartment = filters.ownerDepartment;
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    return InventoryItem.find(query)
      .populate("ownerDepartment", "name")
      .populate("custodian", "_id firstName lastName employeeNo email")
      .sort({ category: 1, name: 1 })
      .lean();
  }

  async create(companyId, payload) {
    const data = clean(payload);
    if (!String(data.name || "").trim()) fail("Inventory item name is required.");
    await this.validateReferences(companyId, data);
    data.company = companyId;
    return InventoryItem.create(data);
  }

  async update(companyId, id, payload) {
    if (!mongoose.isValidObjectId(id)) fail("Inventory item id is invalid.");
    const data = clean(payload);
    await this.validateReferences(companyId, data);
    const item = await InventoryItem.findOneAndUpdate(
      { _id: id, company: companyId, active: true, deletedAt: null },
      data,
      { new: true, runValidators: true }
    )
      .populate("ownerDepartment", "name")
      .populate("custodian", "_id firstName lastName employeeNo email");
    if (!item) fail("Inventory item not found.", 404);
    return item;
  }

  async remove(companyId, id) {
    if (!mongoose.isValidObjectId(id)) fail("Inventory item id is invalid.");
    const item = await InventoryItem.findOneAndUpdate(
      { _id: id, company: companyId, active: true, deletedAt: null },
      { status: "Retired", availableQuantity: 0 },
      { new: true }
    );
    if (!item) fail("Inventory item not found.", 404);
    return item;
  }
}

export default new InventoryService();
