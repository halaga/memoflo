<script setup>
import { computed, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";

const roles = ref([]);
const permissions = ref([]);
const employees = ref([]);

const loading = ref(true);
const error = ref("");
const success = ref("");

const selectedRole = ref(null);
const selectedEmployee = ref("");

const showCreate = ref(false);

const form = ref({
  name: "",
  code: "",
  level: 10,
  description: "",
  permissions: [],
});

const permissionGroups = computed(() => {
  const groups = {};

  for (const permission of permissions.value) {
    if (!groups[permission.module]) {
      groups[permission.module] = [];
    }

    groups[permission.module].push(permission);
  }

  return groups;
});

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const [
      rolesResult,
      permissionsResult,
      employeesResult,
    ] = await Promise.all([
      api.listRoles(),
      api.listPermissions
        ? api.listPermissions()
        : api.request?.("/roles/permissions"),
      api.listEmployees(),
    ]);

    roles.value = normalizeList(rolesResult);
    permissions.value = normalizeList(
      permissionsResult
    );
    employees.value = normalizeList(employeesResult);
  } catch (err) {
    error.value =
      err?.message || "Unable to load roles";
  } finally {
    loading.value = false;
  }
}

function selectRole(role) {
  selectedRole.value = role;
  selectedEmployee.value = "";
  success.value = "";
}

async function assignRole() {
  if (
    !selectedRole.value ||
    !selectedEmployee.value
  ) {
    return;
  }

  error.value = "";
  success.value = "";

  try {
    await api.assignEmployeeRole(
      selectedRole.value._id,
      selectedEmployee.value
    );

    success.value =
      "Role assigned successfully.";

    await load();

    const refreshedRole = roles.value.find(
      (role) =>
        role._id === selectedRole.value?._id
    );

    selectedRole.value =
      refreshedRole || selectedRole.value;
  } catch (err) {
    error.value =
      err?.message || "Unable to assign role";
  }
}

function resetForm() {
  form.value = {
    name: "",
    code: "",
    level: 10,
    description: "",
    permissions: [],
  };
}

async function createRole() {
  error.value = "";
  success.value = "";

  try {
    await api.createRole(form.value);

    success.value = "Role created successfully.";

    showCreate.value = false;
    resetForm();

    await load();
  } catch (err) {
    error.value =
      err?.message || "Unable to create role";
  }
}

function employeeRole(employee) {
  return employee.role?.name || "No role";
}

onMounted(load);
</script>

<template>
  <section class="roles-page">
    <div class="roles-header">
      <div>
        <p class="eyebrow">Administration</p>

        <h1>Roles & Permissions</h1>

        <p class="roles-subtitle">
          Control what employees can do inside
          MemoFlo.
        </p>
      </div>

      <button
        class="primary-button"
        @click="showCreate = !showCreate"
      >
        {{ showCreate ? "Cancel" : "Create Role" }}
      </button>
    </div>

    <div
      v-if="error"
      class="roles-alert roles-alert-error"
    >
      {{ error }}
    </div>

    <div
      v-if="success"
      class="roles-alert roles-alert-success"
    >
      {{ success }}
    </div>

    <!-- CREATE ROLE -->
    <div
      v-if="showCreate"
      class="roles-card create-role-card"
    >
      <h2>Create role</h2>

      <div class="form-grid">
        <label>
          <span>Name</span>
          <input
            v-model="form.name"
            placeholder="e.g. Finance Officer"
          />
        </label>

        <label>
          <span>Code</span>
          <input
            v-model="form.code"
            placeholder="FINANCE_OFFICER"
          />
        </label>

        <label>
          <span>Level</span>
          <input
            v-model.number="form.level"
            type="number"
            min="1"
          />
        </label>

        <label>
          <span>Description</span>
          <input
            v-model="form.description"
            placeholder="Role description"
          />
        </label>
      </div>

      <div class="permission-picker">
        <h3>Permissions</h3>

        <div
          v-for="(group, module) in permissionGroups"
          :key="module"
          class="permission-group"
        >
          <strong>{{ module }}</strong>

          <label
            v-for="permission in group"
            :key="permission._id"
            class="permission-option"
          >
            <input
              v-model="form.permissions"
              type="checkbox"
              :value="permission.name"
            />

            {{ permission.name }}
          </label>
        </div>
      </div>

      <button
        class="primary-button"
        @click="createRole"
      >
        Save Role
      </button>
    </div>

    <!-- ROLES -->
    <div v-if="loading" class="roles-loading">
      Loading roles...
    </div>

    <div
      v-else
      class="roles-layout"
    >
      <div class="roles-card">
        <div class="card-heading">
          <div>
            <h2>Company roles</h2>
            <p>
              Roles available to employees in this
              company.
            </p>
          </div>

          <span class="count-pill">
            {{ roles.length }}
          </span>
        </div>

        <div class="role-list">
          <button
            v-for="role in roles"
            :key="role._id"
            class="role-item"
            :class="{
              selected:
                selectedRole?._id === role._id,
            }"
            @click="selectRole(role)"
          >
            <div>
              <strong>{{ role.name }}</strong>

              <span>
                {{ role.code }}
              </span>
            </div>

            <small>
              {{ role.permissions?.length || 0 }}
              permissions
            </small>
          </button>
        </div>
      </div>

      <!-- ROLE DETAIL -->
      <div class="roles-card role-detail">
        <template v-if="selectedRole">
          <div class="card-heading">
            <div>
              <h2>{{ selectedRole.name }}</h2>

              <p>
                {{ selectedRole.description }}
              </p>
            </div>

            <span
              v-if="selectedRole.isSystem"
              class="system-badge"
            >
              System role
            </span>
          </div>

          <div class="permission-summary">
            <h3>Permissions</h3>

            <div class="permission-tags">
              <span
                v-for="permission in selectedRole.permissions"
                :key="permission"
                class="permission-tag"
              >
                {{ permission }}
              </span>

              <span
                v-if="
                  !selectedRole.permissions?.length
                "
                class="empty-state"
              >
                No permissions assigned.
              </span>
            </div>
          </div>

          <div class="assign-section">
            <h3>Assign employee</h3>

            <p>
              Assign this role to an active employee
              in the company.
            </p>

            <div class="assign-row">
              <select
                v-model="selectedEmployee"
              >
                <option value="">
                  Select employee
                </option>

                <option
                  v-for="employee in employees"
                  :key="employee._id"
                  :value="employee._id"
                >
                  {{
                    employee.firstName
                  }}
                  {{
                    employee.lastName
                  }}
                  — {{ employeeRole(employee) }}
                </option>
              </select>

              <button
                class="primary-button"
                :disabled="!selectedEmployee"
                @click="assignRole"
              >
                Assign
              </button>
            </div>
          </div>
        </template>

        <div
          v-else
          class="empty-role-detail"
        >
          <h2>Select a role</h2>

          <p>
            Select a role to view its permissions and
            assign it to employees.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
