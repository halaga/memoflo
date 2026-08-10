export function validateCreateDepartment(data) {
  const required = [
    "sbu",
    "name",
    "code",
  ];

  for (const field of required) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }
}