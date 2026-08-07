export function validateCreatePosition(data) {
  const required = [
    "company",
    "sbu",
    "department",
    "designation",
    "title",
  ];

  for (const field of required) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }
}