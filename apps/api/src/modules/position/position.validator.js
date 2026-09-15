import mongoose from "mongoose";

const RELATION_FIELDS = ["sbu", "department", "designation"];

export function validateCreatePosition(data) {
  const required = ["company", ...RELATION_FIELDS, "title"];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      const error = new Error(`${field} is required`);
      error.status = 400;
      throw error;
    }
  }

  for (const field of RELATION_FIELDS) {
    if (!mongoose.isValidObjectId(data[field])) {
      const error = new Error(`${field} must be a valid id`);
      error.status = 400;
      throw error;
    }
  }

  if (data.reportsTo && !mongoose.isValidObjectId(data.reportsTo)) {
    const error = new Error("reportsTo must be a valid id");
    error.status = 400;
    throw error;
  }
}

export function cleanPositionPayload(payload = {}) {
  const allowed = [
    "sbu",
    "department",
    "designation",
    "title",
    "code",
    "reportsTo",
    "isWorkflowNode",
  ];

  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      data[key] = payload[key];
    }
  }

  for (const field of RELATION_FIELDS) {
    if (data[field] === "") {
      delete data[field];
    }
  }

  if (data.reportsTo === "") data.reportsTo = null;
  if (typeof data.title === "string") data.title = data.title.trim();
  if (typeof data.code === "string") data.code = data.code.trim().toUpperCase();

  for (const field of RELATION_FIELDS) {
    if (data[field] !== undefined && !mongoose.isValidObjectId(data[field])) {
      const error = new Error(`${field} must be a valid id`);
      error.status = 400;
      throw error;
    }
  }

  if (data.reportsTo !== null && data.reportsTo !== undefined &&
      !mongoose.isValidObjectId(data.reportsTo)) {
    const error = new Error("reportsTo must be a valid id");
    error.status = 400;
    throw error;
  }

  return data;
}
