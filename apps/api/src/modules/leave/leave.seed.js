import LeaveType from "./leaveType.model.js";

const DEFAULT_TYPES = [
  { name: "Annual Leave", code: "ANNUAL", daysPerYear: 20, paid: true },
  { name: "Sick Leave", code: "SICK", daysPerYear: 10, paid: true },
  { name: "Casual Leave", code: "CASUAL", daysPerYear: 5, paid: true },
  { name: "Maternity Leave", code: "MATERNITY", daysPerYear: 90, paid: true },
  { name: "Paternity Leave", code: "PATERNITY", daysPerYear: 10, paid: true },
  { name: "Compassionate Leave", code: "COMPASSIONATE", daysPerYear: 5, paid: true },
  { name: "Study Leave", code: "STUDY", daysPerYear: 10, paid: false },
  { name: "Unpaid Leave", code: "UNPAID", daysPerYear: 365, paid: false },
];

export async function seedLeave(company) {
  for (const type of DEFAULT_TYPES) {
    await LeaveType.updateOne(
      { company: company._id, code: type.code },
      { $setOnInsert: { company: company._id, ...type, carryForward: false, requiresApproval: true, active: true } },
      { upsert: true }
    );
  }
  console.log(`✔ Seeded ${DEFAULT_TYPES.length} leave types`);
}
