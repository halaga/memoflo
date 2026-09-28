import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import WorkspaceView from "../views/WorkspaceView.vue";
import LandingView from "../views/LandingView.vue";
import { api, getSavedEmployee } from "../services/api";

function hostname() {
  return window.location.hostname.toLowerCase();
}

function isPlatformHost() {
  return ["memoflo.com", "www.memoflo.com"].includes(hostname());
}

function isTenantHost() {
  return (
    hostname().endsWith(".memoflo.com") ||
    hostname().endsWith(".localhost")
  );
}

function isBareLocalHost() {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname());
}

function hasPermission(permission) {
  const employee = getSavedEmployee();
  const permissions = employee?.role?.permissions || [];

  return (
    permissions.includes("*") ||
    permissions.includes(permission)
  );
}

const routes = [
  {
    path: "/",
    name: "root",
    component: isPlatformHost() ? LandingView : LoginView,
    meta: {
      dynamicRoot: true,
    },
  },

  {
    path: "/platform",
    name: "platform",
    component: LandingView,
    meta: {
      public: true,
    },
  },

  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      guest: true,
    },
  },

  {
    path: "/",
    component: WorkspaceView,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "modules",
        name: "modules",
        component: () =>
          import("../views/modules/ModulesView.vue"),
      },
      {
        path: "email-signature",
        name: "email-signature",
        component: () =>
          import("../views/signature/EmailSignatureView.vue"),
        meta: {
          module: "signature",
        },
      },

      {
        path: "leave",
        name: "leave",
        component: () => import("../views/leave/LeaveView.vue"),
        meta: { module: "leave" },
      },
      {
        path: "leave/requests/:id",
        name: "leave-request",
        component: () => import("../views/leave/LeaveRequestView.vue"),
        meta: { module: "leave" },
      },

      {
        path: "dashboard",
        name: "dashboard",
        component: () =>
          import("../views/DashboardView.vue"),
      },

      {
        path: "memos",
        name: "memos",
        component: () =>
          import("../views/memos/MemosView.vue"),
        meta: {
          module: "memos",
          permission: "memos.view",
        },
      },

      {
        path: "memos/create",
        name: "create-memo",
        component: () =>
          import("../views/memos/CreateMemoView.vue"),
        meta: {
          module: "memos",
          permission: "memos.create",
        },
      },

      {
        path: "memos/:id",
        name: "memo-detail",
        component: () =>
          import("../views/memos/MemoDetailView.vue"),
        meta: {
          module: "memos",
          permission: "memos.view",
        },
      },

      {
        path: "approvals",
        name: "approvals",
        component: () =>
          import("../views/approvals/ApprovalsView.vue"),
        meta: {
          module: "memos",
          permission: "memos.approve",
        },
      },

      {
        path: "completed",
        name: "completed",
        component: () =>
          import("../views/approvals/CompletedView.vue"),
        meta: {
          module: "memos",
          permission: "memos.view",
        },
      },

      {
        path: "notifications",
        name: "notifications",
        component: () =>
          import("../views/NotificationsView.vue"),
        meta: {
          permission: "notifications.view",
        },
      },

      {
        path: "administration",
        name: "administration",
        component: () =>
          import("../views/administration/AdministrationView.vue"),
        meta: {
          permission: "administration.view",
        },
      },

      {
        path: "administration/workflows",
        name: "workflow-settings",
        component: () =>
          import(
            "../views/administration/WorkflowSettingsView.vue"
          ),
        meta: {
          permission: "workflow.view",
        },
      },

      {
        path: "administration/roles",
        name: "roles",
        component: () =>
          import("../views/administration/RolesView.vue"),
        meta: {
          permission: "roles.view",
        },
      },

      {
        path: "administration/employees",
        name: "employees",
        component: () =>
          import("../views/administration/EmployeesView.vue"),
        meta: {
          permission: "employees.view",
        },
      },

      {
        path: "administration/organization",
        name: "organization-structure",
        component: () =>
          import("../views/administration/OrganizationView.vue"),
        meta: {
          permission: "employees.view",
        },
      },

      {
        path: "administration/modules",
        name: "module-access",
        component: () =>
          import("../views/administration/ModuleAccessView.vue"),
        meta: {
          permission: "company.modules.update",
        },
      },

      {
        path: "administration/audit",
        name: "audit-log",
        component: () =>
          import("../views/administration/AuditLogView.vue"),
        meta: {
          permission: "audit.view",
        },
      },

      {
        path: "administration/branding",
        name: "company-branding",
        component: () =>
          import("../views/administration/CompanyBrandingView.vue"),
        meta: {
          permission: "company.branding.update",
        },
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: () => (
      isPlatformHost() ? "/" : "/login"
    ),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const token = localStorage.getItem("memoflo_token");

  if (to.name === "root") {
    if (isPlatformHost()) {
      return true;
    }

    if (isBareLocalHost()) {
      return {
        name: "login",
        replace: true,
      };
    }

    return token
      ? { name: "modules", replace: true }
      : { name: "login", replace: true };
  }

  if (
    to.meta.guest &&
    token &&
    isTenantHost()
  ) {
    return {
      name: "modules",
      replace: true,
    };
  }

  if (
    to.matched.some(
      (record) => record.meta.requiresAuth
    ) &&
    !token
  ) {
    return {
      name: "login",
      replace: true,
    };
  }

  if (to.meta.permission && token) {
    if (!hasPermission(to.meta.permission)) {
      return {
        name: "modules",
        replace: true,
      };
    }
  }

  if (to.meta.module && token) {
    try {
      const result = await api.getCompanyWorkspace();
      const workspace =
        result?.data || result;

      const module = workspace?.modules?.find(
        (item) => item.id === to.meta.module
      );

      if (!module?.enabled) {
        return {
          name: "modules",
          replace: true,
        };
      }
    } catch {
      return {
        name: "login",
        replace: true,
      };
    }
  }

  return true;
});

export default router;
