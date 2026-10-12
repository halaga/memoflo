<script setup>
import { computed, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";
import { downloadCsv, parseCsv } from "../../utils/dataTransfer";
import AppIcon from "../../components/ui/AppIcon.vue";

const items = ref([]);
const departments = ref([]);
const employees = ref([]);
const loading = ref(true);
const saving = ref(false);
const importing = ref(false);
const error = ref("");
const notice = ref("");
const search = ref("");
const departmentFilter = ref("");
const categoryFilter = ref("");
const showForm = ref(false);
const editingId = ref("");
const form = ref(emptyForm());

function emptyForm() {
  return {
    name: "", category: "IT Equipment", itemCode: "", serialNumber: "",
    quantity: 1, availableQuantity: 1, unit: "unit", status: "Available",
    ownerDepartment: "", custodian: "", location: "", purchaseDate: "", notes: "",
  };
}

const categories = computed(() => [...new Set(items.value.map((item) => item.category).filter(Boolean))].sort());
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  return items.value.filter((item) => {
    const departmentId = item.ownerDepartment?._id || item.ownerDepartment || "";
    const text = [item.name, item.itemCode, item.serialNumber, item.category, item.location, item.notes, item.custodian?.firstName, item.custodian?.lastName].filter(Boolean).join(" ").toLowerCase();
    return (!term || text.includes(term))
      && (!departmentFilter.value || String(departmentId) === departmentFilter.value)
      && (!categoryFilter.value || item.category === categoryFilter.value);
  });
});

function setDepartmentPreset(preset) {
  if (preset === "all") {
    departmentFilter.value = "";
    return;
  }
  const pattern = preset === "it" ? /information technology|\bit\b/i : /administration|\badmin\b/i;
  const department = departments.value.find((item) => pattern.test(item.name || ""));
  departmentFilter.value = department?._id || "";
}

function departmentName(value) {
  return value?.name || departments.value.find((item) => item._id === value)?.name || "Unassigned";
}

function employeeName(value) {
  if (value && typeof value === "object") return [value.firstName, value.lastName].filter(Boolean).join(" ");
  const match = employees.value.find((item) => item._id === value);
  return match ? `${match.firstName} ${match.lastName}` : "Unassigned";
}

async function load() {
  loading.value = true;
  error.value = "";
  const results = await Promise.allSettled([
    api.listInventory(),
    api.listDepartments(),
    api.listEmployeeDirectory(),
  ]);
  if (results[0].status === "fulfilled") items.value = normalizeList(results[0].value, ["items", "inventory"]);
  else error.value = results[0].reason?.message || "Unable to load inventory.";
  if (results[1].status === "fulfilled") departments.value = normalizeList(results[1].value, ["departments"]);
  if (results[2].status === "fulfilled") employees.value = normalizeList(results[2].value, ["employees"]);
  loading.value = false;
}

function startCreate() {
  editingId.value = "";
  form.value = { ...emptyForm(), ownerDepartment: departmentFilter.value };
  showForm.value = true;
  error.value = "";
  notice.value = "";
}

function edit(item) {
  editingId.value = item._id;
  form.value = {
    ...emptyForm(),
    ...item,
    ownerDepartment: item.ownerDepartment?._id || item.ownerDepartment || "",
    custodian: item.custodian?._id || item.custodian || "",
    purchaseDate: item.purchaseDate ? String(item.purchaseDate).slice(0, 10) : "",
  };
  showForm.value = true;
  error.value = "";
  notice.value = "";
}

async function save() {
  if (!form.value.name.trim()) {
    error.value = "Item name is required.";
    return;
  }
  if (Number(form.value.availableQuantity) > Number(form.value.quantity)) {
    error.value = "Available quantity cannot exceed total quantity.";
    return;
  }
  saving.value = true;
  error.value = "";
  notice.value = "";
  try {
    const payload = {
      ...form.value,
      quantity: Number(form.value.quantity),
      availableQuantity: Number(form.value.availableQuantity),
      ownerDepartment: form.value.ownerDepartment || null,
      custodian: form.value.custodian || null,
      purchaseDate: form.value.purchaseDate || null,
    };
    if (editingId.value) await api.updateInventory(editingId.value, payload);
    else await api.createInventory(payload);
    showForm.value = false;
    notice.value = editingId.value ? "Inventory record updated." : "Inventory record created.";
    await load();
  } catch (err) {
    error.value = err.message || "Unable to save inventory record.";
  } finally {
    saving.value = false;
  }
}

async function retire(item) {
  if (!window.confirm(`Retire "${item.name}"? The record will remain in history.`)) return;
  try {
    await api.deleteInventory(item._id);
    notice.value = `${item.name} retired.`;
    await load();
  } catch (err) {
    error.value = err.message || "Unable to retire item.";
  }
}

