export const MODULE_CATALOGUE = [
  { id: "memos", name: "Memo Management", description: "Create, route, approve and track business memos.", icon: "M", status: "live", route: "/memos" },
  { id: "signature", name: "Email Signature", description: "Manage company signatures and campaign banners.", icon: "@", status: "building", route: null },
  { id: "leave", name: "Leave Management", description: "Employee leave requests, balances and approvals.", icon: "L", status: "building", route: null },
  { id: "procurement", name: "Procurement Management", description: "Structured purchasing and approval workflows.", icon: "P", status: "building", route: null },
  { id: "assets", name: "Asset Management", description: "Track assignments, custody and asset lifecycle.", icon: "A", status: "building", route: null },
  { id: "expenses", name: "Expense Management", description: "Submit and approve business expenses.", icon: "₦", status: "building", route: null },
  { id: "documents", name: "Document Management", description: "Organize controlled business documents.", icon: "D", status: "building", route: null },
  { id: "requests", name: "Employee Requests", description: "Centralize internal service requests.", icon: "R", status: "building", route: null },
  { id: "meetings", name: "Meeting & Room Management", description: "Manage rooms, meetings and shared resources.", icon: "◫", status: "building", route: null },
  { id: "visitors", name: "Visitor Management", description: "Manage visitors and front-desk activities.", icon: "V", status: "building", route: null },
  { id: "maintenance", name: "Maintenance Management", description: "Track facilities and maintenance requests.", icon: "⚙", status: "building", route: null },
];
export const ALL_MODULE_IDS = MODULE_CATALOGUE.map((module) => module.id);
