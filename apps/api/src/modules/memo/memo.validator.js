export function validateCreateMemo(data) {
  for (const field of ["title", "body", "businessService"]) {
    if (!data[field]) throw new Error(`${field} is required`);
  }

  const memoType = data.memoType || "simple";
  if (!["simple", "approval", "request"].includes(memoType)) throw new Error("Invalid memo type");
  if (memoType === "simple" && !data.recipient) throw new Error("recipient is required for a simple memo");
  if ((memoType === "approval" || memoType === "request") && !data.requestingSbu) throw new Error("requestingSbu is required for this memo type");
}
