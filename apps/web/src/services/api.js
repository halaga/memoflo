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
    // Empty response
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

export const api = {
  // AUTH
  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request("/auth/me");
  },

  // MEMOS
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

  // WORKFLOWS
  listWorkflows() {
    return request("/workflow");
  },

  getWorkflow(id) {
    return request(`/workflow/${id}`);
  },

  getWorkflowInstance(instanceId) {
    return request(`/workflow/instances/${instanceId}`);
  },

  startWorkflow(workflowId, resourceType, resourceId) {
    return request(`/workflow/${workflowId}/start`, {
      method: "POST",
      body: JSON.stringify({
        resourceType,
        resourceId,
      }),
    });
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

  resubmitWorkflow(instanceId) {
    return request(`/workflow/instances/${instanceId}/resubmit`, {
      method: "POST",
    });
  },

  // ADMIN / ORGANIZATION
  listEmployees() {
    return request("/employees");
  },

  listPositions() {
    return request("/positions");
  },

  listDepartments() {
    return request("/departments");
  },

  listDesignations() {
    return request("/designations");
  },

  listBusinessServices() {
    return request("/business-services");
  },

  // COMMENTS
  listMemoComments(memoId) {
    return request(`/memo-comments/${memoId}`);
  },

  addMemoComment(memoId, body) {
    return request(`/memo-comments/${memoId}`, {
      method: "POST",
      body: JSON.stringify({ body }),
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
      localStorage.getItem("memoflo_employee")
    );
  } catch {
    return null;
  }
}