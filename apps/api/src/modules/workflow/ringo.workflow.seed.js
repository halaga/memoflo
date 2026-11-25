import Workflow from "./workflow.model.js";
import WorkflowStep from "./workflowStep.model.js";
import Position from "../position/position.model.js";
import SBU from "../organization/sbu/sbu.model.js";
import Department from "../organization/department/department.model.js";
import Designation from "../organization/designation/designation.model.js";
import BusinessService from "../business-service/businessService.model.js";

/**
 * Seeds the Ringo pilot tenant's supplied approval routes.
 * This is intentionally tenant-scoped: no other tenant receives these
 * workflows, requisition types or service mappings.
 */
const ROLE_DEFINITIONS = [
  { code: "RINGO-ADMIN-INITIATOR", title: "Administration Initiator", department: "Administration", sbu: "Corporate Services", level: 50 },
  { code: "RINGO-IT-INITIATOR", title: "IT Initiator", department: "Information Technology", sbu: "Technology", level: 50 },
  { code: "RINGO-HEAD-SBU", title: "Head of SBU", department: "Administration", sbu: "Corporate Services", level: 80 },
  { code: "RINGO-TSM", title: "Territory Sales Manager (TSM)", department: "Sales", sbu: "Sales", level: 70 },
  { code: "RINGO-ICC-VETTER", title: "IC&C Vetting Officer", department: "Administration", sbu: "Corporate Services", level: 75 },
  { code: "RINGO-CEO", title: "Chief Executive Officer", department: "Administration", sbu: "Corporate Services", level: 100 },
];

async function ensureRolePosition(companyId, definition) {
  let sbu = await SBU.findOne({ company: companyId, name: definition.sbu, isActive: true });
  let department = await Department.findOne({ company: companyId, name: definition.department, isActive: true });
  // Imported Ringo organisation charts often use abbreviated or locally named
  // departments/SBUs. Resolve against the tenant's existing structure without
  // manufacturing employee identities or cross-tenant defaults.
  if (!department) {
    const allDepartments = await Department.find({ company: companyId, isActive: true });
    const target = definition.department.toLowerCase();
    department = allDepartments.find((item) => {
      const name = item.name.toLowerCase();
      return name === target || name.includes(target) || target.includes(name)
        || (target === "administration" && (name.includes("admin") || name.includes("corporate")))
        || (target === "information technology" && (name === "it" || name.includes("techn")))
        || (target === "sales" && name.includes("sales"));
    }) || allDepartments[0] || null;
  }
  if (!sbu && department?.sbu) sbu = await SBU.findOne({ _id: department.sbu, company: companyId, isActive: true });
  if (!sbu) sbu = await SBU.findOne({ company: companyId, isActive: true });
  if (!department || !sbu) {
    throw new Error(`Ringo pilot requires at least one active SBU and department before workflow positions can be created (${definition.title}).`);
  }
  // Keep each position inside the resolved department's SBU where possible.
  if (String(department.sbu) !== String(sbu._id)) {
    const departmentSbu = await SBU.findOne({ _id: department.sbu, company: companyId, isActive: true });
    if (departmentSbu) sbu = departmentSbu;
  }

  let designation = await Designation.findOne({
    company: companyId,
    department: department._id,
    title: definition.title,
  });
  if (!designation) {
    designation = await Designation.create({
      company: companyId,
      sbu: sbu._id,
      department: department._id,
      title: definition.title,
      level: definition.level,
      description: "Tenant workflow role. Assign the current office holder through Organisation → Positions.",
    });
  }

  // Never replace an existing occupant. If the department has an assigned
  // head, it can safely populate the departmental initiator position only.
  const defaultOccupant = definition.code === "RINGO-ADMIN-INITIATOR" || definition.code === "RINGO-IT-INITIATOR"
    ? department.head || null
    : null;
  let position = await Position.findOne({ company: companyId, code: definition.code });
  if (!position) {
    position = await Position.create({
      company: companyId,
      sbu: sbu._id,
      department: department._id,
      designation: designation._id,
      title: definition.title,
      code: definition.code,
      workflowRole: definition.code === "RINGO-HEAD-SBU" ? "HEAD_OF_SBU" : definition.code.replace("RINGO-", "").replaceAll("-", "_"),
      occupant: defaultOccupant,
      isWorkflowNode: true,
      active: true,
    });
  } else {
    position.sbu = sbu._id;
    position.department = department._id;
    position.designation = designation._id;
    position.title = definition.title;
    position.workflowRole = definition.code === "RINGO-HEAD-SBU" ? "HEAD_OF_SBU" : definition.code.replace("RINGO-", "").replaceAll("-", "_");
    position.isWorkflowNode = true;
    position.active = true;
    if (!position.occupant && defaultOccupant) position.occupant = defaultOccupant;
    await position.save();
  }
  return position;
}

