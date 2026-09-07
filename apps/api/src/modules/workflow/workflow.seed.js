import Workflow from "./workflow.model.js";
import WorkflowStep from "./workflowStep.model.js";
import Position from "../position/position.model.js";

export async function seedProcurementWorkflow(company) {
  console.log("\n🔄 Seeding Procurement Workflow...");

  const companyId = company._id;

  // --------------------------------------------------
  // CREATE / FIND WORKFLOW
  // --------------------------------------------------

  let workflow = await Workflow.findOne({
    company: companyId,
    code: "PROCUREMENT",
  });

  if (!workflow) {
    workflow = await Workflow.create({
      company: companyId,
      name: "Procurement Approval",
      code: "PROCUREMENT",
      description:
        "Standard procurement approval workflow",
      version: 1,
      active: true,
    });

    console.log("✔ Procurement Workflow Created");
  } else {
    console.log("✔ Procurement Workflow Already Exists");
  }

  // --------------------------------------------------
  // POSITION LOOKUP
  // --------------------------------------------------

  const positions = await Position.find({
    company: companyId,
    isActive: true,
  });

  const getPosition = (code) =>
    positions.find(
      (position) => position.code === code
    );

  // --------------------------------------------------
  // WORKFLOW POSITIONS
  // --------------------------------------------------

  const sbuHead = getPosition("SBU-HEAD");
  const administration = getPosition("ADMIN");
  const icc = getPosition("ICC");
  const sbuFinance = getPosition("SBU-FINANCE");
  const ceo = getPosition("CEO");

  // --------------------------------------------------
  // VALIDATE POSITIONS
  // --------------------------------------------------

  const requiredPositions = [
    ["SBU-HEAD", sbuHead],
    ["ADMIN", administration],
    ["ICC", icc],
    ["SBU-FINANCE", sbuFinance],
    ["CEO", ceo],
  ];

  for (const [code, position] of requiredPositions) {
    if (!position) {
      console.warn(
        `⚠ Position ${code} not found.`
      );
    }
  }

  // --------------------------------------------------
  // WORKFLOW STEPS
  // --------------------------------------------------

  const steps = [
    {
      order: 1,
      name: "Submit Request",
      action: "submit",
      position: null,
    },

    {
      order: 2,
      name: "SBU Head Review",
      action: "minute",
      position: sbuHead?._id ?? null,
    },

    {
      order: 3,
      name: "Administration Review",
      action: "review",
      position: administration?._id ?? null,
    },

    {
      order: 4,
      name: "ICC Review",
      action: "review",
      position: icc?._id ?? null,
    },

    {
      order: 5,
      name: "SBU Finance Approval",
      action: "approve",
      position: sbuFinance?._id ?? null,
    },

    {
      order: 6,
      name: "CEO Approval",
      action: "approve",
      position: ceo?._id ?? null,
    },

    {
      order: 7,
      name: "Complete",
      action: "complete",
      position: null,
    },
  ];

  // --------------------------------------------------
  // CREATE MISSING STEPS
  // --------------------------------------------------

  for (const step of steps) {
    const exists = await WorkflowStep.findOne({
      workflow: workflow._id,
      order: step.order,
    });

    if (exists) {
      continue;
    }

    await WorkflowStep.create({
      workflow: workflow._id,
      ...step,
      required: true,
      allowDelegate: false,
    });

    console.log(
      `✔ Workflow Step ${step.order}: ${step.name}`
    );
  }

  console.log(
    "✅ Procurement Workflow Seed Complete"
  );

  return workflow;
}