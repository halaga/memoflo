export function validateCreateMemo(data) {
  const requestingSbu = data.requestingSbu || data.requestingSBU;

  const required = [
    ["title", data.title],
    ["body", data.body],
    ["businessService", data.businessService],
    ["requestingSbu", requestingSbu],
  ];

  for (const [field, value] of required) {
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new Error(`${field} is required`);
    }
  }

  data.requestingSbu = requestingSbu;
  delete data.requestingSBU;
}