function exportInventory() {
  downloadCsv("memoflo-inventory.csv", filtered.value.map((item) => ({
    name: item.name || "",
    category: item.category || "",
    itemCode: item.itemCode || "",
    serialNumber: item.serialNumber || "",
    quantity: item.quantity ?? 0,
    availableQuantity: item.availableQuantity ?? 0,
    unit: item.unit || "unit",
    status: item.status || "Available",
    ownerDepartment: departmentName(item.ownerDepartment),
    custodian: employeeName(item.custodian),
    location: item.location || "",
    purchaseDate: item.purchaseDate ? String(item.purchaseDate).slice(0, 10) : "",
    notes: item.notes || "",
  })));
}

async function importInventory(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  importing.value = true;
  error.value = "";
  notice.value = "";
  let created = 0;
  const failures = [];
  try {
    const rows = await parseCsv(file);
    for (let index = 0; index < rows.length; index += 1) {
      const row = Object.fromEntries(Object.entries(rows[index]).map(([key, value]) => [key.trim(), String(value || "").trim()]));
      if (!row.name) {
        failures.push(`Row ${index + 2}: name is required.`);
        continue;
      }
      const department = departments.value.find((item) => item.name.toLowerCase() === String(row.ownerDepartment || row.ownerDepartmentName || "").toLowerCase());
      const custodian = employees.value.find((item) => item.email?.toLowerCase() === String(row.custodianEmail || "").toLowerCase());
      const quantity = Number(row.quantity || 1);
      const availableQuantity = Number(row.availableQuantity || quantity);
      try {
        await api.createInventory({
          name: row.name,
          category: row.category || "General",
          itemCode: row.itemCode || "",
          serialNumber: row.serialNumber || "",
          quantity,
          availableQuantity: Math.min(availableQuantity, quantity),
          unit: row.unit || "unit",
          status: row.status || "Available",
          ownerDepartment: department?._id || null,
          custodian: custodian?._id || null,
          location: row.location || "",
          purchaseDate: row.purchaseDate || null,
          notes: row.notes || "",
        });
        created += 1;
      } catch (err) {
        failures.push(`Row ${index + 2}: ${err.message}`);
      }
    }
    notice.value = `${created} inventory record(s) imported.${failures.length ? ` ${failures.length} row(s) skipped: ${failures.slice(0, 4).join(" ")}` : ""}`;
    await load();
  } catch (err) {
    error.value = err.message || "Unable to read CSV file.";
  } finally {
    importing.value = false;
  }
}

function downloadTemplate() {
  downloadCsv("memoflo-inventory-template.csv", [{
    name: "", category: "IT Equipment", itemCode: "", serialNumber: "",
    quantity: "1", availableQuantity: "1", unit: "unit", status: "Available",
    ownerDepartment: "Information Technology", custodianEmail: "", location: "", purchaseDate: "", notes: "",
  }]);
}

onMounted(load);
</script>

