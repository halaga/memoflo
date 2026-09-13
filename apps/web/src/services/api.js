const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() { return localStorage.getItem("memoflo_token"); }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let result = {};
  try { result = await response.json(); } catch {}

  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new CustomEvent("memoflo:unauthorized"));
  }

  if (!response.ok) {
    throw new Error(result?.message || result?.error || `Request failed (${response.status})`);
  }
  return result;
}

function normalizeList(result, keys = []) {
  if (Array.isArray(result)) return result;
  for (const key of keys) if (Array.isArray(result?.[key])) return result[key];
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

export const api = {
  login(email, password) {
    return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  me() { return request("/auth/me"); },

  listRoles() { return request("/roles"); },
  listPermissions() { return request("/roles/permissions"); },
  getRole(id) { return request(`/roles/${id}`); },
  createRole(data) { return request("/roles", { method: "POST", body: JSON.stringify(data) }); },
  updateRole(id, data) { return request(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(data) }); },
  deleteRole(id) { return request(`/roles/${id}`, { method: "DELETE" }); },
  assignEmployeeRole(roleId, employeeId) { return request(`/roles/${roleId}/assign/${employeeId}`, { method: "PATCH" }); },

  listEmployees() { return request("/employees"); },
  listPositions() { return request("/positions"); },
  listDepartments() { return request("/departments"); },
  listDesignations() { return request("/designations"); },
  listSBUs() { return request("/sbus"); },
  listBusinessServices() { return request("/business-services"); },

  listMemos() { return request("/memos"); },
  getMemo(id) { return request(`/memos/${id}`); },
  createMemo(payload) { return request("/memos", { method: "POST", body: JSON.stringify(payload) }); },
  updateMemo(id, payload) { return request(`/memos/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); },

  listWorkflows() { return request("/workflow"); },
  getWorkflow(id) { return request(`/workflow/${id}`); },
  createWorkflow(payload) { return request("/workflow", { method: "POST", body: JSON.stringify(payload) }); },
  updateWorkflow(id, payload) { return request(`/workflow/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); },
  deleteWorkflow(id) { return request(`/workflow/${id}`, { method: "DELETE" }); },
  addWorkflowStep(workflowId, payload) { return request(`/workflow/${workflowId}/steps`, { method: "POST", body: JSON.stringify(payload) }); },
  updateWorkflowStep(workflowId, stepId, payload) { return request(`/workflow/${workflowId}/steps/${stepId}`, { method: "PATCH", body: JSON.stringify(payload) }); },
  reactivateWorkflowStep(workflowId, stepId, payload = {}) { return request(`/workflow/${workflowId}/steps/${stepId}/reactivate`, { method: "PATCH", body: JSON.stringify(payload) }); },
  deleteWorkflowStep(workflowId, stepId) { return request(`/workflow/${workflowId}/steps/${stepId}`, { method: "DELETE" }); },
  resolvePosition(positionId) { return request(`/workflow/resolve-position/${positionId}`); },
  startWorkflow(workflowId, resourceType, resourceId) { return request(`/workflow/${workflowId}/start`, { method: "POST", body: JSON.stringify({ resourceType, resourceId }) }); },
  getWorkflowInstance(instanceId) { return request(`/workflow/instances/${instanceId}`); },
  getCurrentWorkflowStep(instanceId) { return request(`/workflow/instances/${instanceId}/current-step`); },
  advanceWorkflow(instanceId) { return request(`/workflow/instances/${instanceId}/advance`, { method: "POST" }); },
  rejectWorkflow(instanceId) { return request(`/workflow/instances/${instanceId}/reject`, { method: "POST" }); },
  cancelWorkflow(instanceId) { return request(`/workflow/instances/${instanceId}/cancel`, { method: "POST" }); },
  resubmitWorkflow(instanceId) { return request(`/workflow/instances/${instanceId}/resubmit`, { method: "POST" }); },
};

export { normalizeList };

export function saveSession(result) {
  if (result?.token) localStorage.setItem("memoflo_token", result.token);
  if (result?.employee) localStorage.setItem("memoflo_employee", JSON.stringify(result.employee));
}

export function clearSession() {
  localStorage.removeItem("memoflo_token");
  localStorage.removeItem("memoflo_employee");
}

export function getSavedEmployee() {
  try { return JSON.parse(localStorage.getItem("memoflo_employee") || "null"); }
  catch { return null; }
}
