export function validateCreateDesignation(data) {
  if (!data.title) {
    throw new Error("title is required");
  }
}