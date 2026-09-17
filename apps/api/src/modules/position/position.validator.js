import mongoose from "mongoose";

const RELATION_FIELDS = [
  "sbu",
  "department",
  "designation",
];

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function validateCreatePosition(data) {
  const requiredFields = [
    "company",
    ...RELATION_FIELDS,
    "title",
  ];

  for (const field of requiredFields) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      throw validationError(`${field} is required`);
    }
  }

  for (const field of RELATION_FIELDS) {
    if (!mongoose.isValidObjectId(data[field])) {
      throw validationError(`${field} must be a valid id`);
    }
  }

  if (
    data.reportsTo &&
    !mongoose.isValidObjectId(data.reportsTo)
  ) {
    throw validationError("reportsTo must be a valid id");
  }
}

export function cleanPositionPayload(payload = {}) {
  const allowedFields = [
    "sbu",
    "department",
    "designation",
    "title",
    "code",
    "reportsTo",
    "isWorkflowNode",
  ];

  const data = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      data[field] = payload[field];
    }
  }

  for (const field of RELATION_FIELDS) {
    if (data[field] === "") {
      delete data[field];
    }
  }

  if (data.reportsTo === "") {
    data.reportsTo = null;
  }

  if (typeof data.title === "string") {
    data.title = data.title.trim();
  }

  if (typeof data.code === "string") {
    data.code = data.code.trim().toUpperCase();
  }

  for (const field of RELATION_FIELDS) {
    if (
      data[field] !== undefined &&
      !mongoose.isValidObjectId(data[field])
    ) {
      throw validationError(`${field} must be a valid id`);
    }
  }

  if (
    data.reportsTo !== null &&
    data.reportsTo !== undefined &&
    !mongoose.isValidObjectId(data.reportsTo)
  ) {
    throw validationError("reportsTo must be a valid id");
  }

  return data;
}
