<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const route = useRoute();
const router = useRouter();
const service = ref(null);
const services = ref([]);
const employees = ref([]);
const sbus = ref([]);
const workflows = ref([]);
const workspace = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");
const tickets = ref([]);
const ticketsLoading = ref(false);
const ticketSearch = ref("");
const ticketFilter = ref("all");
const selectedTicket = ref(null);
const ticketComment = ref("");
const commentSaving = ref(false);
const ticketSaving = ref(false);
const ticketError = ref("");
const ticketSuccess = ref("");
const solutionSearch = ref("");
const openSolution = ref("");
const itForm = ref({
  category: "Hardware",
  title: "",
  details: "",
  priority: "Normal",
  device: "",
  assetTag: "",
  location: "",
  impact: "One employee",
  startedAt: "",
  contactMethod: "Email",
});
const solutions = [
  { id: "network", category: "Network & internet", title: "I cannot connect to Wi-Fi or the office network", symptoms: "No internet, limited connectivity, cannot reach shared resources.", steps: ["Check whether other colleagues are affected.", "Confirm Wi-Fi is enabled or reconnect the Ethernet cable.", "Restart the affected application and check again.", "If the issue remains, submit a ticket with your location and whether you use Wi-Fi or LAN."], escalate: "Do not reset office routers, switches, or access points yourself." },
  { id: "password", category: "Accounts & access", title: "I cannot sign in or access a work account", symptoms: "Password rejected, account locked, permission denied.", steps: ["Confirm you are using your official work email and the correct sign-in page.", "Check Caps Lock and your keyboard language.", "If password reset is available, use the approved company reset process.", "If access is still blocked, submit a ticket and include the application name and exact error."], escalate: "Never send your password or one-time verification code in a ticket." },
  { id: "email", category: "Email & communication", title: "Email is not sending, receiving, or syncing", symptoms: "Messages stuck in outbox, missing messages, mailbox or signature issue.", steps: ["Check your internet connection and mailbox storage if visible.", "Try the webmail or approved mail client if available.", "Record whether the issue affects sending, receiving, or both.", "For a signature issue, include the email client and a screenshot with private information hidden."], escalate: "Never attach confidential email content unless your company policy allows it." },
  { id: "slow", category: "Laptop & performance", title: "My laptop is slow, freezing, or overheating", symptoms: "Slow startup, apps not responding, fan noise, unexpected shutdown.", steps: ["Save your work and close applications you do not need.", "Restart once if it is safe to do so.", "Note when the issue happens and whether a particular application triggers it.", "Submit a ticket with the device asset tag and any error message."], escalate: "If you smell burning, see smoke, or notice a swollen battery, stop using the device and contact IT urgently." },
  { id: "printer", category: "Printers & peripherals", title: "Printer, monitor, keyboard, or other accessory is not working", symptoms: "Printer offline, paper jam, missing display, keyboard or mouse failure.", steps: ["Check power and cable connections.", "For a printer, check paper, visible jams, and the selected printer queue.", "Try another approved cable or port only if available.", "Submit a ticket naming the device, location, and any displayed error."], escalate: "Do not open electrical equipment or attempt hardware repairs yourself." },
  { id: "software", category: "Software & applications", title: "I need software help or an application is failing", symptoms: "Application crash, installation request, update issue, or access error.", steps: ["Record the application name and the action that causes the issue.", "Capture the exact error message.", "Restart the application and retry once.", "Submit a ticket for installation, licensing, or persistent errors."], escalate: "Do not install unapproved software or share license keys in ticket comments." },
  { id: "security", category: "Security concern", title: "I clicked a suspicious link or suspect a security incident", symptoms: "Unexpected sign-in prompt, suspicious attachment, lost device, or unusual account activity.", steps: ["Stop interacting with the suspicious message or page.", "Do not forward the link to colleagues or enter more credentials.", "Report it immediately through the IT ticket form and choose Urgent or Critical based on impact.", "Follow IT/security instructions before deleting messages or changing settings."], escalate: "For a suspected active compromise, contact IT directly using the approved urgent channel as well as logging a ticket." },
];
const visibleSolutions = computed(() => {
  const q = solutionSearch.value.trim().toLowerCase();
  if (!q) return solutions;
  return solutions.filter((item) => [item.title, item.category, item.symptoms, ...item.steps].join(" ").toLowerCase().includes(q));
});
const visibleTickets = computed(() => {
  const q = ticketSearch.value.trim().toLowerCase();
  return tickets.value.filter((ticket) => {
    const matchesFilter = ticketFilter.value === "all" || (ticketFilter.value === "open" ? !["Completed", "Rejected", "Cancelled"].includes(ticket.status) : ticket.status === ticketFilter.value);
    const matchesQuery = !q || [ticket.ticketNo, ticket.title, ticket.category, ticket.status, ticket.details].join(" ").toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });
});
const isSupportStaff = computed(() => {
  const role = employee.value?.role || {};
  const permissions = role.permissions || [];
  return permissions.includes("*") || permissions.includes("it.support.manage") || permissions.includes("service-requests.manage") || /admin|it support|it specialist|helpdesk|help desk/i.test(`${role.code || ""} ${role.name || ""}`);
});
const form = ref({
  title: "",
  details: "",
  recipients: [],
  requestingSbu: "",
  workflow: "",
  priority: "Normal",
  department: "",
  role: "",
  headcount: 1,
  item: "",
  reason: "",
});

