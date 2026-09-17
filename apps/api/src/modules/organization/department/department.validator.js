export function validateCreateDepartment(data) {
  const requiredFields = ["sbu", "name", "code"];

  for (const field of requiredFields) {
    if (!String(data[field] || "").trim()) {
      const error = new Error(`${field} is required`);
      error.status = 400;
      throw error;
    }
  }
}
