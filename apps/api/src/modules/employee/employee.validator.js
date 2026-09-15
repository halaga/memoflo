export function validateCreateEmployee(data) {
  const required = ["firstName", "lastName", "email"];
  for (const field of required) {
    if (!data[field]) throw new Error(`${field} is required`);
  }

  if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    throw new Error("Invalid email address");
  }

  if (data.password && data.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
}
