import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import WorkspaceView from "../views/WorkspaceView.vue";
import LandingView from "../views/LandingView.vue";

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

const routes = [
  /* Public platform / root entry */
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

  /* Company / local login */
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      guest: true,
    },
  },

  /* Authenticated tenant workspace */
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
        component: () => import("../views/modules/ModulesView.vue"),
      },

      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("../views/DashboardView.vue"),
      },

      /* Memo Management module */
      {
        path: "memos",
        name: "memos",
        component: () => import("../views/memos/MemosView.vue"),
      },
      {
        path: "memos/create",
        name: "create-memo",
        component: () => import("../views/memos/CreateMemoView.vue"),
      },
      {
        path: "memos/:id",
        name: "memo-detail",
        component: () => import("../views/memos/MemoDetailView.vue"),
      },
      {
        path: "approvals",
        name: "approvals",
        component: () => import("../views/approvals/ApprovalsView.vue"),
      },
      {
        path: "completed",
        name: "completed",
        component: () => import("../views/approvals/CompletedView.vue"),
      },

      /* Platform notifications */
      {
        path: "notifications",
        name: "notifications",
        component: () => import("../views/NotificationsView.vue"),
      },

      /* Administration */
      {
        path: "administration",
        name: "administration",
        component: () =>
          import("../views/administration/AdministrationView.vue"),
      },
      {
        path: "administration/workflows",
        name: "workflow-settings",
        component: () =>
          import("../views/administration/WorkflowSettingsView.vue"),
      },
      {
        path: "administration/roles",
        name: "roles",
        component: () => import("../views/administration/RolesView.vue"),
      },
      {
        path: "administration/modules",
        name: "module-access",
        component: () =>
          import("../views/administration/ModuleAccessView.vue"),
      },
      {
        path: "administration/branding",
        name: "company-branding",
        component: () =>
          import("../views/administration/CompanyBrandingView.vue"),
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: () => (isPlatformHost() ? "/" : "/login"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem("memoflo_token");

  /*
   * Root behaviour:
   *
   * memoflo.com          -> public platform landing page
   * localhost            -> login
   * ringo.localhost      -> tenant login / authenticated hub
   * ringo.memoflo.com    -> tenant login / authenticated hub
   */
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

  if (to.meta.guest && token && isTenantHost()) {
    return {
      name: "modules",
      replace: true,
    };
  }

  if (
    to.matched.some((record) => record.meta.requiresAuth) &&
    !token
  ) {
    return {
      name: "login",
      replace: true,
    };
  }

  return true;
});

export default router;
