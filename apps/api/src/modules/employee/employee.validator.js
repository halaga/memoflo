export function validateCreateEmployee(data) {
  const required = [
    "company",
    "firstName",
    "lastName",
    "email",
    "password",
  ];

  for (const field of required) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(data.email)) {
    throw new Error("Invalid email address");
  }

  if (data.password.length < 6) {
    throw new Error(
      "Password must be at least 6 characters"
    );
  }
}