const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export function validateCreateEmployee(data) {
  const requiredFields = ["firstName", "lastName", "email"];

  for (const field of requiredFields) {
    if (!String(data[field] || "").trim()) {
      const error = new Error(`${field} is required`);
      error.status = 400;
      throw error;
    }
  }

  if (!EMAIL_PATTERN.test(String(data.email).trim())) {
    const error = new Error("Invalid email address");
    error.status = 400;
    throw error;
  }

  if (data.password && data.password.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.status = 400;
    throw error;
  }
}
