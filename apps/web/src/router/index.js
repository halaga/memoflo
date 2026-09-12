import {
  createRouter,
  createWebHistory,
} from "vue-router";

import LoginView from "../views/LoginView.vue";
import WorkspaceView from "../views/WorkspaceView.vue";
import DashboardView from "../views/DashboardView.vue";
import ModulesView from "../views/modules/ModulesView.vue";

import MemosView from "../views/memos/MemosView.vue";
import CreateMemoView from "../views/memos/CreateMemoView.vue";
import MemoDetailView from "../views/memos/MemoDetailView.vue";

import ApprovalsView from "../views/approvals/ApprovalsView.vue";
import CompletedView from "../views/approvals/CompletedView.vue";

import AdministrationView from "../views/administration/AdministrationView.vue";
import WorkflowSettingsView from "../views/administration/WorkflowSettingsView.vue";
import RolesView from "../views/administration/RolesView.vue";

const routes = [
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
        path: "",
        redirect: "/modules",
      },

      {
        path: "modules",
        name: "modules",
        component: ModulesView,
      },

      // Keep dashboard available, but it is no longer
      // the first page after login.
      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardView,
      },

      {
        path: "memos",
        name: "memos",
        component: MemosView,
      },

      {
        path: "memos/create",
        name: "create-memo",
        component: CreateMemoView,
      },

      {
        path: "memos/:id",
        name: "memo-detail",
        component: MemoDetailView,
      },

      {
        path: "approvals",
        name: "approvals",
        component: ApprovalsView,
      },

      {
        path: "completed",
        name: "completed",
        component: CompletedView,
      },

      {
        path: "administration",
        name: "administration",
        component: AdministrationView,
      },

      {
        path: "administration/workflows",
        name: "workflow-settings",
        component: WorkflowSettingsView,
      },

      {
        path: "administration/roles",
        name: "roles",
        component: RolesView,
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
  const token =
    localStorage.getItem("memoflo_token");

  if (to.meta.requiresAuth && !token) {
    return {
      name: "login",
    };
  }

  if (to.meta.guest && token) {
    return {
      name: "modules",
    };
  }

  return true;
});

export default router;