async function ensureSbuHeadPositions(companyId) {
  const sbus = await SBU.find({ company: companyId, isActive: true });
  for (const sbu of sbus) {
    const department = await Department.findOne({ company: companyId, sbu: sbu._id, isActive: true }).sort({ createdAt: 1 });
    if (!department) continue;
    let designation = await Designation.findOne({ company: companyId, department: department._id, title: "Head of SBU" });
    if (!designation) {
      designation = await Designation.create({
        company: companyId,
        sbu: sbu._id,
        department: department._id,
        title: "Head of SBU",
        level: 80,
        description: `Head of ${sbu.name} workflow position. Assign the current office holder through Organisation → Positions.`,
      });
    }
    const code = `RINGO-HEAD-SBU-${sbu.code}`;
    let position = await Position.findOne({ company: companyId, code });
    if (!position) {
      await Position.create({
        company: companyId,
        sbu: sbu._id,
        department: department._id,
        designation: designation._id,
        title: `Head of SBU — ${sbu.name}`,
        code,
        workflowRole: "HEAD_OF_SBU",
        occupant: department.head || null,
        isWorkflowNode: true,
        active: true,
      });
    } else {
      position.sbu = sbu._id;
      position.department = department._id;
      position.designation = designation._id;
      position.title = `Head of SBU — ${sbu.name}`;
      position.workflowRole = "HEAD_OF_SBU";
      position.isWorkflowNode = true;
      position.active = true;
      if (!position.occupant && department.head) position.occupant = department.head;
      await position.save();
    }
  }
}

const ROUTES = [
  {
    name: "Ringo — Admin Requisition Approval",
    code: "RINGO-ADMIN-REQUISITION",
    requisitionType: "Admin Requisition",
    steps: [
      ["Admin Initiation", "review", "RINGO-ADMIN-INITIATOR"],
      ["Head of SBU Authorization", "approve", "RINGO-HEAD-SBU", "beneficiary_sbu_head"],
      ["IC&C Vetting", "review", "RINGO-ICC-VETTER"],
      ["CEO Final Approval", "approve", "RINGO-CEO"],
    ],
  },
  {
    name: "Ringo — SBU Requisition Approval",
    code: "RINGO-SBU-REQUISITION",
    requisitionType: "SBU Requisition",
    steps: [
      ["Admin Initiation", "review", "RINGO-ADMIN-INITIATOR"],
      ["TSM Authorization", "approve", "RINGO-TSM"],
      ["Head of SBU Authorization", "approve", "RINGO-HEAD-SBU", "beneficiary_sbu_head"],
      ["IC&C Vetting", "review", "RINGO-ICC-VETTER"],
      ["CEO Final Approval", "approve", "RINGO-CEO"],
    ],
  },
  {
    name: "Ringo — IT Requisition Approval",
    code: "RINGO-IT-REQUISITION",
    requisitionType: "IT Requisition",
    steps: [
      ["IT Initiation", "review", "RINGO-IT-INITIATOR"],
      ["Admin Authorization", "approve", "RINGO-ADMIN-INITIATOR"],
      ["Head of SBU Authorization", "approve", "RINGO-HEAD-SBU", "beneficiary_sbu_head"],
      ["IC&C Vetting", "review", "RINGO-ICC-VETTER"],
      ["CEO Final Approval", "approve", "RINGO-CEO"],
    ],
  },
];

export async function seedRingoApprovalConfiguration(company) {
  if (String(company?.code || "").toUpperCase() !== "RINGO") return;

  const positions = new Map();
  for (const definition of ROLE_DEFINITIONS) {
    positions.set(definition.code, await ensureRolePosition(company._id, definition));
  }
  await ensureSbuHeadPositions(company._id);

  const workflowByType = new Map();
  for (const route of ROUTES) {
    let workflow = await Workflow.findOne({ company: company._id, code: route.code });
    if (!workflow) {
      workflow = await Workflow.create({
        company: company._id,
        name: route.name,
        code: route.code,
        description: `Tenant-configured approval route for ${route.requisitionType}. Managed under Administration → Workflows.`,
        version: 1,
        active: true,
      });
    } else {
      workflow.name = route.name;
      workflow.description = `Tenant-configured approval route for ${route.requisitionType}. Managed under Administration → Workflows.`;
      workflow.active = true;
      await workflow.save();
    }

    const existingSteps = await WorkflowStep.find({ company: company._id, workflow: workflow._id }).select("order").lean();
    const existingOrders = new Set(existingSteps.map((step) => Number(step.order)));
    for (const [index, [name, action, positionCode, assignmentRule = "fixed_position"]] of route.steps.entries()) {
      const order = index + 1;
      if (existingOrders.has(order)) continue;
      await WorkflowStep.create({
        company: company._id,
        workflow: workflow._id,
        order,
        name,
        action,
        position: positions.get(positionCode)._id,
        assignmentRule,
        required: true,
        allowDelegate: true,
      });
    }
    // Existing step definitions are never overwritten by a seed rerun.
    // Administrators can edit them in the tenant's Workflow workspace.
    workflowByType.set(route.requisitionType, workflow._id);
  }

  const services = await BusinessService.find({ company: company._id, active: true, isActive: true });
  for (const service of services) {
    const map = { ...(service.requisitionWorkflowMap || {}) };
    let changed = false;
    for (const requisitionType of service.allowedRequisitionTypes || []) {
      const workflowId = workflowByType.get(requisitionType);
      if (workflowId && String(map[requisitionType] || "") !== String(workflowId)) {
        map[requisitionType] = workflowId;
        changed = true;
      }
    }
    if (changed) {
      service.requisitionWorkflowMap = map;
      await service.save();
    }
  }
}
