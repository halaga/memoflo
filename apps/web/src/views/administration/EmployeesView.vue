<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";

const employees = ref([]);
const roles = ref([]);
const positions = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");
const showForm = ref(false);
const credentials = ref(null);
const editingId = ref(null);
const formSection = ref(null);

const form = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  position: "",
  createLogin: true,
  password: "",
});

const canCreate = computed(() => {
  try {
    const employee = JSON.parse(localStorage.getItem("memoflo_employee") || "null");
    return employee?.role?.permissions?.includes("*") || employee?.role?.permissions?.includes("employees.create");
  } catch { return false; }
});

function resetForm() {
  editingId.value = null;
  form.value = { firstName: "", lastName: "", email: "", phone: "", role: "", position: "", createLogin: true, password: "" };
}

async function load() {
  loading.value = true; error.value = "";
  try {
    const [e, r, p] = await Promise.all([api.listEmployees(), api.listRoles(), api.listPositions()]);
    employees.value = normalizeList(e);
    roles.value = normalizeList(r);
    positions.value = normalizeList(p);
  } catch (err) { error.value = err.message || "Unable to load employees."; }
  finally { loading.value = false; }
}

async function openCreate() { resetForm(); credentials.value = null; success.value = ""; showForm.value = true; await nextTick(); formSection.value?.scrollIntoView({ behavior: "smooth", block: "start" }); }
async function openEdit(employee) {
  editingId.value = employee._id;
  credentials.value = null;
  success.value = "";
  form.value = {
    firstName: employee.firstName || "",
    lastName: employee.lastName || "",
    email: employee.email || "",
    phone: employee.phone || "",
    role: employee.role?._id || "",
    position: employee.position?._id || "",
    createLogin: employee.loginEnabled !== false,
    password: "",
  };
  showForm.value = true;
  await nextTick();
  formSection.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function save() {
  if (!form.value.firstName || !form.value.lastName || !form.value.email) {
    error.value = "First name, last name and email are required."; return;
  }
  saving.value = true; error.value = ""; success.value = ""; credentials.value = null;
  try {
    const payload = { ...form.value, role: form.value.role || null, position: form.value.position || null };
    if (editingId.value) {
      delete payload.createLogin;
      delete payload.password;
      const result = await api.updateEmployee(editingId.value, payload);
      success.value = `${result?.data?.firstName || "Employee"} updated successfully.`;
    } else {
      const result = await api.createEmployee(payload);
      credentials.value = {
        name: `${result?.data?.firstName || ""} ${result?.data?.lastName || ""}`.trim(),
        email: result?.data?.email,
        employeeNo: result?.data?.employeeNo,
        password: result?.temporaryPassword,
      };
      success.value = "Employee created successfully.";
      resetForm();
    }
    await load();
    if (editingId.value) showForm.value = false;
  } catch (err) { error.value = err.message || "Unable to save employee."; }
  finally { saving.value = false; }
}

async function resetPassword(employee) {
  if (!confirm(`Generate a new login password for ${employee.firstName} ${employee.lastName}?`)) return;
  error.value = ""; success.value = "";
  try {
    const result = await api.resetEmployeePassword(employee._id);
    credentials.value = { name: `${employee.firstName} ${employee.lastName}`, email: employee.email, employeeNo: employee.employeeNo, password: result.temporaryPassword };
    success.value = "New temporary password generated. Give it to the employee securely.";
    await load();
  } catch (err) { error.value = err.message || "Unable to reset password."; }
}

async function deactivate(employee) {
  if (!confirm(`Deactivate ${employee.firstName} ${employee.lastName}? They will no longer be able to sign in.`)) return;
  try { await api.deactivateEmployee(employee._id); success.value = "Employee account deactivated."; await load(); }
  catch (err) { error.value = err.message || "Unable to deactivate employee."; }
}

function positionLabel(position) {
  if (!position) return "Unassigned";
  return `${position.title}${position.department?.name ? ` · ${position.department.name}` : ""}`;
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <span class="page-kicker">PEOPLE & ACCESS</span>
        <h1>Employees</h1>
        <p>Set up people, assign their position and role, and create their MemoFlo login.</p>
      </div>
      <button v-if="canCreate" class="btn btn-primary" type="button" @click="openCreate">+ Add employee</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <section v-if="credentials" class="card credential-card">
      <div>
        <span class="page-kicker">LOGIN CREDENTIALS</span>
        <h2>Give these credentials to {{ credentials.name }}</h2>
        <p>This temporary password is shown once here. Share it securely and ask the employee to change it later.</p>
      </div>
      <div class="credential-grid">
        <div><span>Employee no.</span><strong>{{ credentials.employeeNo }}</strong></div>
        <div><span>Email</span><strong>{{ credentials.email }}</strong></div>
        <div><span>Temporary password</span><strong class="credential-password">{{ credentials.password || "Login disabled" }}</strong></div>
      </div>
      <button class="btn btn-secondary" type="button" @click="credentials=null">Dismiss</button>
    </section>

    <section v-if="showForm" ref="formSection" class="card employee-form-card">
      <div class="builder-title">
        <div>
          <span class="page-kicker">
            {{ editingId ? "EDIT EMPLOYEE" : "NEW EMPLOYEE" }}
          </span>
          <h2>{{ editingId ? "Update employee" : "Add employee" }}</h2>
          <p>
            Position and role determine where this person sits in the
            company and what they can do.
          </p>
        </div>
        <button class="btn btn-secondary" type="button" @click="showForm=false">Close</button>
      </div>
      <div class="form-row">
        <label>First name<input v-model="form.firstName" class="input" /></label>
        <label>Last name<input v-model="form.lastName" class="input" /></label>
      </div>
      <div class="form-row">
        <label>Email / login<input v-model="form.email" class="input" type="email" /></label>
        <label>Phone<input v-model="form.phone" class="input" /></label>
      </div>
      <div class="form-row">
        <label>
          Role
          <select v-model="form.role" class="input">
            <option value="">No role</option>
            <option
              v-for="role in roles"
              :key="role._id"
              :value="role._id"
            >
              {{ role.name }}
            </option>
          </select>
        </label>
        <label>
          Position
          <select v-model="form.position" class="input">
            <option value="">Unassigned</option>
            <option
              v-for="position in positions"
              :key="position._id"
              :value="position._id"
              :disabled="
                position.occupant &&
                position.occupant._id !== editingId
              "
            >
              {{ positionLabel(position) }}
              {{
                position.occupant &&
                position.occupant._id !== editingId
                  ? " · occupied"
                  : ""
              }}
            </option>
          </select>
        </label>
      </div>
      <div v-if="!editingId" class="login-setup">
        <label class="check-label"><input v-model="form.createLogin" type="checkbox" /> Create login account</label>
        <label v-if="form.createLogin">Temporary password <input v-model="form.password" class="input" placeholder="Leave blank to generate securely" /></label>
      </div>
      <div class="form-actions">
        <button
          class="btn btn-primary"
          type="button"
          :disabled="saving"
          @click="save"
        >
          {{
            saving
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Create employee"
          }}
        </button>
      </div>
    </section>

    <section class="card">
      <div class="builder-title">
        <div>
          <h2>Company employees</h2>
          <p>Active people in this MemoFlo tenant.</p>
        </div>
        <span class="count-pill">{{ employees.length }}</span>
      </div>
      <div v-if="loading" class="empty-state">Loading employees…</div>
      <div v-else-if="!employees.length" class="empty-state">
        <div class="module-tile-icon">♙</div>
        <h3>No employees yet</h3>
        <p>
          Add your first employee, assign a role and position, then
          create their login.
        </p>
        <button
          v-if="canCreate"
          class="btn btn-primary"
          type="button"
          @click="openCreate"
        >
          + Add employee
        </button>
      </div>
      <div v-else class="employee-list">
        <article v-for="employee in employees" :key="employee._id" class="employee-row">
          <div class="employee-avatar">{{ (employee.firstName?.[0] || "") + (employee.lastName?.[0] || "") }}</div>
          <div class="employee-main">
            <strong>{{ employee.firstName }} {{ employee.lastName }}</strong>
            <span>{{ employee.email }}</span>
            <small>
              {{ employee.employeeNo }} · {{ positionLabel(employee.position) }}
            </small>
          </div>
          <div class="employee-role">
            <strong>{{ employee.role?.name || "No role" }}</strong>
            <span>
              {{
                employee.loginEnabled === false
                  ? "Login disabled"
                  : "Login enabled"
              }}
            </span>
          </div>
          <div class="employee-actions">
            <button
              class="btn btn-secondary"
              type="button"
              @click="openEdit(employee)"
            >
              Edit
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              @click="resetPassword(employee)"
            >
              Reset password
            </button>
            <button
              class="btn btn-danger"
              type="button"
              @click="deactivate(employee)"
            >
              Deactivate
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
