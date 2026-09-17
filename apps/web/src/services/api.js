const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("memoflo_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new CustomEvent("memoflo:unauthorized"));
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error ||
        `Request failed (${response.status})`
    );
  }

  return result;
}

export function normalizeList(result, keys = []) {
  if (Array.isArray(result)) {
    return result;
  }

  for (const key of keys) {
    if (Array.isArray(result?.[key])) {
      return result[key];
    }
  }

  return Array.isArray(result?.data) ? result.data : [];
}

export function tenantSlug() {
  const host = window.location.hostname.toLowerCase();

  if (host.endsWith(".memoflo.com") || host.endsWith(".localhost")) {
    return host.split(".")[0];
  }

  return null;
}

export const api = {
  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        companySlug: tenantSlug(),
      }),
    });
  },

  me() {
    return request("/auth/me");
  },

  getTenant(slug) {
    return request(`/company/public/${encodeURIComponent(slug)}`);
  },

  getCompanyWorkspace() {
    return request("/company/workspace");
  },

  updateCompanyModules(modules) {
    return request("/company/modules", {
      method: "PATCH",
      body: JSON.stringify({ modules }),
    });
  },

  updateCompanyBranding(branding) {
    return request("/company/branding", {
      method: "PATCH",
      body: JSON.stringify({ branding }),
    });
  },

  listRoles() {
    return request("/roles");
  },

  listPermissions() {
    return request("/roles/permissions");
  },

  getRole(id) {
    return request(`/roles/${id}`);
  },

  createRole(data) {
    return request("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateRole(id, data) {
    return request(`/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteRole(id) {
    return request(`/roles/${id}`, {
      method: "DELETE",
    });
  },

  assignEmployeeRole(roleId, employeeId) {
    return request(`/roles/${roleId}/assign/${employeeId}`, {
      method: "PATCH",
    });
  },

  listEmployees() {
    return request("/employees");
  },

  createEmployee(data) {
    return request("/employees", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateEmployee(id, data) {
    return request(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  resetEmployeePassword(id, password = null) {
    return request(`/employees/${id}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify(password ? { password } : {}),
    });
  },

  deactivateEmployee(id) {
    return request(`/employees/${id}`, {
      method: "DELETE",
    });
  },

  listPositions() {
    return request("/positions");
  },

  createPosition(data) {
    return request("/positions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updatePosition(id, data) {
    return request(`/positions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deletePosition(id) {
    return request(`/positions/${id}`, {
      method: "DELETE",
    });
  },

  listDepartments() {
    return request("/departments");
  },

  createDepartment(data) {
    return request("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateDepartment(id, data) {
    return request(`/departments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteDepartment(id) {
    return request(`/departments/${id}`, {
      method: "DELETE",
    });
  },

  listDesignations() {
    return request("/designations");
  },

  createDesignation(data) {
    return request("/designations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateDesignation(id, data) {
    return request(`/designations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteDesignation(id) {
    return request(`/designations/${id}`, {
      method: "DELETE",
    });
  },

  listSBUs() {
    return request("/sbus");
  },

  createSBU(data) {
    return request("/sbus", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateSBU(id, data) {
    return request(`/sbus/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteSBU(id) {
    return request(`/sbus/${id}`, {
      method: "DELETE",
    });
  },

  listBusinessServices() {
    return request("/business-services");
  },

  listMemos() {
    return request("/memos");
  },

  getMemo(id) {
    return request(`/memos/${id}`);
  },

  createMemo(payload) {
    return request("/memos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateMemo(id, payload) {
    return request(`/memos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  listWorkflows() {
    return request("/workflow");
  },

  getWorkflow(id) {
    return request(`/workflow/${id}`);
  },

  createWorkflow(payload) {
    return request("/workflow", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateWorkflow(id, payload) {
    return request(`/workflow/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteWorkflow(id) {
    return request(`/workflow/${id}`, {
      method: "DELETE",
    });
  },

  addWorkflowStep(id, payload) {
    return request(`/workflow/${id}/steps`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateWorkflowStep(workflowId, stepId, payload) {
    return request(`/workflow/${workflowId}/steps/${stepId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteWorkflowStep(workflowId, stepId) {
    return request(`/workflow/${workflowId}/steps/${stepId}`, {
      method: "DELETE",
    });
  },

  reactivateWorkflowStep(workflowId, stepId, payload = {}) {
    return request(
      `/workflow/${workflowId}/steps/${stepId}/reactivate`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  },

  resolvePosition(id) {
    return request(`/workflow/resolve-position/${id}`);
  },

  startWorkflow(workflowId, resourceType, resourceId) {
    return request(`/workflow/${workflowId}/start`, {
      method: "POST",
      body: JSON.stringify({ resourceType, resourceId }),
    });
  },

  getWorkflowInstance(instanceId) {
    return request(`/workflow/instances/${instanceId}`);
  },

  getCurrentWorkflowStep(instanceId) {
    return request(`/workflow/instances/${instanceId}/current-step`);
  },

  advanceWorkflow(instanceId) {
    return request(`/workflow/instances/${instanceId}/advance`, {
      method: "POST",
    });
  },

  rejectWorkflow(instanceId) {
    return request(`/workflow/instances/${instanceId}/reject`, {
      method: "POST",
    });
  },

  cancelWorkflow(instanceId) {
    return request(`/workflow/instances/${instanceId}/cancel`, {
      method: "POST",
    });
  },

  resubmitWorkflow(instanceId) {
    return request(`/workflow/instances/${instanceId}/resubmit`, {
      method: "POST",
    });
  },

  listNotifications() {
    return request("/notifications");
  },

  markNotificationRead(id) {
    return request(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllNotificationsRead() {
    return request("/notifications/read-all", {
      method: "PATCH",
    });
  },
};

export function saveSession(result) {
  if (result?.token) {
    localStorage.setItem("memoflo_token", result.token);
  }

  if (result?.employee) {
    localStorage.setItem(
      "memoflo_employee",
      JSON.stringify(result.employee)
    );
  }
}

export function clearSession() {
  localStorage.removeItem("memoflo_token");
  localStorage.removeItem("memoflo_employee");
}

export function getSavedEmployee() {
  try {
    return JSON.parse(
      localStorage.getItem("memoflo_employee") || "null"
    );
  } catch {
    return null;
  }
}
