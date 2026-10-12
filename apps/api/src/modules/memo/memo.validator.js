function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function validateCreateMemo(data) {
  if (!String(data.title || "").trim()) throw validationError("title is required");
  if (!String(data.body || "").trim()) throw validationError("body is required");

  const memoType = data.memoType || "simple";
  if (!["simple", "approval", "request"].includes(memoType)) {
    throw validationError("Invalid memo type");
  }

  if (memoType === "simple") {
    const recipients = Array.isArray(data.recipients) ? data.recipients : [];
    if (!recipients.length && !data.recipient) {
      throw validationError("Select at least one recipient for a simple memo");
    }
    return;
  }

  if (!data.businessService) throw validationError("businessService is required for approval and request memos");
  if (!data.requestingSbu && !data.requestingSBU) {
    throw validationError("requestingSbu is required for this memo type");
  }
}