const builtIns = {
  "general-memo": { slug: "general-memo", name: "Simple Memo", category: "Communication", actionType: "memo-simple", moduleId: "communication" },
  "approval-memo": { slug: "approval-memo", name: "Approval Memo", category: "Communication", actionType: "memo-approval", moduleId: "communication" },
  "it-support": { slug: "it-support", name: "IT Support", category: "IT", actionType: "it-request", moduleId: "it" },
  "it-maintenance": { slug: "it-maintenance", name: "IT Maintenance", category: "IT", actionType: "it-request", moduleId: "it" },
  "software-installation": { slug: "software-installation", name: "Software Installation", category: "IT", actionType: "it-request", moduleId: "it" },
  "internet-subscription": { slug: "internet-subscription", name: "Internet Subscription", category: "IT", actionType: "it-request", moduleId: "it" },
  "employee-information": { slug: "employee-information", name: "Employee Information Request", category: "People & HR", actionType: "service-request", moduleId: "hr" },
  "recruitment": { slug: "recruitment", name: "Recruitment Request", category: "People & HR", actionType: "recruitment", moduleId: "hr" },
  "fuel-request": { slug: "fuel-request", name: "Fuel Request", category: "Workplace", actionType: "service-request", moduleId: "workplace" },
  "vehicle-repair": { slug: "vehicle-repair", name: "Vehicle Repair", category: "Workplace", actionType: "service-request", moduleId: "workplace" },
  "office-furniture": { slug: "office-furniture", name: "Office Furniture", category: "Workplace", actionType: "service-request", moduleId: "workplace" },
};

const action = computed(() => service.value?.actionType || "service-request");
const enabled = computed(() => {
  const id = service.value?.moduleId;
  if (!id) return true;
  const module = workspace.value?.modules?.find((item) => item.id === id);
  return module ? Boolean(module.enabled) : true;
});
const employee = computed(() => getSavedEmployee());

