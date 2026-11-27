<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";
import { downloadCsv, parseCsv } from "../../utils/dataTransfer";
import AppIcon from "../../components/ui/AppIcon.vue";
const items = ref([]);
const departments = ref([]);
const employees = ref([]);
const purchaseRequests = ref([]);
const approvedMemos = ref([]);
const loading = ref(true);
const saving = ref(false);
const importing = ref(false);
const error = ref("");
const notice = ref("");
const search = ref("");
const departmentFilter = ref("");
const categoryFilter = ref("");
const showForm = ref(false);
const inventoryFormSection = ref(null);
const editingId = ref("");
const form = ref(emptyForm());
const movementItem = ref(null);
const movementSaving = ref(false);
const movementError = ref("");
const movementNotice = ref("");
const movementForm = ref({ movementType: "Stock In", quantity: 1, destinationItem: "", custodian: "", toLocation: "", referenceType: "", referenceId: "", reference: "", notes: "" });
const movementHistory = ref([]);
const historyItem = ref(null);
const historyLoading = ref(false);
function emptyForm() {
    return {
        name: "", category: "IT Equipment", description: "", supplier: "", purchaseReference: "", condition: "Unknown", minimumStock: 0, itemCode: "", serialNumber: "",
        quantity: 1, availableQuantity: 1, unit: "unit", status: "Available",
        ownerDepartment: "", custodian: "", location: "", purchaseDate: "", notes: "",
    };
}
const categories = computed(() => [...new Set(items.value.map((item) => item.category).filter(Boolean))].sort());
const filtered = computed(() => {
    const term = search.value.trim().toLowerCase();
    return items.value.filter((item) => {
        const departmentId = item.ownerDepartment?._id || item.ownerDepartment || "";
        const text = [item.name, item.itemCode, item.serialNumber, item.category, item.location, item.notes, item.custodian?.firstName,
            item.custodian?.lastName].filter(Boolean).join(" ").toLowerCase();
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
    if (value && typeof value === "object")
        return [value.firstName, value.lastName].filter(Boolean).join(" ");
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
        api.listProcurementRequests("all"),
        api.listMemos(),
    ]);
    if (results[0].status === "fulfilled")
        items.value = normalizeList(results[0].value, ["items", "inventory"]);
    else
        error.value = results[0].reason?.message || "Unable to load inventory.";
    if (results[1].status === "fulfilled")
        departments.value = normalizeList(results[1].value, ["departments"]);
    if (results[2].status === "fulfilled")
        employees.value = normalizeList(results[2].value, ["employees"]);
    if (results[3].status === "fulfilled")
        purchaseRequests.value = normalizeList(results[3].value, ["requests", "procurements"]);
    if (results[4].status === "fulfilled")
        approvedMemos.value = normalizeList(results[4].value, ["memos"]).filter(memo => memo.memoType === "approval" && ["Approved", "Completed"].includes(memo.status));
    loading.value = false;
}
async function revealInventoryForm() {
    await nextTick();
    inventoryFormSection.value?.scrollIntoView({ behavior: "smooth", block: "start" });
    await nextTick();
    inventoryFormSection.value?.querySelector("input:not([type=hidden]), select, textarea")?.focus({ preventScroll: true });
}
async function startCreate() {
    editingId.value = "";
    form.value = {
        ...emptyForm(),
        ownerDepartment: departmentFilter.value
    };
    showForm.value = true;
    error.value = "";
    notice.value = "";
    await revealInventoryForm();
}
async function edit(item) {
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
    await revealInventoryForm();
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
        if (editingId.value)
            await api.updateInventory(editingId.value, payload);
        else
            await api.createInventory(payload);
        showForm.value = false;
        notice.value = editingId.value ? "Inventory record updated." : "Inventory record created.";
        await load();
    }
    catch (err) {
        error.value = err.message || "Unable to save inventory record.";
    }
    finally {
        saving.value = false;
    }
}
async function retire(item) {
    if (!window.confirm(`Retire "${item.name}"? The record will remain in history.`))
        return;
    try {
        await api.deleteInventory(item._id);
        notice.value = `${item.name} retired.`;
        await load();
    }
    catch (err) {
        error.value = err.message || "Unable to retire item.";
    }
}
function exportInventory() {
    downloadCsv("memoflo-inventory.csv", filtered.value.map((item) => ({
        name: item.name || "",
        category: item.category || "",
        description: item.description || "",
        supplier: item.supplier || "",
        purchaseReference: item.purchaseReference || "",
        condition: item.condition || "Unknown",
        minimumStock: item.minimumStock ?? 0,
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
    if (!file)
        return;
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
                    description: row.description || "",
                    supplier: row.supplier || "",
                    purchaseReference: row.purchaseReference || "",
                    condition: row.condition || "Unknown",
                    minimumStock: Number(row.minimumStock || 0),
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
            }
            catch (err) {
                failures.push(`Row ${index + 2}: ${err.message}`);
            }
        }
        notice.value = `${created} inventory record(s) imported.${failures.length ? ` ${failures.length} row(s) skipped: ${failures.slice(0,
            4).join(" ")}` : ""}`;
        await load();
    }
    catch (err) {
        error.value = err.message || "Unable to read CSV file.";
    }
    finally {
        importing.value = false;
    }
}
function openMovement(item) {
    movementItem.value = item;
    movementError.value = "";
    movementNotice.value = "";
    movementForm.value = { movementType: "Stock In", quantity: 1, destinationItem: "", custodian: item.custodian?._id || item.custodian || "", toLocation: item.location || "", referenceType: "", referenceId: "", reference: "", notes: "" };
}
async function saveMovement() {
    if (!movementItem.value) return;
    movementSaving.value = true;
    movementError.value = "";
    try {
        const payload = { ...movementForm.value, item: movementItem.value._id, quantity: Number(movementForm.value.quantity) };
        if (payload.movementType !== "Custody" && !payload.quantity) throw new Error("Enter a valid movement quantity.");
        if (payload.movementType === "Stock Transfer" && !payload.destinationItem) throw new Error("Choose the destination inventory item.");
        if (payload.movementType === "Custody" && !payload.custodian) throw new Error("Choose the new custodian.");
        await api.createInventoryMovement(payload);
        movementNotice.value = `${payload.movementType} recorded for ${movementItem.value.name}.`;
        movementItem.value = null;
        await load();
    } catch (err) { movementError.value = err.message || "Unable to record stock movement."; }
    finally { movementSaving.value = false; }
}
async function viewHistory(item) {
    historyItem.value = item;
    historyLoading.value = true;
    try { movementHistory.value = normalizeList(await api.listInventoryMovements(item._id), ["movements"]); }
    catch (err) { error.value = err.message || "Unable to load movement history."; movementHistory.value = []; }
    finally { historyLoading.value = false; }
}
function downloadTemplate() {
    downloadCsv("memoflo-inventory-template.csv", [{
            name: "", category: "IT Equipment", description: "", supplier: "", purchaseReference: "", condition: "New", minimumStock: "0", itemCode: "", serialNumber: "",
            quantity: "1", availableQuantity: "1", unit: "unit", status: "Available",
            ownerDepartment: "Information Technology", custodianEmail: "", location: "", purchaseDate: "", notes: "",
        }]);
}
onMounted(load);
</script>

<template>
<div class="experience-page inventory-page">
  <section class="page-intro-row">
    <div>
      <span class="eyebrow">
        ASSET & INVENTORY CONTROL
      </span>
      <h1>
        Inventory register
      </h1>
      <p>
        Track office items, quantities, location, owning department and the person responsible for each record.
      </p>
    </div>
    <div class="inventory-actions">
      <button class="action-secondary" type="button" @click="exportInventory">
        <AppIcon name="download" :size="17" />
        Export CSV
      </button>
      <label class="action-secondary file-action">
        <AppIcon name="upload" :size="17" />
        {{ importing ? "Importing…" : "Import CSV" }}
        <input type="file" accept=".csv,text/csv" :disabled="importing" @change="importInventory" />
      </label>
      <button class="action-secondary" type="button" @click="downloadTemplate">
        <AppIcon name="file" :size="17" />
        Template
      </button>
      <button class="action-primary" type="button" @click="startCreate">
        <AppIcon name="plus" :size="17" />
        Add item
      </button>
    </div>
  </section>
  <div v-if="error" class="alert alert-error">
    {{ error }}
  </div>
  <div v-if="notice" class="alert alert-success">
    {{ notice }}
  </div>
  <div v-if="movementNotice" class="alert alert-success">{{ movementNotice }}</div>
  <section class="inventory-summary-grid">
    <article class="inventory-summary">
      <span class="inventory-summary-icon">
        <AppIcon name="box" :size="20" />
      </span>
      <small>
        ACTIVE RECORDS
      </small>
      <strong>
        {{ items.filter((item) => item.status !== 'Retired').length }}
      </strong>
    </article>
    <article class="inventory-summary">
      <span class="inventory-summary-icon">
        <AppIcon name="check" :size="20" />
      </span>
      <small>
        AVAILABLE UNITS
      </small>
      <strong>
        {{ items.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0) }}
      </strong>
    </article>
    <article class="inventory-summary">
      <span class="inventory-summary-icon">
        <AppIcon name="people" :size="20" />
      </span>
      <small>ASSIGNED ITEMS</small>
      <strong>
        {{ items.filter((item) => item.status === "Assigned" || item.custodian).length }}
      </strong>
    </article>
    <article class="inventory-summary"><span class="inventory-summary-icon"><AppIcon name="alert" :size="20" /></span><small>LOW STOCK ALERTS</small><strong>{{ items.filter(item => Number(item.minimumStock || 0) > 0 && Number(item.availableQuantity || 0) <= Number(item.minimumStock || 0)).length }}</strong></article>
  </section>
  <section class="inventory-toolbar workspace-panel">
    <label class="inventory-search">
      <AppIcon name="search" :size="18" />
      <input v-model="search" placeholder="Search item, serial number, location or custodian…" />
    </label>
    <label>
      Owner department
      <select v-model="departmentFilter" class="input">
        <option value="">
          All departments
        </option>
        <option v-for="department in departments" :key="department._id" :value="department._id">
          {{ department.name }}
        </option>
      </select>
    </label>
    <label>
      Category
      <select v-model="categoryFilter" class="input">
        <option value="">
          All categories
        </option>
        <option v-for="category in categories" :key="category">
          {{ category }}
        </option>
      </select>
    </label>
    <span class="inventory-result-count">
      {{ filtered.length }} items
    </span>
  </section>
  <div class="inventory-presets" aria-label="Inventory by owner">
    <button type="button" :class="{ active: !departmentFilter }" @click="setDepartmentPreset('all')">
      <AppIcon name="box" :size="16" />
      All inventory
    </button>
    <button
      type="button"
      :class="{ active: departmentFilter && /information technology|\bit\b/i.test(departmentName(departmentFilter)) }"
      @click="setDepartmentPreset('it')"
    >
      <AppIcon name="laptop" :size="16" />
      IT inventory
    </button>
    <button
      type="button"
      :class="{ active: departmentFilter && /administration|\badmin\b/i.test(departmentName(departmentFilter)) }"
      @click="setDepartmentPreset('admin')"
    >
      <AppIcon name="company" :size="16" />
      Admin inventory
    </button>
  </div>
  <section v-if="showForm" ref="inventoryFormSection" class="workspace-panel inventory-form-panel">
    <header class="section-title-row">
      <div>
        <span class="eyebrow">
          INVENTORY RECORD
        </span>
        <h2>
          {{ editingId ? "Edit inventory item" : "Add inventory item" }}
        </h2>
      </div>
      <button class="icon-button" type="button" aria-label="Close form" @click="showForm = false">
        <AppIcon name="close" :size="18" />
      </button>
    </header>
    <form class="inventory-form-grid" @submit.prevent="save">
      <label>
        Item name
        <input v-model="form.name" class="input" required />
      </label>
      <label>
        Category
        <input v-model="form.category" class="input" required />
      </label>
      <label>Description <input v-model="form.description" class="input" placeholder="Item specification or description" /></label>
      <label>Supplier <input v-model="form.supplier" class="input" /></label>
      <label>Purchase reference <input v-model="form.purchaseReference" class="input" placeholder="PO / invoice / requisition" /></label>
      <label>Condition <select v-model="form.condition" class="input"><option>New</option><option>Good</option><option>Fair</option><option>Damaged</option><option>Lost</option><option>Unknown</option></select></label>
      <label>Minimum stock alert <input v-model.number="form.minimumStock" class="input" type="number" min="0" /></label>
      <label>
        Item code
        <input v-model="form.itemCode" class="input" />
      </label>
      <label>
        Serial number
        <input v-model="form.serialNumber" class="input" />
      </label>
      <label>
        Owner department
        <select v-model="form.ownerDepartment" class="input">
          <option value="">
            Unassigned
          </option>
          <option v-for="department in departments" :key="department._id" :value="department._id">
            {{ department.name }}
          </option>
        </select>
      </label>
      <label>
        Custodian
        <select v-model="form.custodian" class="input">
          <option value="">
            Unassigned
          </option>
          <option v-for="person in employees" :key="person._id" :value="person._id">
            {{ person.firstName }} {{ person.lastName }}
          </option>
        </select>
      </label>
      <label>
        Total quantity
        <input v-model.number="form.quantity" class="input" type="number" min="0" required />
      </label>
      <label>
        Available quantity
        <input v-model.number="form.availableQuantity" class="input" type="number" min="0" required />
      </label>
      <label>
        Unit
        <input v-model="form.unit" class="input" placeholder="unit, pack, box…" />
      </label>
      <label>
        Status
        <select v-model="form.status" class="input">
          <option>
            Available
          </option>
          <option>
            Assigned
          </option>
          <option>
            Low Stock
          </option>
          <option>
            Damaged
          </option>
          <option>
            Retired
          </option>
        </select>
      </label>
      <label>
        Location
        <input v-model="form.location" class="input" placeholder="IT store / Admin office / Floor 2" />
      </label>
      <label>
        Purchase date
        <input v-model="form.purchaseDate" class="input" type="date" />
      </label>
      <label class="inventory-notes">
        Notes
        <textarea v-model="form.notes" class="textarea" rows="3">
        </textarea>
      </label>
      <div class="form-actions inventory-form-actions">
        <button class="action-secondary" type="button" @click="showForm = false">
          Cancel
        </button>
        <button class="action-primary" type="submit" :disabled="saving">
          {{ saving ? "Saving…" : "Save record" }}
          <AppIcon name="check" :size="17" />
        </button>
      </div>
    </form>
  </section>
  <section v-if="movementItem" class="workspace-panel inventory-form-panel movement-panel">
    <header class="section-title-row"><div><span class="eyebrow">STOCK CONTROL</span><h2>{{ movementForm.movementType }} · {{ movementItem.name }}</h2><p>Current balance: {{ movementItem.availableQuantity }} available of {{ movementItem.quantity }} {{ movementItem.unit || "unit" }}.</p></div><button class="icon-button" type="button" aria-label="Close movement form" @click="movementItem = null"><AppIcon name="close" :size="18" /></button></header>
    <form class="inventory-form-grid" @submit.prevent="saveMovement">
      <label>Movement type<select v-model="movementForm.movementType" class="input"><option>Stock In</option><option>Goods Receipt</option><option>Return</option><option>Stock Out</option><option>Damaged</option><option>Lost</option><option>Stock Transfer</option><option>Stock Adjustment</option><option>Custody</option></select></label>
      <label v-if="movementForm.movementType !== 'Custody'">Quantity <input v-model.number="movementForm.quantity" class="input" type="number" :min="movementForm.movementType === 'Stock Adjustment' ? -999999 : 0.01" step="0.01" required /></label>
      <label v-if="movementForm.movementType === 'Stock Transfer'">Destination item<select v-model="movementForm.destinationItem" class="input" required><option value="">Select destination</option><option v-for="option in items.filter(x => x._id !== movementItem?._id)" :key="option._id" :value="option._id">{{ option.name }} · {{ option.location || "No location" }}</option></select></label>
      <label v-if="['Custody','Stock Out'].includes(movementForm.movementType)">Custodian <select v-model="movementForm.custodian" class="input" :required="movementForm.movementType === 'Custody'"><option value="">{{ movementForm.movementType === 'Custody' ? 'Select employee' : 'Optional — issue to employee' }}</option><option v-for="person in employees" :key="person._id" :value="person._id">{{ person.firstName }} {{ person.lastName }}</option></select></label>
      <label>Location / destination <input v-model="movementForm.toLocation" class="input" placeholder="Store, office, floor…" /></label>
      <label>Reference type <select v-model="movementForm.referenceType" class="input"><option value="">No linked reference</option><option value="Purchase Request">Purchase Request</option><option value="Procurement">Procurement</option><option value="Approval Memo">Approval Memo</option><option value="Other">Other</option></select></label>
      <label v-if="movementForm.referenceType === 'Procurement'">Approved purchase request<select v-model="movementForm.referenceId" class="input" @change="movementForm.reference = purchaseRequests.find(p => p._id === movementForm.referenceId)?.requestNo || ''"><option value="">Select approved request</option><option v-for="purchase in purchaseRequests.filter(p => ['Approved','Completed'].includes(p.status))" :key="purchase._id" :value="purchase._id">{{ purchase.requestNo }} · {{ purchase.title }}</option></select><small v-if="!purchaseRequests.length">No procurement records available or your role cannot view them.</small></label>
      <label v-if="movementForm.referenceType === 'Approval Memo'">Approved purchase Approval Memo<select v-model="movementForm.referenceId" class="input" @change="movementForm.reference = approvedMemos.find(m => m._id === movementForm.referenceId)?.title || ''"><option value="">Select approved memo</option><option v-for="memo in approvedMemos" :key="memo._id" :value="memo._id">{{ memo.title }} · {{ memo.status }}</option></select><small v-if="!approvedMemos.length">No approved purchase memos available or your role cannot view them.</small></label>
      <label>Reference number <input v-model="movementForm.reference" class="input" placeholder="PO / request / delivery reference" /></label>
      <label class="inventory-notes">Notes <textarea v-model="movementForm.notes" class="textarea" rows="2" placeholder="Condition, verification, reason or handover details…"></textarea></label>
      <div v-if="movementError" class="alert alert-error inventory-notes">{{ movementError }}</div>
      <div class="form-actions inventory-form-actions"><button class="action-secondary" type="button" @click="movementItem = null">Cancel</button><button class="action-primary" type="submit" :disabled="movementSaving">{{ movementSaving ? "Recording…" : "Record movement" }}<AppIcon name="check" :size="17" /></button></div>
    </form>
  </section>
  <section v-if="historyItem" class="workspace-panel inventory-table-panel movement-history-panel">
    <header class="section-title-row"><div><span class="eyebrow">AUDIT TRAIL</span><h2>Movement history · {{ historyItem.name }}</h2></div><button class="icon-button" type="button" aria-label="Close movement history" @click="historyItem = null"><AppIcon name="close" :size="18" /></button></header>
    <div v-if="historyLoading" class="panel-empty">Loading movement history…</div>
    <div v-else-if="!movementHistory.length" class="panel-empty">No stock movements recorded for this item yet.</div>
    <div v-else class="inventory-table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Movement</th><th>Quantity</th><th>Balance</th><th>Performed by</th><th>Date</th><th>Notes</th></tr></thead><tbody><tr v-for="move in movementHistory" :key="move._id"><td>{{ move.movementNo }}</td><td>{{ move.movementType }}</td><td>{{ move.quantity }}</td><td>{{ move.availableBefore }} → {{ move.availableAfter }}</td><td>{{ move.performedBy?.firstName || "—" }} {{ move.performedBy?.lastName || "" }}</td><td>{{ move.occurredAt ? new Date(move.occurredAt).toLocaleString() : "—" }}</td><td>{{ move.notes || move.reference || "—" }}</td></tr></tbody></table></div>
  </section>
  <section class="workspace-panel inventory-table-panel">
    <div v-if="loading" class="panel-empty">
      Loading inventory records…
    </div>
    <div v-else-if="!filtered.length" class="panel-empty">
      <AppIcon name="box" :size="28" />
      <strong>
        No inventory records
      </strong>
      <p>
        Add an item or import your inventory from CSV.
      </p>
    </div>
    <div v-else class="inventory-table-wrap">
      <table class="data-table inventory-table">
        <thead>
          <tr>
            <th>
              Item
            </th>
            <th>
              Category / code
            </th>
            <th>
              Owner
            </th>
            <th>
              Custodian
            </th>
            <th>
              Quantity
            </th>
            <th>
              Location
            </th>
            <th>
              Status
            </th>
            <th>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item._id">
            <td>
              <strong>
                {{ item.name }}
              </strong>
              <small>
                {{ item.serialNumber || "No serial number" }}
              </small>
            </td>
            <td>
              {{ item.category || "General" }}
              <small>
                {{ item.itemCode || "No item code" }}
              </small>
            </td>
            <td>
              {{ departmentName(item.ownerDepartment) }}
            </td>
            <td>
              {{ employeeName(item.custodian) }}
            </td>
            <td>
              <strong>
                {{ item.availableQuantity ?? 0 }}
              </strong>
              / {{ item.quantity ?? 0 }} {{ item.unit || "unit" }}
            </td>
            <td>
              {{ item.location || "—" }}
            </td>
            <td>
              <span class="inventory-status" :class="Number(item.minimumStock || 0) > 0 && Number(item.availableQuantity || 0) <= Number(item.minimumStock || 0) ? 'low-stock' : String(item.status || '').toLowerCase().replace(/\s+/g, '-')">
                {{ Number(item.minimumStock || 0) > 0 && Number(item.availableQuantity || 0) <= Number(item.minimumStock || 0) ? 'Low Stock' : (item.status || "Available") }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="icon-button" type="button" :aria-label="`Record movement for ${item.name}`" title="Stock movement" @click="openMovement(item)"><AppIcon name="arrow-left-right" :size="17" /></button>
                <button class="icon-button" type="button" :aria-label="`View movement history for ${item.name}`" title="Movement history" @click="viewHistory(item)"><AppIcon name="history" :size="17" /></button>
                <button class="icon-button" type="button" :aria-label="`Edit ${item.name}`" @click="edit(item)">
                  <AppIcon name="edit" :size="17" />
                </button>
                <button class="icon-button danger" type="button" :aria-label="`Retire ${item.name}`" @click="retire(item)">
                  <AppIcon name="trash" :size="17" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</div>
</template>

