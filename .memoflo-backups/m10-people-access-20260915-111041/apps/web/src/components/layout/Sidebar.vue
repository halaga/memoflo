<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getSavedEmployee } from "../../services/api";

const router = useRouter();
const route = useRoute();

const employee = computed(() => getSavedEmployee());
const company = computed(() => employee.value?.company || null);
const rolePermissions = computed(() => employee.value?.role?.permissions || []);

function can(permission) {
  return (
    rolePermissions.value.includes("*") ||
    rolePermissions.value.includes(permission)
  );
}

const isAdministrator = computed(() => {
  const roleName = employee.value?.role?.name || "";
  const roleCode = employee.value?.role?.code || "";

  return (
    rolePermissions.value.includes("*") ||
    rolePermissions.value.includes("administration.view") ||
    rolePermissions.value.includes("workflow.view") ||
    rolePermissions.value.includes("roles.view") ||
    rolePermissions.value.includes("company.modules.update") ||
    rolePermissions.value.includes("company.branding.update") ||
    /admin/i.test(roleName) ||
    /ADMIN/i.test(roleCode)
  );
});

const initials = computed(() => {
  const first = employee.value?.firstName?.[0] || "";
  const last = employee.value?.lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "MF";
});

const workspace = computed(() => {
  if (
    route.path.startsWith("/memos") ||
    route.name === "approvals" ||
    route.name === "completed"
  ) {
    return "memos";
  }

  if (route.path.startsWith("/administration")) {
    return "admin";
  }

  return "hub";
});

const hubItems = computed(() => {
  const items = [
    {
      label: "Module Hub",
      route: "/modules",
      icon: "⌘",
    },
    {
      label: "Notifications",
      route: "/notifications",
      icon: "◔",
      permission: "notifications.view",
    },
    {
      label: "Administration",
      route: "/administration",
      icon: "⚙",
      adminOnly: true,
    },
  ];

  return items.filter((item) => {
    if (item.adminOnly && !isAdministrator.value) {
      return false;
    }

    return !item.permission || can(item.permission);
  });
});

const memoItems = [
  {
    label: "My Memos",
    route: "/memos",
    icon: "▤",
  },
  {
    label: "Create Memo",
    route: "/memos/create",
    icon: "+",
    permission: "memos.create",
  },
  {
    label: "Approvals",
    route: "/approvals",
    icon: "✓",
    permission: "memos.approve",
  },
  {
    label: "Completed",
    route: "/completed",
    icon: "◷",
  },
  {
    label: "Module Hub",
    route: "/modules",
    icon: "⌂",
  },
];

const administrationItems = [
  {
    label: "Administration",
    route: "/administration",
    icon: "⚙",
  },
  {
    label: "Workflow Definitions",
    route: "/administration/workflows",
    icon: "◇",
    permission: "workflow.view",
  },
  {
    label: "Roles & Permissions",
    route: "/administration/roles",
    icon: "♙",
    permission: "roles.view",
  },
  {
    label: "Module Access",
    route: "/administration/modules",
    icon: "◈",
    permission: "company.modules.update",
  },
  {
    label: "Company Branding",
    route: "/administration/branding",
    icon: "✦",
    permission: "company.branding.update",
  },
  {
    label: "Notifications",
    route: "/notifications",
    icon: "◔",
    permission: "notifications.view",
  },
  {
    label: "Module Hub",
    route: "/modules",
    icon: "⌂",
  },
];

const items = computed(() => {
  let list = hubItems.value;

  if (workspace.value === "memos") {
    list = memoItems;
  }

  if (workspace.value === "admin") {
    list = administrationItems;
  }

  return list.filter((item) => !item.permission || can(item.permission));
});

function isActive(path) {
  if (path === "/modules") {
    return route.path === "/modules";
  }

  if (path === "/administration") {
    return (
      route.path === "/administration" ||
      route.path.startsWith("/administration/")
    );
  }

  return route.path === path || route.path.startsWith(`${path}/`);
}

function navigate(path) {
  router.push(path);
}
</script>

<template>
  <aside class="sidebar premium-sidebar">
    <div class="brand">
      <div class="brand-mark">
        <img
          v-if="company?.logo || company?.branding?.logo"
          :src="company?.logo || company?.branding?.logo"
          alt=""
        />
        <span v-else>M</span>
      </div>

      <div>
        <div class="brand-name">MemoFlo</div>
        <div class="brand-tag">
          {{ company?.name || "Workflow simplified" }}
        </div>
      </div>
    </div>

    <div class="tenant-chip">
      <span>WORKSPACE</span>
      <strong>{{ company?.name || "MemoFlo" }}</strong>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">
        {{
          workspace === "memos"
            ? "MEMO MANAGEMENT"
            : workspace === "admin"
              ? "ADMINISTRATION"
              : "WORKSPACE"
        }}
      </div>

      <nav class="nav">
        <button
          v-for="item in items"
          :key="item.route"
          type="button"
          class="nav-item"
          :class="{ active: isActive(item.route) }"
          @click="navigate(item.route)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <div class="sidebar-spacer"></div>

    <div class="sidebar-profile">
      <div class="top-avatar">{{ initials }}</div>
      <div>
        <strong>{{ employee?.firstName || "Employee" }}</strong>
        <span>{{ employee?.role?.name || "Employee" }}</span>
      </div>
    </div>
  </aside>
</template>