function back() {
  router.push(`/services/${route.params.slug}`);
}
function scrollToTicket() {
  document.getElementById("it-ticket-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => document.querySelector("#it-ticket-form input")?.focus({ preventScroll: true }), 350);
}
function scrollToTracker() {
  document.querySelector(".it-ticket-tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function load() {
  loading.value = true;
  error.value = "";
  const slug = String(route.params.slug || "").toLowerCase();
  const [serviceResult, workspaceResult] = await Promise.allSettled([
    api.listBusinessServices(),
    api.getCompanyWorkspace(),
  ]);
  services.value = serviceResult.status === "fulfilled"
    ? normalizeList(serviceResult.value, ["services", "businessServices"])
    : [];
  if (workspaceResult.status === "fulfilled") workspace.value = workspaceResult.value?.data || workspaceResult.value;
  service.value = services.value.find((item) => String(item.slug || "").toLowerCase() === slug) || builtIns[slug] || null;

  if (!service.value) {
    error.value = "This service is not configured yet.";
    loading.value = false;
    return;
  }

  try {
    if (action.value === "it-request") {
      await loadTickets();
      if (isSupportStaff.value) {
        try { employees.value = normalizeList(await api.listEmployees(), ["employees"]); } catch { /* Ticket review remains available if the directory cannot load. */ }
      }
    }
    if (action.value === "memo-simple") {
      employees.value = normalizeList(await api.listEmployeeDirectory(), ["employees"]);
    } else if (action.value === "memo-approval") {
      const [sbuResult, workflowResult] = await Promise.all([
        api.listSBUs(),
        api.listWorkflows(),
      ]);
      sbus.value = normalizeList(sbuResult, ["sbus", "SBUs"]);
      workflows.value = normalizeList(workflowResult, ["workflows"]);
    }
  } catch (err) {
    error.value = err.message || "Some setup data could not be loaded.";
  } finally {
    loading.value = false;
  }
}

async function submitMemo(type) {
  if (!form.value.title.trim() || !form.value.details.trim()) {
    throw new Error("Title and message are required.");
  }
  if (type === "simple" && !form.value.recipients.length) {
    throw new Error("Choose at least one recipient.");
  }
  if (type === "approval" && !form.value.requestingSbu) {
    throw new Error("Choose the requesting SBU.");
  }

  const serviceRecord = services.value.find((item) => item.slug === service.value.slug)
    || services.value.find((item) => item.slug === (type === "simple" ? "general-memo" : "approval-memo"));
  if (type === "approval" && !serviceRecord?._id) {
    throw new Error("The approval memo service has not been configured. Ask an administrator to seed the service catalogue.");
  }

  const payload = {
    title: form.value.title.trim(),
    body: form.value.details.trim(),
    memoType: type,
    priority: form.value.priority,
    ...(type === "simple"
      ? { recipients: form.value.recipients }
      : {
          businessService: serviceRecord._id,
          requestingSbu: form.value.requestingSbu,
          workflow: form.value.workflow || undefined,
        }),
  };
  const result = await api.createMemo(payload);
  const memo = result?.data || result?.memo || result;
  if (!memo?._id) throw new Error("Memo was created but no memo ID was returned.");
  router.push(`/memos/${memo._id}`);
}

async function loadTickets() {
  ticketsLoading.value = true;
  ticketError.value = "";
  try {
    tickets.value = normalizeList(await api.listServiceRequests({ category: "IT" }), ["requests", "serviceRequests"]);
    if (selectedTicket.value?._id) {
      const refreshed = tickets.value.find((item) => item._id === selectedTicket.value._id);
      if (refreshed) selectedTicket.value = refreshed;
    }
  } catch (err) {
    ticketError.value = err.message || "Unable to load your support tickets.";
  } finally {
    ticketsLoading.value = false;
  }
}

function resetItForm() {
  itForm.value = { category: "Hardware", title: "", details: "", priority: "Normal", device: "", assetTag: "", location: "", impact: "One employee", startedAt: "", contactMethod: "Email" };
}

async function submitItTicket() {
  ticketError.value = "";
  ticketSuccess.value = "";
  if (!itForm.value.title.trim() || !itForm.value.details.trim()) {
    ticketError.value = "Add a clear issue title and describe what is happening.";
    return;
  }
  ticketSaving.value = true;
  try {
    const payload = {
      serviceId: service.value?._id,
      title: itForm.value.title.trim(),
      details: itForm.value.details.trim(),
      category: "IT",
      priority: itForm.value.priority,
      metadata: {
        actionType: "it-request",
        device: itForm.value.device.trim(),
        assetTag: itForm.value.assetTag.trim(),
        location: itForm.value.location.trim(),
        impact: itForm.value.impact,
        startedAt: itForm.value.startedAt || "",
        contactMethod: itForm.value.contactMethod,
        source: "IT Solution Center",
      },
    };
    const result = await api.createServiceRequest(payload);
    const ticket = result?.data || result?.request || result;
    ticketSuccess.value = `Ticket ${ticket.ticketNo || ticket._id || "created"} logged successfully. Keep the ticket number for follow-up.`;
    resetItForm();
    await loadTickets();
    if (ticket?._id) selectedTicket.value = tickets.value.find((item) => item._id === ticket._id) || ticket;
  } catch (err) {
    ticketError.value = err.message || "Unable to log this IT issue.";
  } finally {
    ticketSaving.value = false;
  }
}

async function openTicket(ticket) {
  ticketError.value = "";
  ticketSuccess.value = "";
  try {
    const result = await api.getServiceRequest(ticket._id);
    selectedTicket.value = result?.data || result;
  } catch (err) {
    selectedTicket.value = ticket;
    ticketError.value = err.message || "Unable to load ticket activity.";
  }
}

async function postTicketComment() {
  if (!selectedTicket.value?._id || !ticketComment.value.trim()) return;
  commentSaving.value = true;
  ticketError.value = "";
  try {
    const result = await api.addServiceRequestComment(selectedTicket.value._id, ticketComment.value.trim());
    selectedTicket.value = result?.data || result;
    ticketComment.value = "";
    await loadTickets();
  } catch (err) {
    ticketError.value = err.message || "Unable to add this update.";
  } finally {
    commentSaving.value = false;
  }
}

async function assignTicket(employeeId) {
  if (!selectedTicket.value?._id) return;
  ticketSaving.value = true;
  ticketError.value = "";
  try {
    const result = await api.updateServiceRequest(selectedTicket.value._id, { assignedTo: employeeId || null });
    selectedTicket.value = result?.data || result;
    await loadTickets();
  } catch (err) {
    ticketError.value = err.message || "Unable to assign this ticket.";
  } finally {
    ticketSaving.value = false;
  }
}

async function updateTicketStatus(status) {
  if (!selectedTicket.value?._id) return;
  ticketSaving.value = true;
  ticketError.value = "";
  try {
    const result = await api.updateServiceRequest(selectedTicket.value._id, { status, message: `IT support changed the status to ${status}.` });
    selectedTicket.value = result?.data || result;
    await loadTickets();
  } catch (err) {
    ticketError.value = err.message || "Unable to update ticket status. Check that your account has IT support permissions.";
  } finally {
    ticketSaving.value = false;
  }
}

function formatTicketDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusClass(status) {
  return String(status || "submitted").toLowerCase().replace(/[^a-z]+/g, "-");
}

async function submitGeneric() {
  if (!form.value.title.trim() || !form.value.details.trim()) {
    throw new Error("Title and details are required.");
  }
  const result = await api.createServiceRequest({
    serviceId: service.value?._id,
    title: form.value.title.trim(),
    details: form.value.details.trim(),
    priority: form.value.priority,
    metadata: {
      actionType: action.value,
      department: form.value.department,
      role: form.value.role,
      headcount: Number(form.value.headcount) || 1,
      item: form.value.item,
      reason: form.value.reason,
    },
  });
  const request = result?.data || result;
  success.value = `Request submitted${request?._id ? ` (${request._id})` : ""}. You can follow it from My Work.`;
  form.value.title = "";
  form.value.details = "";
}

async function submit() {
  error.value = "";
  success.value = "";
  saving.value = true;
  try {
    if (action.value === "it-request") return await submitItTicket();
    if (action.value === "memo-simple") return await submitMemo("simple");
    if (action.value === "memo-approval") return await submitMemo("approval");
    if (action.value === "signature") return router.push("/email-signature");
    if (action.value === "leave") return router.push("/leave");
    if (action.value === "procurement") return router.push("/procurement/requests/new");
    if (action.value === "people") return router.push("/people");
    if (action.value === "approvals") return router.push("/approvals");
    await submitGeneric();
  } catch (err) {
    error.value = err.message || "Unable to submit this request.";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => { await load(); if (route.query.section === "ticket" || route.query.action === "ticket") { requestAnimationFrame(() => { document.getElementById("it-ticket-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); document.querySelector("#it-ticket-form input")?.focus({ preventScroll: true }); }); } });
</script>

<template>
  <div class="experience-page service-action-page">
    <button class="text-button back-link" type="button" @click="back">
      <AppIcon name="chevron" :size="16" /> Services
    </button>

    <section v-if="loading" class="workspace-panel panel-empty">Preparing service…</section>
    <section v-else-if="error && !service" class="workspace-panel service-detail-state">
      <AppIcon name="file" :size="28" /><strong>{{ error }}</strong>
      <button class="action-secondary" type="button" @click="back">Back to service</button>
    </section>
    <template v-else-if="service">
      <header class="page-intro-row service-action-header">
        <div><span class="eyebrow">{{ service.category }}</span><h1>{{ service.name }}</h1><p>Complete the details below. MemoFlo will send it to the relevant recipient or request queue.</p><div class="service-quick-actions"><button v-if="action === 'it-request'" type="button" class="action-primary" @click="scrollToTicket()">Log a Ticket</button><button v-if="action === 'it-request'" type="button" class="action-secondary" @click="scrollToTracker()">Track Tickets</button></div></div>
      </header>
      <div v-if="!enabled" class="service-disabled-panel"><strong>Service unavailable</strong><p>This service is disabled for your company. Contact your administrator.</p></div>
      <template v-else-if="action === 'it-request'">
        <div class="it-center-intro">
          <div class="it-center-copy"><span class="it-center-kicker">MEMOFLO IT SOLUTION CENTER</span><h2>Get help. Find a fix. Track every issue.</h2><p>Search self-help guides, log a technical issue, and follow its progress from submission to resolution.</p></div>
          <div class="it-center-stats"><div><strong>{{ tickets.length }}</strong><span>Total tickets</span></div><div><strong>{{ tickets.filter(t => !['Completed','Rejected','Cancelled'].includes(t.status)).length }}</strong><span>Open tickets</span></div><div><strong>{{ tickets.filter(t => t.status === 'Completed').length }}</strong><span>Resolved</span></div></div>
        </div>

        <section class="it-center-section it-solutions-panel">
          <div class="it-section-heading"><div><span class="eyebrow">SELF-SERVICE KNOWLEDGE BASE</span><h2>Try a quick solution first</h2><p>Step-by-step guidance for common workplace technology problems.</p></div><label class="it-search"><AppIcon name="search" :size="17" /><input v-model="solutionSearch" placeholder="Search problems or solutions…" aria-label="Search help articles" /></label></div>
          <div class="it-solution-grid">
            <article v-for="solution in visibleSolutions" :key="solution.id" class="it-solution-card" :class="{ expanded: openSolution === solution.id }">
              <button class="it-solution-toggle" type="button" @click="openSolution = openSolution === solution.id ? '' : solution.id"><span class="it-solution-category">{{ solution.category }}</span><strong>{{ solution.title }}</strong><small>{{ solution.symptoms }}</small><span class="it-solution-open">{{ openSolution === solution.id ? 'Hide steps −' : 'View steps +' }}</span></button>
              <div v-if="openSolution === solution.id" class="it-solution-steps"><ol><li v-for="step in solution.steps" :key="step">{{ step }}</li></ol><p class="it-solution-escalation">{{ solution.escalate }}</p><button type="button" class="action-secondary" @click="itForm.category = solution.category.includes('Network') ? 'Network & Internet' : solution.category.includes('Account') ? 'Accounts & Access' : solution.category.includes('Email') ? 'Email & Communication' : solution.category.includes('Laptop') ? 'Hardware' : solution.category.includes('Printer') ? 'Hardware' : solution.category.includes('Software') ? 'Software & Applications' : 'Security'; itForm.title = solution.title; document.getElementById('it-ticket-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })">Still need help? Log a ticket</button></div>
            </article>
            <div v-if="!visibleSolutions.length" class="it-empty-state">No guide matched that search. Try another keyword or log a ticket below.</div>
          </div>
        </section>

        <section id="it-ticket-form" class="it-center-section it-ticket-form-panel">
          <div class="it-section-heading"><div><span class="eyebrow">CONTACT IT SUPPORT</span><h2>Log a new support ticket</h2><p>Include enough detail for IT to diagnose the issue without repeated follow-up.</p></div><span class="it-private-note"><AppIcon name="shield" :size="17" /> Company support queue</span></div>
          <form class="it-ticket-form" @submit.prevent="submitItTicket">
            <div class="it-form-grid">
              <label class="form-field">Issue category<select v-model="itForm.category" class="input" required><option>Hardware</option><option>Software & Applications</option><option>Network & Internet</option><option>Accounts & Access</option><option>Email & Communication</option><option>Printers & Peripherals</option><option>Data & Business Systems</option><option>Security</option><option>Other</option></select></label>
              <label class="form-field">Short issue title<input v-model="itForm.title" class="input" maxlength="180" placeholder="e.g. Laptop cannot connect to office Wi-Fi" required /></label>
              <label class="form-field">Affected device / system<input v-model="itForm.device" class="input" placeholder="Laptop model, app, printer, account…" /></label>
              <label class="form-field">Asset tag (if known)<input v-model="itForm.assetTag" class="input" placeholder="e.g. IT-LT-024" /></label>
              <label class="form-field">Office / location<input v-model="itForm.location" class="input" placeholder="Branch, floor, room, or remote" /></label>
              <label class="form-field">Who is affected?<select v-model="itForm.impact" class="input"><option>One employee</option><option>Several employees</option><option>Entire team / department</option><option>Multiple departments / business stopped</option></select></label>
              <label class="form-field">When did it start?<input v-model="itForm.startedAt" class="input" type="datetime-local" /></label>
              <label class="form-field">Preferred response channel<select v-model="itForm.contactMethod" class="input"><option>Email</option><option>Phone</option><option>In-person</option><option>MemoFlo notification</option></select></label>
              <label class="form-field">Priority<select v-model="itForm.priority" class="input"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option><option>Critical</option></select><small class="field-help">Use Critical only when business operations are stopped or there is an active security/safety concern.</small></label>
              <label class="form-field it-full-width">Describe the issue<textarea v-model="itForm.details" class="textarea" rows="5" maxlength="12000" placeholder="What were you trying to do? What happened instead? Include exact error messages and steps already tried. Do not include passwords or verification codes." required></textarea></label>
            </div>
            <div v-if="ticketError" class="alert alert-error">{{ ticketError }}</div><div v-if="ticketSuccess" class="alert alert-success">{{ ticketSuccess }}</div>
            <div class="it-form-footer"><p>Every submission receives a ticket reference and an activity history so you can track updates.</p><button class="action-primary" type="submit" :disabled="ticketSaving">{{ ticketSaving ? 'Logging ticket…' : 'Log support ticket' }} <AppIcon name="arrow" :size="17" /></button></div>
          </form>
        </section>

        <section class="it-center-section it-ticket-tracker">
          <div class="it-section-heading"><div><span class="eyebrow">TICKET MANAGEMENT</span><h2>{{ isSupportStaff ? 'IT support queue' : 'Your support tickets' }}</h2><p>{{ isSupportStaff ? 'Review incoming issues, open ticket history, and update status.' : 'Every ticket you have submitted, with its current status and conversation history.' }}</p></div><button type="button" class="action-secondary" @click="loadTickets" :disabled="ticketsLoading"><AppIcon name="refresh" :size="16" /> {{ ticketsLoading ? 'Refreshing…' : 'Refresh' }}</button></div>
          <div class="it-ticket-tools"><label class="it-search"><AppIcon name="search" :size="17" /><input v-model="ticketSearch" placeholder="Search ticket number, title, category…" aria-label="Search tickets" /></label><select v-model="ticketFilter" class="input" aria-label="Filter tickets"><option value="all">All statuses</option><option value="open">Open tickets</option><option>Submitted</option><option>Assigned</option><option>In Progress</option><option>Waiting on Employee</option><option>On Hold</option><option>Completed</option><option>Rejected</option><option>Cancelled</option></select></div>
          <div v-if="ticketError && !selectedTicket" class="alert alert-error">{{ ticketError }}</div>
          <div v-if="ticketsLoading" class="it-empty-state">Loading ticket register…</div>
          <div v-else-if="!visibleTickets.length" class="it-empty-state"><AppIcon name="check-circle" :size="25" /><strong>No matching tickets</strong><span>New support tickets will appear here after you submit them.</span></div>
          <div v-else class="it-ticket-list"><button v-for="ticket in visibleTickets" :key="ticket._id" type="button" class="it-ticket-row" :class="{ selected: selectedTicket?._id === ticket._id }" @click="openTicket(ticket)"><span class="it-ticket-symbol"><AppIcon name="headphones" :size="20" /></span><span class="it-ticket-summary"><strong>{{ ticket.ticketNo || ticket._id }} · {{ ticket.title }}</strong><small>{{ ticket.category }}<template v-if="ticket.requester"> · {{ ticket.requester.firstName }} {{ ticket.requester.lastName }}</template> · Updated {{ formatTicketDate(ticket.updatedAt || ticket.createdAt) }}</small></span><span class="it-ticket-priority" :class="'priority-' + statusClass(ticket.priority)">{{ ticket.priority || 'Normal' }}</span><span class="it-ticket-status" :class="'status-' + statusClass(ticket.status)">{{ ticket.status }}</span><AppIcon name="chevron" :size="17" /></button></div>

          <section v-if="selectedTicket" class="it-ticket-detail">
            <div class="it-ticket-detail-header"><div><span class="eyebrow">{{ selectedTicket.ticketNo || 'SUPPORT TICKET' }}</span><h3>{{ selectedTicket.title }}</h3><p>{{ selectedTicket.category }} · Opened {{ formatTicketDate(selectedTicket.createdAt) }}</p></div><button type="button" class="icon-button" aria-label="Close ticket details" @click="selectedTicket = null">×</button></div>
            <div class="it-ticket-detail-grid"><div><small>Status</small><strong>{{ selectedTicket.status }}</strong></div><div><small>Priority</small><strong>{{ selectedTicket.priority }}</strong></div><div><small>Assigned to</small><strong>{{ selectedTicket.assignedTo ? `${selectedTicket.assignedTo.firstName} ${selectedTicket.assignedTo.lastName}` : 'Awaiting assignment' }}</strong></div><div><small>Last updated</small><strong>{{ formatTicketDate(selectedTicket.updatedAt) }}</strong></div></div>
            <div class="it-ticket-description"><strong>Issue description</strong><p>{{ selectedTicket.details }}</p><dl v-if="selectedTicket.metadata"><template v-for="entry in [{label:'Device / system',value:selectedTicket.metadata.device},{label:'Asset tag',value:selectedTicket.metadata.assetTag},{label:'Location',value:selectedTicket.metadata.location},{label:'Impact',value:selectedTicket.metadata.impact},{label:'Started',value:selectedTicket.metadata.startedAt},{label:'Preferred contact',value:selectedTicket.metadata.contactMethod}]" :key="entry.label"><div v-if="entry.value"><dt>{{ entry.label }}</dt><dd>{{ entry.value }}</dd></div></template></dl></div>
            <div class="it-ticket-activity"><h4>Ticket activity & updates</h4><div v-if="!selectedTicket.activity?.length" class="it-empty-state">No activity has been recorded yet.</div><div v-for="event in selectedTicket.activity || []" :key="event._id || event.createdAt" class="it-activity-event"><span class="it-activity-dot"></span><div><div class="it-activity-meta"><strong>{{ event.actorName || event.actor?.firstName || 'MemoFlo' }}</strong><time>{{ formatTicketDate(event.createdAt) }}</time></div><p>{{ event.message }}</p><small v-if="event.fromStatus && event.toStatus">{{ event.fromStatus }} → {{ event.toStatus }}</small></div></div></div>
            <div v-if="ticketError" class="alert alert-error">{{ ticketError }}</div>
            <div v-if="isSupportStaff" class="it-support-controls"><label class="form-field">Assigned IT staff<select :value="selectedTicket.assignedTo?._id || ''" class="input" @change="assignTicket($event.target.value)"><option value="">Unassigned</option><option v-for="person in employees" :key="person._id" :value="person._id">{{ person.firstName }} {{ person.lastName }} · {{ person.email }}</option></select></label><label class="form-field">Update ticket status<select :value="selectedTicket.status" class="input" @change="updateTicketStatus($event.target.value)"><option>Submitted</option><option>Assigned</option><option>In Progress</option><option>Waiting on Employee</option><option>On Hold</option><option>Completed</option><option>Rejected</option><option>Cancelled</option></select></label><small>Assignments and status changes are recorded in the activity timeline and audit log.</small></div>
            <form v-if="!['Completed','Rejected','Cancelled'].includes(selectedTicket.status) || isSupportStaff" class="it-ticket-comment" @submit.prevent="postTicketComment"><label class="form-field">Add an update or reply<textarea v-model="ticketComment" class="textarea" rows="3" maxlength="4000" placeholder="Add details, answer an IT question, or share a troubleshooting result…" required></textarea></label><button class="action-primary" type="submit" :disabled="commentSaving || !ticketComment.trim()">{{ commentSaving ? 'Posting…' : 'Post update' }}</button></form>
          </section>
        </section>
      </template>

      <form v-else class="workspace-panel service-action-form" @submit.prevent="submit">
        <div v-if="action === 'memo-simple' || action === 'memo-approval'" class="form-section-title">
          <span class="form-section-icon"><AppIcon :name="action === 'memo-simple' ? 'memo' : 'approval'" :size="22" /></span>
          <span><strong>{{ action === "memo-simple" ? "Direct memo" : "Approval memo" }}</strong><small>{{ action === "memo-simple" ? "Delivered directly to every selected recipient." : "Sent through the selected approval route." }}</small></span>
        </div>

        <label class="form-field">Title<input v-model="form.title" class="input" :placeholder="action === 'memo-simple' ? 'Memo subject' : 'Request title'" required /></label>

        <label v-if="action === 'memo-simple'" class="form-field">
          Recipients <small class="field-help">Select one or more colleagues. Use Ctrl (Windows) or Cmd (Mac) to select multiple names.</small>
          <select v-model="form.recipients" class="input multi-select" multiple required>
            <option v-for="person in employees" :key="person._id" :value="person._id">{{ person.firstName }} {{ person.lastName }} · {{ person.email }}</option>
          </select>
        </label>

        <div v-if="action === 'memo-approval'" class="form-two-col">
          <label class="form-field">Requesting SBU<select v-model="form.requestingSbu" class="input" required><option value="">Select SBU</option><option v-for="sbu in sbus" :key="sbu._id" :value="sbu._id">{{ sbu.name }}</option></select></label>
          <label class="form-field">Workflow<select v-model="form.workflow" class="input"><option value="">Use service workflow</option><option v-for="workflow in workflows" :key="workflow._id" :value="workflow._id">{{ workflow.name }}</option></select></label>
        </div>

        <div v-if="action === 'recruitment'" class="form-two-col">
          <label class="form-field">Department<input v-model="form.department" class="input" placeholder="Department" /></label>
          <label class="form-field">Role / position<input v-model="form.role" class="input" placeholder="Role or position" /></label>
          <label class="form-field">Headcount<input v-model.number="form.headcount" class="input" type="number" min="1" /></label>
        </div>

        <label v-if="action === 'it-request'" class="form-field">Requested item or system<input v-model="form.item" class="input" :placeholder="service.name" /></label>
        <label v-if="action === 'service-request'" class="form-field">Reason / purpose<input v-model="form.reason" class="input" placeholder="Why is this needed?" /></label>
        <label class="form-field">Details<textarea v-model="form.details" class="textarea" rows="7" placeholder="Describe what you need, why it is needed, and any relevant details…" required></textarea></label>
        <label class="form-field">Priority<select v-model="form.priority" class="input"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option><option>Critical</option></select></label>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>
        <div class="form-actions">
          <button type="button" class="action-secondary" @click="back">Cancel</button>
          <button type="submit" class="action-primary" :disabled="saving">{{ saving ? "Submitting…" : "Submit request" }} <AppIcon name="arrow" :size="17" /></button>
        </div>
      </form>
    </template>
  </div>
</template>


<style scoped>
.it-center-intro{display:flex;align-items:center;justify-content:space-between;gap:26px;margin:0 0 22px;padding:28px;border:1px solid var(--mf-border);border-radius:20px;background:linear-gradient(120deg,var(--mf-surface),color-mix(in srgb,var(--company-primary,var(--mf-primary)) 8%,var(--mf-surface)));box-shadow:var(--mf-shadow)}
.it-center-copy{max-width:690px}.it-center-kicker{font-size:10px;font-weight:850;letter-spacing:.13em;color:var(--mf-primary)}.it-center-copy h2{margin:8px 0;font-size:clamp(21px,2.4vw,29px);line-height:1.2;letter-spacing:-.03em}.it-center-copy p,.it-section-heading p{margin:0;color:var(--mf-muted);font-size:13px;line-height:1.65}
.it-center-stats{display:grid;grid-template-columns:repeat(3,minmax(75px,1fr));gap:10px;flex:0 0 auto}.it-center-stats div{display:flex;min-width:78px;flex-direction:column;gap:5px;padding:13px;border:1px solid var(--mf-border);border-radius:13px;background:var(--mf-surface)}.it-center-stats strong{font-size:23px;line-height:1.1}.it-center-stats span{color:var(--mf-muted);font-size:10px}
.it-center-section{margin:20px 0;padding:23px;border:1px solid var(--mf-border);border-radius:18px;background:var(--mf-surface);box-shadow:var(--mf-shadow);scroll-margin-top:20px}.it-section-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:20px}.it-section-heading h2{margin:5px 0 5px;font-size:20px;letter-spacing:-.02em}.it-search{display:flex;align-items:center;gap:9px;min-width:220px;max-width:350px;flex:1;padding:0 12px;border:1px solid var(--mf-border);border-radius:11px;background:var(--mf-surface-soft);color:var(--mf-muted)}.it-search input{width:100%;min-width:0;height:40px;border:0;outline:0;background:transparent;color:var(--mf-text);font:inherit;font-size:12px}.it-solution-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.it-solution-card{min-width:0;border:1px solid var(--mf-border);border-radius:13px;background:var(--mf-surface);overflow:hidden}.it-solution-card.expanded{border-color:color-mix(in srgb,var(--mf-primary) 45%,var(--mf-border))}.it-solution-toggle{display:flex;width:100%;flex-direction:column;align-items:flex-start;gap:8px;padding:16px;border:0;background:transparent;color:var(--mf-text);text-align:left;cursor:pointer}.it-solution-category{color:var(--mf-primary);font-size:10px;font-weight:800;letter-spacing:.04em}.it-solution-toggle strong{font-size:13px;line-height:1.4}.it-solution-toggle small{color:var(--mf-muted);font-size:11px;line-height:1.5}.it-solution-open{margin-top:2px;color:var(--mf-primary);font-size:11px;font-weight:800}.it-solution-steps{padding:0 16px 16px;border-top:1px solid var(--mf-border)}.it-solution-steps ol{padding-left:19px;color:var(--mf-text);font-size:12px;line-height:1.7}.it-solution-steps li{padding:2px 0}.it-solution-escalation{padding:10px 12px;border-radius:9px;background:var(--mf-surface-soft);color:var(--mf-muted);font-size:11px;line-height:1.55}.it-solution-steps .action-secondary{font-size:11px}.it-private-note{display:inline-flex;align-items:center;gap:6px;color:var(--mf-muted);font-size:11px;white-space:nowrap}.it-ticket-form{display:block}.it-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.it-full-width{grid-column:1/-1}.it-form-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:20px;padding-top:18px;border-top:1px solid var(--mf-border)}.it-form-footer p{max-width:520px;margin:0;color:var(--mf-muted);font-size:11px;line-height:1.6}.it-form-footer .action-primary{flex:0 0 auto}.it-ticket-tools{display:flex;gap:12px;margin:0 0 14px}.it-ticket-tools .it-search{max-width:none}.it-ticket-tools select{width:190px;flex:0 0 190px}.it-ticket-list{display:flex;flex-direction:column}.it-ticket-row{display:flex;align-items:center;gap:13px;width:100%;padding:14px 10px;border:0;border-top:1px solid var(--mf-border);background:transparent;color:var(--mf-text);text-align:left;cursor:pointer}.it-ticket-row:hover,.it-ticket-row.selected{background:var(--mf-surface-soft)}.it-ticket-symbol{display:grid;place-items:center;flex:0 0 39px;width:39px;height:39px;border-radius:12px;color:var(--mf-primary);background:color-mix(in srgb,var(--mf-primary) 11%,var(--mf-surface))}.it-ticket-summary{display:flex;min-width:0;flex:1;flex-direction:column;gap:5px}.it-ticket-summary strong{font-size:12px;line-height:1.45;overflow-wrap:anywhere}.it-ticket-summary small{color:var(--mf-muted);font-size:10px;line-height:1.5}.it-ticket-status,.it-ticket-priority{flex:0 0 auto;padding:5px 8px;border:1px solid var(--mf-border);border-radius:99px;background:var(--mf-surface-soft);font-size:10px;font-weight:750;white-space:nowrap}.status-completed{color:#15803d;background:#f0fdf4;border-color:#bbf7d0}.status-rejected,.status-cancelled{color:#b91c1c;background:#fef2f2;border-color:#fecaca}.status-in-progress,.status-assigned{color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe}.status-waiting-on-employee,.status-on-hold{color:#a16207;background:#fffbeb;border-color:#fde68a}.priority-urgent,.priority-critical{color:#b91c1c;border-color:#fecaca;background:#fef2f2}.it-ticket-detail{margin-top:18px;padding:20px;border:1px solid var(--mf-border);border-radius:15px;background:var(--mf-surface-soft)}.it-ticket-detail-header{display:flex;justify-content:space-between;gap:15px}.it-ticket-detail-header h3{margin:5px 0;font-size:18px;overflow-wrap:anywhere}.it-ticket-detail-header p{margin:0;color:var(--mf-muted);font-size:11px}.it-ticket-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:18px 0}.it-ticket-detail-grid div{display:flex;min-width:0;flex-direction:column;gap:6px;padding:12px;border:1px solid var(--mf-border);border-radius:10px;background:var(--mf-surface)}.it-ticket-detail-grid small{color:var(--mf-muted);font-size:10px}.it-ticket-detail-grid strong{font-size:12px;overflow-wrap:anywhere}.it-ticket-description{padding:15px;border:1px solid var(--mf-border);border-radius:11px;background:var(--mf-surface)}.it-ticket-description>p{white-space:pre-wrap;font-size:12px;line-height:1.7}.it-ticket-description dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:15px 0 0}.it-ticket-description dl div{min-width:0}.it-ticket-description dt{color:var(--mf-muted);font-size:10px}.it-ticket-description dd{margin:3px 0 0;font-size:11px;overflow-wrap:anywhere}.it-ticket-activity{margin-top:20px}.it-ticket-activity h4{margin:0 0 14px;font-size:14px}.it-activity-event{display:flex;gap:12px;padding:0 0 17px}.it-activity-dot{flex:0 0 9px;width:9px;height:9px;margin-top:5px;border-radius:50%;background:var(--mf-primary);box-shadow:0 0 0 4px color-mix(in srgb,var(--mf-primary) 12%,var(--mf-surface))}.it-activity-event>div{min-width:0;flex:1}.it-activity-meta{display:flex;justify-content:space-between;gap:12px}.it-activity-meta strong{font-size:11px}.it-activity-meta time,.it-activity-event small{color:var(--mf-muted);font-size:10px}.it-activity-event p{margin:4px 0;color:var(--mf-text);font-size:12px;line-height:1.6;white-space:pre-wrap}.it-support-controls{display:flex;align-items:end;gap:15px;margin-top:15px;padding:15px;border:1px solid var(--mf-border);border-radius:11px;background:var(--mf-surface)}.it-support-controls .form-field{width:min(100%,320px);margin:0}.it-support-controls>small{padding-bottom:9px;color:var(--mf-muted);font-size:10px}.it-ticket-comment{display:flex;align-items:end;gap:12px;margin-top:15px}.it-ticket-comment .form-field{flex:1;margin:0}.it-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:28px;color:var(--mf-muted);font-size:12px;text-align:center}.it-empty-state strong{color:var(--mf-text)}
@media(max-width:1000px){.it-center-intro{align-items:flex-start;flex-direction:column}.it-center-stats{width:100%}.it-section-heading{align-items:flex-start;flex-direction:column}.it-section-heading>.it-search{max-width:none;width:100%}.it-ticket-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:680px){.it-center-section{padding:16px;margin:14px 0}.it-center-intro{padding:20px}.it-center-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.it-center-stats div{min-width:0;padding:10px}.it-center-stats strong{font-size:20px}.it-solution-grid,.it-form-grid{grid-template-columns:1fr}.it-full-width{grid-column:auto}.it-form-footer,.it-ticket-comment{align-items:stretch;flex-direction:column}.it-form-footer .action-primary,.it-ticket-comment .action-primary{width:100%;justify-content:center}.it-ticket-tools{flex-direction:column}.it-ticket-tools select{width:100%;flex-basis:auto}.it-ticket-row{flex-wrap:wrap;gap:9px}.it-ticket-summary{flex-basis:calc(100% - 55px)}.it-ticket-row>.it-ticket-status{margin-left:48px}.it-ticket-detail{padding:13px}.it-ticket-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.it-ticket-description dl{grid-template-columns:repeat(2,minmax(0,1fr))}.it-support-controls{align-items:stretch;flex-direction:column}.it-support-controls .form-field{width:100%}.it-support-controls>small{padding:0}.it-activity-meta{flex-direction:column;gap:3px}}
</style>

<style scoped>.service-quick-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.service-action-page{min-width:0;max-width:100%;overflow-x:clip}.service-action-page :deep(*){min-width:0;box-sizing:border-box}.service-action-page :deep(input),.service-action-page :deep(select),.service-action-page :deep(textarea){max-width:100%}.service-action-page :deep(#it-ticket-form),.service-action-page :deep(.it-ticket-tracker){scroll-margin-top:90px}@media(max-width:700px){.service-action-page{padding-left:12px;padding-right:12px}.service-action-page :deep(.service-action-form),.service-action-page :deep(.it-center-section),.service-action-page :deep(.workspace-panel){max-width:100%;overflow-wrap:anywhere}.service-action-page :deep(.it-center-intro){gap:16px;padding:16px}.service-action-page :deep(.it-section-heading){gap:12px}.service-action-page :deep(.it-search){min-width:0;width:100%}.service-action-page :deep(.it-ticket-detail-grid),.service-action-page :deep(.it-ticket-description dl){grid-template-columns:repeat(2,minmax(0,1fr))}.service-quick-actions>*{flex:1;justify-content:center}}</style>
