<script setup>
import { computed } from "vue";
import { getSavedEmployee } from "../../services/api";

const employee = computed(() =>
  getSavedEmployee()
);

const company = computed(() =>
  employee.value?.company
);

const modules = [
  {
    id: "memos",
    name: "Memo Management",
    description:
      "Create, route, approve and track business memos.",
    icon: "M",
    route: "/memos",
    status: "Live",
  },

  {
    id: "email-signature",
    name: "Email Signature",
    description:
      "Manage company email signatures and campaigns.",
    icon: "@",
    route: null,
    status: "Live",
  },

  {
    id: "leave",
    name: "Leave Management",
    description:
      "Manage employee leave requests and approvals.",
    icon: "L",
    route: null,
    status: "Coming soon",
  },

  {
    id: "procurement",
    name: "Procurement",
    description:
      "Manage purchasing requests and approval workflows.",
    icon: "P",
    route: null,
    status: "Coming soon",
  },

  {
    id: "assets",
    name: "Asset Management",
    description:
      "Track company assets, assignments and lifecycle.",
    icon: "A",
    route: null,
    status: "Coming soon",
  },

  {
    id: "expenses",
    name: "Expense Management",
    description:
      "Submit, review and approve employee expenses.",
    icon: "₦",
    route: null,
    status: "Coming soon",
  },

  {
    id: "documents",
    name: "Document Management",
    description:
      "Organize and manage business documents.",
    icon: "D",
    route: null,
    status: "Coming soon",
  },

  {
    id: "requests",
    name: "Employee Requests",
    description:
      "Centralize employee service requests.",
    icon: "R",
    route: null,
    status: "Coming soon",
  },

  {
    id: "meetings",
    name: "Meetings & Rooms",
    description:
      "Manage meeting rooms and bookings.",
    icon: "M",
    route: null,
    status: "Coming soon",
  },

  {
    id: "visitors",
    name: "Visitor Management",
    description:
      "Manage visitors and front-desk activities.",
    icon: "V",
    route: null,
    status: "Coming soon",
  },

  {
    id: "maintenance",
    name: "Maintenance",
    description:
      "Track facilities and maintenance requests.",
    icon: "⚙",
    route: null,
    status: "Coming soon",
  },
];

const activeModules = computed(() =>
  modules.filter(
    (module) => module.status === "Live"
  )
);
</script>

<template>
  <section class="module-hub">

    <div class="module-hero">

      <div>
        <span class="module-eyebrow">
          {{ company?.name || "MemoFlo" }}
        </span>

        <h2>
          Welcome,
          {{ employee?.firstName || "there" }}
        </h2>

        <p>
          Choose a MemoFlo module to get started.
        </p>
      </div>

      <div class="company-pill">
        <strong>
          {{ company?.name || "Company" }}
        </strong>

        <span>
          {{ employee?.role?.name || "Employee" }}
        </span>
      </div>

    </div>

    <div class="module-section">

      <div class="section-heading">
        <div>
          <h3>Your modules</h3>

          <p>
            Modules available to your company.
          </p>
        </div>

        <span>
          {{ activeModules.length }} active
        </span>
      </div>

      <div class="module-grid">

        <component
          v-for="module in modules"
          :key="module.id"
          :is="module.route ? 'router-link' : 'div'"
          :to="module.route || undefined"
          class="module-card"
          :class="{
            disabled: !module.route
          }"
        >

          <div class="module-icon">
            {{ module.icon }}
          </div>

          <div class="module-card-content">

            <div class="module-card-title">
              <h4>{{ module.name }}</h4>

              <span
                :class="{
                  'live-status':
                    module.status === 'Live'
                }"
              >
                {{ module.status }}
              </span>
            </div>

            <p>
              {{ module.description }}
            </p>

          </div>

          <span
            v-if="module.route"
            class="module-arrow"
          >
            →
          </span>

        </component>

      </div>

    </div>

  </section>
</template>