<script setup>
import { computed, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";

const activeTab = ref("positions");
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const notice = ref("");

const sbus = ref([]);
const departments = ref([]);
const designations = ref([]);
const positions = ref([]);

const modal = ref(null);
const form = ref({});

const tabs = [
  { key: "positions", label: "Positions", icon: "◈" },
  { key: "departments", label: "Departments", icon: "▦" },
  { key: "designations", label: "Designations", icon: "◇" },
  { key: "sbus", label: "SBUs", icon: "⌂" },
];

const title = computed(() => {
  const item = tabs.find((tab) => tab.key === activeTab.value);
  return item?.label || "Organization";
});

const currentItems = computed(() => {
  if (activeTab.value === "positions") return positions.value;
  if (activeTab.value === "departments") return departments.value;
  if (activeTab.value === "designations") return designations.value;
  return sbus.value;
});

function labelEmployee(value) {
  if (!value) return "Vacant";
  if (typeof value === "string") return value;
  return `${value.firstName || ""} ${value.lastName || ""}`.trim() || "Assigned";
}

function labelSbu(id) {
  return sbus.value.find((item) => item._id === id)?.name || "—";
}

function labelDepartment(id) {
  return departments.value.find((item) => item._id === id)?.name || "—";
}

function labelDesignation(id) {
  return designations.value.find((item) => item._id === id)?.title || "—";
}

function openCreate(type) {
  modal.value = { type, editing: false };
  form.value = type === "sbu"
    ? { name: "", code: "", description: "" }
    : type === "department"
      ? { name: "", code: "", sbu: sbus.value[0]?._id || "", description: "" }
      : type === "designation"
        ? { title: "", sbu: sbus.value[0]?._id || "", department: departments.value[0]?._id || "", level: 1, description: "" }
        : {
            title: "",
            code: "",
            sbu: sbus.value[0]?._id || "",
            department: departments.value[0]?._id || "",
            designation: designations.value[0]?._id || "",
            reportsTo: "",
            isWorkflowNode: true,
          };
}

function openEdit(type, item) {
  modal.value = { type, editing: true, id: item._id };
  form.value = JSON.parse(JSON.stringify(item));
  if (type === "position") {
    form.value.sbu = item.sbu?._id || item.sbu || "";
    form.value.department = item.department?._id || item.department || "";
    form.value.designation = item.designation?._id || item.designation || "";
    form.value.reportsTo = item.reportsTo?._id || item.reportsTo || "";
  }
}

function closeModal() {
  if (!saving.value) modal.value = null;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [s, d, g, p] = await Promise.all([
      api.listSBUs(),
      api.listDepartments(),
      api.listDesignations(),
      api.listPositions(),
    ]);
    sbus.value = normalizeList(s);
    departments.value = normalizeList(d);
    designations.value = normalizeList(g);
    positions.value = normalizeList(p);
  } catch (err) {
    error.value = err.message || "Unable to load organization structure.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!modal.value) return;
  saving.value = true;
  error.value = "";
  notice.value = "";
  try {
    const type = modal.value.type;
    const payload = { ...form.value };
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.company;
    delete payload.occupant;

    if (type === "sbu") {
      await (modal.value.editing ? api.updateSBU(modal.value.id, payload) : api.createSBU(payload));
    } else if (type === "department") {
      await (modal.value.editing ? api.updateDepartment(modal.value.id, payload) : api.createDepartment(payload));
    } else if (type === "designation") {
      await (modal.value.editing ? api.updateDesignation(modal.value.id, payload) : api.createDesignation(payload));
    } else {
      await (modal.value.editing ? api.updatePosition(modal.value.id, payload) : api.createPosition(payload));
    }

    modal.value = null;
    notice.value = `${type[0].toUpperCase()}${type.slice(1)} saved successfully.`;
    await load();
  } catch (err) {
    error.value = err.message || "Unable to save organization record.";
  } finally {
    saving.value = false;
  }
}

async function remove(type, item) {
  if (!window.confirm(`Deactivate ${item.name || item.title || item.code || "this record"}?`)) return;
  try {
    if (type === "department") await api.deleteDepartment(item._id);
    if (type === "designation") await api.deleteDesignation(item._id);
    if (type === "position") await api.deletePosition(item._id);
    if (type === "sbu") await api.deleteSBU(item._id);
    await load();
  } catch (err) {
    error.value = err.message || "Unable to deactivate record.";
  }
}

onMounted(load);
</script>

<template>
  <div class="page administration-page">
    <div class="page-header">
      <div>
        <span class="page-kicker">ORGANIZATION & PEOPLE</span>
        <h1>Organization structure</h1>
        <p>Set up the structure employees, positions and workflows depend on.</p>
      </div>
      <RouterLink to="/administration" class="btn btn-secondary">← Administration</RouterLink>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="notice" class="alert alert-success">{{ notice }}</div>

    <div class="org-tabs card">
      <button v-for="tab in tabs" :key="tab.key" :class="['org-tab', { active: activeTab === tab.key }]" @click="activeTab = tab.key">
        <span>{{ tab.icon }}</span>{{ tab.label }}
      </button>
    </div>

    <section class="card org-panel">
      <div class="section-heading">
        <div>
          <span class="page-kicker">{{ title }}</span>
          <h2>Manage {{ title.toLowerCase() }}</h2>
        </div>
        <button class="btn btn-primary" @click="openCreate(activeTab === 'sbus' ? 'sbu' : activeTab === 'departments' ? 'department' : activeTab === 'designations' ? 'designation' : 'position')">
          + Add {{ title.slice(0, -1) }}
        </button>
      </div>

      <div v-if="loading" class="empty-state">Loading organization structure…</div>
      <div v-else-if="!currentItems.length" class="empty-state">
        <strong>No {{ title.toLowerCase() }} configured.</strong>
        <p>Create the first record to make this structure available to employee setup and workflows.</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th v-if="activeTab !== 'sbus'">SBU</th>
              <th v-if="activeTab === 'positions' || activeTab === 'designations'">Department</th>
              <th v-if="activeTab === 'positions'">Designation</th>
              <th v-if="activeTab === 'positions'">Occupant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in currentItems" :key="item._id">
              <td>
                <strong>{{ item.name || item.title }}</strong>
                <small v-if="item.code">{{ item.code }}</small>
              </td>
              <td v-if="activeTab !== 'sbus'">{{ labelSbu(item.sbu?._id || item.sbu) }}</td>
              <td v-if="activeTab === 'positions' || activeTab === 'designations'">{{ labelDepartment(item.department?._id || item.department) }}</td>
              <td v-if="activeTab === 'positions'">{{ labelDesignation(item.designation?._id || item.designation) }}</td>
              <td v-if="activeTab === 'positions'">{{ labelEmployee(item.occupant) }}</td>
              <td class="table-actions">
                <button class="btn btn-small btn-secondary" @click="openEdit(activeTab === 'sbus' ? 'sbu' : activeTab === 'departments' ? 'department' : activeTab === 'designations' ? 'designation' : 'position', item)">Edit</button>
                <button class="btn btn-small btn-ghost-danger" @click="remove(activeTab === 'sbus' ? 'sbu' : activeTab === 'departments' ? 'department' : activeTab === 'designations' ? 'designation' : 'position', item)">Deactivate</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modal" class="modal-backdrop" @click.self="closeModal">
      <section class="modal-card">
        <div class="page-header compact">
          <div>
            <span class="page-kicker">ORGANIZATION SETUP</span>
            <h2>{{ modal.editing ? 'Edit' : 'Add' }} {{ modal.type }}</h2>
          </div>
          <button class="btn btn-secondary" @click="closeModal">Close</button>
        </div>

        <div class="form-grid">
          <label v-if="modal.type === 'sbu' || modal.type === 'department'">Name<input v-model="form.name" /></label>
          <label v-if="modal.type === 'designation' || modal.type === 'position'">Title<input v-model="form.title" /></label>
          <label v-if="modal.type !== 'designation'">Code<input v-model="form.code" /></label>
          <label v-if="modal.type !== 'sbu'">SBU<select v-model="form.sbu"><option value="">Select SBU</option><option v-for="item in sbus" :key="item._id" :value="item._id">{{ item.name }}</option></select></label>
          <label v-if="modal.type === 'designation' || modal.type === 'position'">Department<select v-model="form.department"><option value="">Select department</option><option v-for="item in departments" :key="item._id" :value="item._id">{{ item.name }}</option></select></label>
          <label v-if="modal.type === 'position'">Designation<select v-model="form.designation"><option value="">Select designation</option><option v-for="item in designations" :key="item._id" :value="item._id">{{ item.title }}</option></select></label>
          <label v-if="modal.type === 'designation'">Level<input v-model.number="form.level" type="number" min="1" /></label>
          <label v-if="modal.type === 'position'">Reports to<select v-model="form.reportsTo"><option value="">No parent position</option><option v-for="item in positions.filter(p => p._id !== modal.id)" :key="item._id" :value="item._id">{{ item.title }}</option></select></label>
          <label class="form-span-2">Description<textarea v-model="form.description" rows="3"></textarea></label>
          <label v-if="modal.type === 'position'" class="checkbox-row"><input v-model="form.isWorkflowNode" type="checkbox" /> Available as a workflow responsibility position</label>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </section>
    </div>
  </div>
</template>
