export function validateCreateDesignation(data) {
  const requiredFields = ["title", "department", "sbu"];

  for (const field of requiredFields) {
    if (!String(data[field] || "").trim()) {
      const error = new Error(`${field} is required`);
      error.status = 400;
      throw error;
    }
  }
}