<template>
  <div class="experience-page inventory-page">
    <section class="page-intro-row">
      <div><span class="eyebrow">ASSET & INVENTORY CONTROL</span><h1>Inventory register</h1><p>Track office items, quantities, location, owning department and the person responsible for each record.</p></div>
      <div class="inventory-actions">
        <button class="action-secondary" type="button" @click="exportInventory"><AppIcon name="download" :size="17" /> Export CSV</button>
        <label class="action-secondary file-action"><AppIcon name="upload" :size="17" /> {{ importing ? "Importing…" : "Import CSV" }}<input type="file" accept=".csv,text/csv" :disabled="importing" @change="importInventory" /></label>
        <button class="action-secondary" type="button" @click="downloadTemplate"><AppIcon name="file" :size="17" /> Template</button>
        <button class="action-primary" type="button" @click="startCreate"><AppIcon name="plus" :size="17" /> Add item</button>
      </div>
    </section>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="notice" class="alert alert-success">{{ notice }}</div>

    <section class="inventory-summary-grid">
      <article class="inventory-summary"><span class="inventory-summary-icon"><AppIcon name="box" :size="20" /></span><small>ACTIVE RECORDS</small><strong>{{ items.filter((item) => item.status !== 'Retired').length }}</strong></article>
      <article class="inventory-summary"><span class="inventory-summary-icon"><AppIcon name="check" :size="20" /></span><small>AVAILABLE UNITS</small><strong>{{ items.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0) }}</strong></article>
      <article class="inventory-summary"><span class="inventory-summary-icon"><AppIcon name="people" :size="20" /></span><small>ASSIGNED ITEMS</small><strong>{{ items.filter((item) => item.status === "Assigned" || item.custodian).length }}</strong></article>
    </section>

    <section class="inventory-toolbar workspace-panel">
      <label class="inventory-search"><AppIcon name="search" :size="18" /><input v-model="search" placeholder="Search item, serial number, location or custodian…" /></label>
      <label>Owner department<select v-model="departmentFilter" class="input"><option value="">All departments</option><option v-for="department in departments" :key="department._id" :value="department._id">{{ department.name }}</option></select></label>
      <label>Category<select v-model="categoryFilter" class="input"><option value="">All categories</option><option v-for="category in categories" :key="category">{{ category }}</option></select></label>
      <span class="inventory-result-count">{{ filtered.length }} items</span>
    </section>

    <div class="inventory-presets" aria-label="Inventory by owner">
      <button type="button" :class="{ active: !departmentFilter }" @click="setDepartmentPreset('all')"><AppIcon name="box" :size="16" /> All inventory</button>
      <button type="button" :class="{ active: departmentFilter && /information technology|\bit\b/i.test(departmentName(departmentFilter)) }" @click="setDepartmentPreset('it')"><AppIcon name="laptop" :size="16" /> IT inventory</button>
      <button type="button" :class="{ active: departmentFilter && /administration|\badmin\b/i.test(departmentName(departmentFilter)) }" @click="setDepartmentPreset('admin')"><AppIcon name="company" :size="16" /> Admin inventory</button>
    </div>

    <section v-if="showForm" class="workspace-panel inventory-form-panel">
      <header class="section-title-row"><div><span class="eyebrow">INVENTORY RECORD</span><h2>{{ editingId ? "Edit inventory item" : "Add inventory item" }}</h2></div><button class="icon-button" type="button" aria-label="Close form" @click="showForm = false"><AppIcon name="close" :size="18" /></button></header>
      <form class="inventory-form-grid" @submit.prevent="save">
        <label>Item name<input v-model="form.name" class="input" required /></label>
        <label>Category<input v-model="form.category" class="input" required /></label>
        <label>Item code<input v-model="form.itemCode" class="input" /></label>
        <label>Serial number<input v-model="form.serialNumber" class="input" /></label>
        <label>Owner department<select v-model="form.ownerDepartment" class="input"><option value="">Unassigned</option><option v-for="department in departments" :key="department._id" :value="department._id">{{ department.name }}</option></select></label>
        <label>Custodian<select v-model="form.custodian" class="input"><option value="">Unassigned</option><option v-for="person in employees" :key="person._id" :value="person._id">{{ person.firstName }} {{ person.lastName }}</option></select></label>
        <label>Total quantity<input v-model.number="form.quantity" class="input" type="number" min="0" required /></label>
        <label>Available quantity<input v-model.number="form.availableQuantity" class="input" type="number" min="0" required /></label>
        <label>Unit<input v-model="form.unit" class="input" placeholder="unit, pack, box…" /></label>
        <label>Status<select v-model="form.status" class="input"><option>Available</option><option>Assigned</option><option>Low Stock</option><option>Damaged</option><option>Retired</option></select></label>
        <label>Location<input v-model="form.location" class="input" placeholder="IT store / Admin office / Floor 2" /></label>
        <label>Purchase date<input v-model="form.purchaseDate" class="input" type="date" /></label>
        <label class="inventory-notes">Notes<textarea v-model="form.notes" class="textarea" rows="3"></textarea></label>
        <div class="form-actions inventory-form-actions"><button class="action-secondary" type="button" @click="showForm = false">Cancel</button><button class="action-primary" type="submit" :disabled="saving">{{ saving ? "Saving…" : "Save record" }} <AppIcon name="check" :size="17" /></button></div>
      </form>
    </section>

    <section class="workspace-panel inventory-table-panel">
      <div v-if="loading" class="panel-empty">Loading inventory records…</div>
      <div v-else-if="!filtered.length" class="panel-empty"><AppIcon name="box" :size="28" /><strong>No inventory records</strong><p>Add an item or import your inventory from CSV.</p></div>
      <div v-else class="inventory-table-wrap">
        <table class="data-table inventory-table">
          <thead><tr><th>Item</th><th>Category / code</th><th>Owner</th><th>Custodian</th><th>Quantity</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="item in filtered" :key="item._id">
              <td><strong>{{ item.name }}</strong><small>{{ item.serialNumber || "No serial number" }}</small></td>
              <td>{{ item.category || "General" }}<small>{{ item.itemCode || "No item code" }}</small></td>
              <td>{{ departmentName(item.ownerDepartment) }}</td>
              <td>{{ employeeName(item.custodian) }}</td>
              <td><strong>{{ item.availableQuantity ?? 0 }}</strong> / {{ item.quantity ?? 0 }} {{ item.unit || "unit" }}</td>
              <td>{{ item.location || "—" }}</td>
              <td><span class="inventory-status" :class="String(item.status || '').toLowerCase().replace(/\s+/g, '-')">{{ item.status || "Available" }}</span></td>
              <td><div class="row-actions"><button class="icon-button" type="button" :aria-label="`Edit ${item.name}`" @click="edit(item)"><AppIcon name="edit" :size="17" /></button><button class="icon-button danger" type="button" :aria-label="`Retire ${item.name}`" @click="retire(item)"><AppIcon name="trash" :size="17" /></button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
