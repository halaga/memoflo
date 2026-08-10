export function validateCreateDesignation(data) {
  const required = [
    "title",
    "department",
    "sbu",
  ];

  for (const field of required) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }
}