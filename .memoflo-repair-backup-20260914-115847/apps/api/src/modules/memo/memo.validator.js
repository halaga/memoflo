export function validateCreateMemo(data) {
  const required = [
    "title",
    "body",
    "businessService",
    "requestingSbu",
  ];

  for (const field of required) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }
}