export function validateCreateMemo(data) {
  for (const field of ["title", "body"]) {
    if (!String(data[field] || "").trim()) throw new Error(`${field} is required`);
  }

  const memoType = data.memoType || "simple";
  if (memoType !== "simple" && !String(data.businessService || "").trim()) {
    throw new Error("businessService is required for workflow memos");
  }

  const recipients = Array.isArray(data.recipients) ? data.recipients.filter(Boolean) : [];
  if (memoType === "simple" && recipients.length < 1) {
    throw new Error("At least one recipient is required for a simple memo");
  }
}
