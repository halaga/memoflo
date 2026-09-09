import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import WorkspaceView from "../views/WorkspaceView.vue";

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { guest: true },
  },

  {
    path: "/",
    component: WorkspaceView,
    children: [
      {
        path: "",
        redirect: "/dashboard",
      },

      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("../views/DashboardView.vue"),
      },

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

      {
        path: "modules",
        name: "modules",
        component: () => import("../views/modules/ModulesView.vue"),
      },

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
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem("memoflo_token");

  if (to.meta.guest && token) {
    return "/dashboard";
  }

  if (!to.meta.guest && !token) {
    return "/login";
  }

  return true;
});

export default router;
