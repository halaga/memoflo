export function validateCreateBusinessService(
  payload
) {
  if (!payload.name) {
    throw new Error(
      "Business service name is required"
    );
  }

  if (!payload.slug) {
    throw new Error(
      "Business service slug is required"
    );
  }

  if (!payload.category) {
    throw new Error(
      "Business service category is required"
    );
  }

  if (!payload.ownerDepartment) {
    throw new Error(
      "Owner department is required"
    );
  }
}