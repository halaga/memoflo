import LeaveType from "./leaveType.model.js";

const DEFAULT_TYPES = [
  { name: "Annual Leave", code: "ANNUAL", daysPerYear: 20, paid: true, carryForward: false },
  { name: "Sick Leave", code: "SICK", daysPerYear: 10, paid: true, carryForward: false },
  { name: "Casual Leave", code: "CASUAL", daysPerYear: 5, paid: true, carryForward: false },
];

export async function seedLeave(company) {
  for (const type of DEFAULT_TYPES) {
    await LeaveType.updateOne(
      { company: company._id, code: type.code },
      { $setOnInsert: { company: company._id, ...type } },
      { upsert: true }
    );
  }
  console.log(`✔ Seeded ${DEFAULT_TYPES.length} leave types`);
}
